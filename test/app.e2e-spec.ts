import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';

import { AppModule } from '../src/app.module';
import { LoggerService } from '../src/core/logger/logger.service';
import { LoggerInterceptor } from '../src/common/interceptors/logger.interceptor';
import { ResponseInterceptor } from '../src/common/interceptors/response.intercepter';
import { AllExceptionsFilter } from '../src/common/filters/exception.filter';
import { AuthChallengeRepository } from '../src/modules/auth/auth.repository';
import { AuthChallenge } from '../src/modules/auth/entities/auth.entity';
import { UsersService } from '../src/modules/users/users.service';

const setupApp = async (application: INestApplication) => {
  const logger = application.get(LoggerService);
  application.useLogger(logger);
  application.setGlobalPrefix('api');
  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  application.useGlobalInterceptors(
    new LoggerInterceptor(logger),
    new ResponseInterceptor(),
  );
  application.useGlobalFilters(new AllExceptionsFilter(logger));

  await application.init();
};

const apiPath = (path: string) => `/api${path}`;

const expectSuccessEnvelope = (res: request.Response) => {
  expect(res.body).toEqual(
    expect.objectContaining({
      success: true,
      data: expect.any(Object),
      timestamp: expect.any(String),
    }),
  );
};

const randomIp = () => `203.0.113.${Math.floor(Math.random() * 200) + 1}`;

type MockUser = {
  id: string;
  walletAddress: string;
  email: string | null;
  username?: string | null;
  lastLoginAt: Date | null;
};

const createChallengeRepositoryMock = () => {
  const challenges = new Map<string, AuthChallenge>();

  return {
    repo: {
      createChallenge: (data: {
        walletAddress: string;
        nonce: string;
        message: string;
        expiresAt: Date;
      }): Promise<AuthChallenge> => {
        const entity = Object.assign(new AuthChallenge(), {
          id: randomUUID(),
          walletAddress: data.walletAddress,
          nonce: data.nonce,
          message: data.message,
          expiresAt: data.expiresAt,
          usedAt: null as Date | null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        challenges.set(entity.id, entity);
        return Promise.resolve(entity);
      },
      deleteExpired: (walletAddress: string): Promise<void> => {
        const now = Date.now();
        for (const [id, challenge] of challenges) {
          if (
            challenge.walletAddress === walletAddress &&
            challenge.usedAt === null &&
            challenge.expiresAt.getTime() < now
          ) {
            challenges.delete(id);
          }
        }
        return Promise.resolve();
      },
      invalidateOpenChallenges: (walletAddress: string): Promise<void> => {
        for (const challenge of challenges.values()) {
          if (
            challenge.walletAddress === walletAddress &&
            challenge.usedAt === null
          ) {
            challenge.usedAt = new Date();
          }
        }
        return Promise.resolve();
      },
      findValidChallenge: (
        walletAddress: string,
        message: string,
      ): Promise<AuthChallenge | null> => {
        const now = Date.now();
        for (const challenge of challenges.values()) {
          if (
            challenge.walletAddress === walletAddress &&
            challenge.message === message &&
            challenge.usedAt === null &&
            challenge.expiresAt.getTime() > now
          ) {
            return Promise.resolve(challenge);
          }
        }
        return Promise.resolve(null);
      },
      markUsed: (id: string): Promise<void> => {
        const challenge = challenges.get(id);
        if (challenge) {
          challenge.usedAt = new Date();
          challenge.updatedAt = new Date();
        }
        return Promise.resolve();
      },
    } satisfies Partial<AuthChallengeRepository>,
    reset: () => challenges.clear(),
  };
};

const createUsersServiceMock = () => {
  const users = new Map<string, MockUser>();

  const findByWallet = (walletAddress: string) => {
    const normalized = walletAddress.toLowerCase();
    for (const user of users.values()) {
      if (user.walletAddress === normalized) {
        return user;
      }
    }
    return undefined;
  };

  return {
    service: {
      upsertWalletUser: ({ walletAddress }: { walletAddress: string }) => {
        const normalized = walletAddress.toLowerCase();
        let user = findByWallet(normalized);
        if (!user) {
          user = {
            id: randomUUID(),
            walletAddress: normalized,
            email: null,
            lastLoginAt: new Date(),
          };
          users.set(user.id, user);
        }
        return Promise.resolve(user);
      },
      findByWalletAddress: (walletAddress: string) => {
        const user = findByWallet(walletAddress);
        return Promise.resolve(user ?? null);
      },
      findById: (id: string) => {
        const user = users.get(id) ?? null;
        return Promise.resolve(user);
      },
      getProfileById: (id: string) => {
        const user = users.get(id);
        if (!user) {
          return Promise.resolve(null);
        }
        return Promise.resolve(user);
      },
      updateLastLogin: (id: string) => {
        const user = users.get(id);
        if (user) {
          user.lastLoginAt = new Date();
        }
        return Promise.resolve();
      },
      updateProfile: (
        id: string,
        payload: Partial<Pick<MockUser, 'email' | 'username'>>,
      ) => {
        const user = users.get(id);
        if (!user) {
          return Promise.resolve(null);
        }
        if (payload.email !== undefined) {
          user.email = payload.email;
        }
        if (payload.username !== undefined) {
          user.username = payload.username;
        }
        users.set(id, user);
        return Promise.resolve(user);
      },
    } as Partial<UsersService>,
    reset: () => users.clear(),
  };
};

const createE2EApp = async ({ disableThrottle = false } = {}) => {
  const challengeMock = createChallengeRepositoryMock();
  const usersMock = createUsersServiceMock();

  let moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthChallengeRepository)
    .useValue(challengeMock.repo as AuthChallengeRepository)
    .overrideProvider(UsersService)
    .useValue(usersMock.service as UsersService);

  if (disableThrottle) {
    moduleBuilder = moduleBuilder
      .overrideProvider(ThrottlerGuard)
      .useValue({ canActivate: () => Promise.resolve(true) } satisfies Pick<
        ThrottlerGuard,
        'canActivate'
      >);
  }

  const moduleRef = await moduleBuilder.compile();

  const app = moduleRef.createNestApplication();
  await setupApp(app);

  return { app, challengeMock, usersMock };
};

describe('Authentication E2E', () => {
  let app: INestApplication;
  let challengeMock: ReturnType<typeof createChallengeRepositoryMock>;
  let usersMock: ReturnType<typeof createUsersServiceMock>;

  beforeAll(async () => {
    ({ app, challengeMock, usersMock } = await createE2EApp({
      disableThrottle: true,
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    challengeMock.reset();
    usersMock.reset();
  });

  describe('POST /auth/auth-request', () => {
    it('should return auth message', async () => {
      const wallet = ethers.Wallet.createRandom();
      const ip = randomIp();

      const res = await request(app.getHttpServer())
        .post(apiPath('/auth/auth-request'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address })
        .expect(201);

      expectSuccessEnvelope(res);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          walletAddress: wallet.address.toLowerCase(),
          message: expect.any(String),
          nonce: expect.any(String),
          expiresAt: expect.any(String),
        }),
      );
    });

    it('should reject invalid wallet', async () => {
      await request(app.getHttpServer())
        .post(apiPath('/auth/auth-request'))
        .send({ walletAddress: 'invalid' })
        .expect(400);
    });

    it('should normalize wallet to lowercase', async () => {
      const wallet = ethers.Wallet.createRandom();
      const ip = randomIp();
      const res = await request(app.getHttpServer())
        .post(apiPath('/auth/auth-request'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address.toUpperCase() })
        .expect(201);

      expectSuccessEnvelope(res);
      expect(res.body.data.walletAddress).toBe(wallet.address.toLowerCase());
    });
  });

  describe('POST /auth/verify', () => {
    it('should return JWT for valid signature', async () => {
      const wallet = ethers.Wallet.createRandom();
      const ip = randomIp();

      const authRes = await request(app.getHttpServer())
        .post(apiPath('/auth/auth-request'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address })
        .expect(201);

      const { message } = authRes.body.data;
      const signature = await wallet.signMessage(message);

      const verifyRes = await request(app.getHttpServer())
        .post(apiPath('/auth/verify'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address, signature, message })
        .expect(201);

      expectSuccessEnvelope(verifyRes);
      expect(verifyRes.body.data).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          user: expect.objectContaining({
            walletAddress: wallet.address.toLowerCase(),
          }),
        }),
      );
    });

    it('should reject invalid signature', async () => {
      const wallet = ethers.Wallet.createRandom();
      const otherWallet = ethers.Wallet.createRandom();
      const ip = randomIp();

      const authRes = await request(app.getHttpServer())
        .post(apiPath('/auth/auth-request'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address })
        .expect(201);

      const { message } = authRes.body.data;
      const signature = await otherWallet.signMessage(message);

      await request(app.getHttpServer())
        .post(apiPath('/auth/verify'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address, signature, message })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    let protectedContext: {
      app: INestApplication;
      challengeMock: ReturnType<typeof createChallengeRepositoryMock>;
      usersMock: ReturnType<typeof createUsersServiceMock>;
    };

    beforeAll(async () => {
      protectedContext = await createE2EApp({ disableThrottle: true });
    });

    afterAll(async () => {
      await protectedContext.app.close();
    });

    afterEach(() => {
      protectedContext.challengeMock.reset();
      protectedContext.usersMock.reset();
    });

    const authenticate = async () => {
      const wallet = ethers.Wallet.createRandom();
      const ip = randomIp();

      const authRes = await request(protectedContext.app.getHttpServer())
        .post(apiPath('/auth/auth-request'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address })
        .expect(201);

      const { message } = authRes.body.data;
      const signature = await wallet.signMessage(message);

      const verifyRes = await request(protectedContext.app.getHttpServer())
        .post(apiPath('/auth/verify'))
        .set('X-Forwarded-For', ip)
        .send({ walletAddress: wallet.address, signature, message })
        .expect(201);

      return {
        wallet,
        accessToken: verifyRes.body.data.accessToken as string,
      };
    };

    it('should access profile with valid token', async () => {
      const { wallet, accessToken } = await authenticate();

      await request(protectedContext.app.getHttpServer())
        .get(apiPath('/auth/profile'))
        .set('X-Forwarded-For', randomIp())
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expectSuccessEnvelope(res);
          expect(res.body.data).toEqual(
            expect.objectContaining({
              user: expect.objectContaining({
                walletAddress: wallet.address.toLowerCase(),
              }),
            }),
          );
        });
    });

    it('should reject access without token', async () => {
      await request(protectedContext.app.getHttpServer())
        .get(apiPath('/auth/profile'))
        .set('X-Forwarded-For', randomIp())
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(protectedContext.app.getHttpServer())
        .get(apiPath('/auth/profile'))
        .set('X-Forwarded-For', randomIp())
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    let rateLimitedApp: INestApplication;
    let challengeMock: ReturnType<typeof createChallengeRepositoryMock>;
    let usersMock: ReturnType<typeof createUsersServiceMock>;

    beforeAll(async () => {
      ({
        app: rateLimitedApp,
        challengeMock,
        usersMock,
      } = await createE2EApp());
    });

    afterAll(async () => {
      challengeMock.reset();
      usersMock.reset();
      await rateLimitedApp.close();
    });

    it('should block after too many requests', async () => {
      const wallet = ethers.Wallet.createRandom();
      const server = rateLimitedApp.getHttpServer();

      for (let i = 0; i < 5; i++) {
        await request(server)
          .post(apiPath('/auth/auth-request'))
          .send({ walletAddress: wallet.address })
          .expect(201);
      }

      await request(server)
        .post(apiPath('/auth/auth-request'))
        .send({ walletAddress: wallet.address })
        .expect(429);
    });
  });
});

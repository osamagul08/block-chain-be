# Blockchain Wallet Auth API

Robust NestJS backend for passwordless authentication using Ethereum wallets. The service issues nonce challenges, verifies signed responses, manages user profiles, and exposes a Swagger-documented REST API suitable for decentralized or Web3-enabled applications.

> Keep this README updated as the project grows. Add new features, endpoints, or architecture notes as they ship.

---

## Features

1. **Wallet-based authentication** – Sign-In-With-Ethereum (SIWE) style flow using challenge/response signatures.
2. **JWT session tokens** – Stateless bearer tokens with configurable expiration.
3. **User profile management** – Username & email updates tied to unique wallet addresses.
4. **Centralized logging** – Winston-based structured logger with file outputs for debugging.
5. **Database access layer** – TypeORM repositories for Microsoft SQL Server.
6. **Swagger documentation** – Auto-generated docs at `/api/docs` with persisted auth sessions.
7. **Dockerized local stack** – One command to start API + SQL Server.

## Tech Stack

- **Runtime**: Node.js, NestJS 11, TypeScript 5
- **Persistence**: TypeORM 0.3 with Microsoft SQL Server
- **Auth & Security**: Passport JWT, `ethers` for signature verification, class-validator pipes
- **Documentation**: @nestjs/swagger, Swagger UI Express
- **Tooling**: ESLint, Prettier, Jest, Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker (optional but recommended for local DB)
- SQL Server instance (Docker service provided)

### Installation

```bash
git clone https://github.com/osamagul08/block-chain-be.git
cd block-chain-be
cp .env
npm install
```

### Database

```bash
# start SQL Server + API in watch mode
docker-compose up --build

# run migrations (after containers or local DB are ready)
npm run migration:run
```

If you prefer a local SQL Server instance, update `.env` with the correct host/credentials and skip Docker.

### Development Server

```bash
npm run start:dev
```

The API listens on `http://localhost:3000/api` by default. Swagger docs are available at `http://localhost:3000/api/docs`.

## Environment Variables

All variables are validated in `src/core/config/validation.ts`.

- `PORT` – API port (default `3000`).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – SQL Server connection.
- `JWT_SECRET`, `JWT_EXPIRES_IN` – JWT signing.
- `AUTH_MESSAGE_DOMAIN`, `AUTH_MESSAGE_URI`, `AUTH_CHAIN_ID` – Wallet challenge metadata.

## Database Schema

- `users` – Wallet-linked profiles with optional username/email metadata.
- `auth` – Nonce challenges with expiry and usage timestamps.

## Authentication Flow

1. **Request challenge** – Client sends wallet address to `/api/auth/auth-request`.
2. **Display message** – API returns nonce + SIWE-style message the wallet must sign.
3. **Sign & submit** – Client signs the message and posts signature + message to `/api/auth/verify`.
4. **Verification** – Service checks challenge validity, verifies signature with `ethers`, and upserts the user.
5. **Token issuance** – JWT is returned with `sub` (user ID) + wallet. Token is required for profile endpoints.
6. **Profile usage** – Authenticated requests include `Authorization: Bearer <token>` header.

## Deployment Guide

1. **Build the project**
   ```bash
   npm run build
   ```
2. **Ensure environment variables** – Provide production `.env` or configure host environment (consider using Key Vault/Secrets Manager).
3. **Database migrations** – Run `npm run migration:run` against the production database.
4. **Start application**
   ```bash
   NODE_ENV=production npm run start:prod
   ```
5. **Container deployment (optional)** – Adjust `docker-compose.yml` or craft a production Dockerfile image. Ensure the container links to managed SQL Server and seeds env vars securely.
6. **Monitoring & logs** – Mount or export `./src/log` directory if you rely on Winston file transports, or configure centralized logging in production.

## Contributing & Maintenance

- Run linting and unit tests before opening PRs.
- Update API docs and README when adding new controllers, environment variables, or deployment steps.
- Use feature branches and follow conventional commit messages when possible.

---

Need to update this document? Add changelog entries or inline notes so new contributors can follow along effortlessly.

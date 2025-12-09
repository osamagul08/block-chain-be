import { AuthConfigDefaults } from '../../common/constants/config.constants';

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT as string, 10) || 3000,
  db: {
    type: process.env.DB_TYPE || 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    loginMessageDomain:
      process.env.AUTH_MESSAGE_DOMAIN || AuthConfigDefaults.MessageDomain,
    loginMessageUri:
      process.env.AUTH_MESSAGE_URI || AuthConfigDefaults.MessageUri,
    chainId: parseInt(
      process.env.AUTH_CHAIN_ID || AuthConfigDefaults.ChainId.toString(),
      10,
    ),
  },
});

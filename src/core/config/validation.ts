import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(1433),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(4).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  AUTH_MESSAGE_DOMAIN: Joi.string().default('Wallet'),
  AUTH_MESSAGE_URI: Joi.string().uri().default('http://localhost:3000'),
});

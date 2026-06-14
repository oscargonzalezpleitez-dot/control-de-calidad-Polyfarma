import * as Joi from 'joi';

export default Joi.object({
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().optional(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('8h'),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().uri().required(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  MFA_ISSUER: Joi.string().default('PharmaQMS'),
  MFA_ENABLED: Joi.boolean().default(true),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_DURATION_MINUTES: Joi.number().default(30),
  AUDIT_RETENTION_YEARS: Joi.number().default(10),
});

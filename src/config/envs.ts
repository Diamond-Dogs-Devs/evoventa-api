import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  CLIENT_URLS: string[];
  DATABASE_URL: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    CLIENT_URLS: joi.array().items(joi.string()).required(),
    DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  CLIENT_URLS: process.env.CLIENT_URLS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  clientUrls: envVars.CLIENT_URLS,
  databaseUrl: envVars.DATABASE_URL,
};

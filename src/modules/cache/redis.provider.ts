import Redis from 'ioredis';
import { envs } from '../../config/envs';

export const RedisProvider = {
  provide: 'REDIS',
  useFactory: () => {
    return new Redis(envs.redisUrl);
  },
};

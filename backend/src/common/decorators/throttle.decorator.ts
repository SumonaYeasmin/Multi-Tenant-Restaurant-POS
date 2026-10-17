import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { RATE_LIMIT } from '../constants/rate-limit.constant';

export const ThrottleAuth = () =>
  Throttle({
    default: {
      ttl: RATE_LIMIT.AUTH.ttl,
      limit: RATE_LIMIT.AUTH.limit,
    },
  });

export const ThrottleRefreshToken = () =>
  Throttle({
    default: {
      ttl: RATE_LIMIT.REFRESH_TOKEN.ttl,
      limit: RATE_LIMIT.REFRESH_TOKEN.limit,
    },
  });

export const ThrottleLogin = () =>
  Throttle({
    default: {
      ttl: RATE_LIMIT.LOGIN.ttl,
      limit: RATE_LIMIT.LOGIN.limit,
    },
  });

export const NoThrottle = () => SkipThrottle();

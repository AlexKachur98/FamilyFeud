
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

export default rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => ipKeyGenerator(
    req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.ip
  ),
  message: "Too many login attempts, please try again later"
});

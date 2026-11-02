// Lightweight drop-in rate limiter for development and embedded microservices
export default function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const hits = new Map();

  return (req, res, next) => {
    if (options.skip && options.skip(req, res)) {
      return next();
    }
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const userHits = hits.get(ip) || [];
    const validHits = userHits.filter(t => now - t < windowMs);

    if (validHits.length >= max) {
      return res.status(429).json(options.message || { message: 'Too many requests, please try again later.' });
    }

    validHits.push(now);
    hits.set(ip, validHits);
    next();
  };
}


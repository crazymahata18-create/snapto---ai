/**
 * SnapTo AI — Rate Limiting Middleware
 */

const rateLimitStore = new Map();

function rateLimit(windowMs = 60000, maxRequests = 100) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const record = rateLimitStore.get(ip);
    
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
      return next();
    }

    record.count++;
    
    if (record.count > maxRequests) {
      res.set('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore) {
    if (now > record.resetAt) rateLimitStore.delete(ip);
  }
}, 300000);

module.exports = rateLimit;

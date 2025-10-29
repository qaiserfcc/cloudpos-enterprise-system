import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';

// Security configuration
const SECURITY_CONFIG = {
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
    MESSAGE: 'Too many requests from this IP, please try again later.',
    SKIP_SUCCESSFUL_REQUESTS: true
  },
  CORS_OPTIONS: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  HELMET_OPTIONS: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }
};

// Rate limiting middleware
export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
    max: max || SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS,
    message: SECURITY_CONFIG.RATE_LIMIT.MESSAGE,
    skipSuccessfulRequests: SECURITY_CONFIG.RATE_LIMIT.SKIP_SUCCESSFUL_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logSecurityEvent(req, 'Rate Limit Exceeded', 'High', 
        `Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message: SECURITY_CONFIG.RATE_LIMIT.MESSAGE,
        retryAfter: Math.round(windowMs! / 1000)
      });
    }
  });
};

// Specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const apiRateLimiter = createRateLimiter(); // Default rate limiting
export const strictRateLimiter = createRateLimiter(60 * 1000, 10); // 10 requests per minute

// CORS middleware
export const corsMiddleware = cors(SECURITY_CONFIG.CORS_OPTIONS);

// Helmet security middleware
export const helmetMiddleware = helmet(SECURITY_CONFIG.HELMET_OPTIONS);

// Input validation middleware
export const validateInput = (validationRules: any[]) => {
  return [
    ...validationRules,
    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logSecurityEvent(req, 'Input Validation Failed', 'Medium',
          `Invalid input detected: ${JSON.stringify(errors.array())}`);
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }
      next();
    }
  ];
};

// Common validation rules
export const validationRules = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  phoneNumber: body('phoneNumber').optional().isMobilePhone('any'),
  id: body('id').isUUID(),
  amount: body('amount').isFloat({ min: 0 }),
  text: body('text').isLength({ min: 1, max: 1000 }).trim().escape()
};

// API Key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;
  
  if (!apiKey) {
    logSecurityEvent(req, 'Missing API Key', 'Medium', 'Request made without API key');
    return res.status(401).json({ error: 'API key required' });
  }

  // Validate API key format
  if (!/^[a-zA-Z0-9_-]{32,}$/.test(apiKey as string)) {
    logSecurityEvent(req, 'Invalid API Key Format', 'Medium', 
      `Invalid API key format from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  // Here you would typically validate against your database
  // For now, we'll just check against environment variables
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey as string)) {
    logSecurityEvent(req, 'Invalid API Key', 'High', 
      `Invalid API key attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

// JWT token validation middleware
export const validateJWTToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logSecurityEvent(req, 'Missing JWT Token', 'Medium', 'Request made without JWT token');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Here you would typically verify the JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // req.user = decoded;
    next();
  } catch (error) {
    logSecurityEvent(req, 'Invalid JWT Token', 'High', 
      `Invalid JWT token from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  // Remove potentially dangerous properties
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  const sanitizeObject = (obj: any): any => {
    if (obj && typeof obj === 'object') {
      for (const key of dangerousKeys) {
        delete obj[key];
      }
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object') {
          obj[key] = sanitizeObject(value);
        } else if (typeof value === 'string') {
          // Basic XSS protection
          obj[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
      }
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// IP whitelisting middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP as string)) {
      logSecurityEvent(req, 'IP Not Whitelisted', 'High', 
        `Request from non-whitelisted IP: ${clientIP}`);
      return res.status(403).json({ error: 'Access denied from this IP address' });
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      logSecurityEvent(req, 'HTTP Error Response', 'Low', 
        `${req.method} ${req.url} returned ${res.statusCode}`, logData);
    }
  });
  
  next();
};

// File upload security middleware
export const secureFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      logSecurityEvent(req, 'Dangerous File Upload Attempt', 'High',
        `Attempted upload of file type: ${req.file.mimetype}`);
      return res.status(400).json({ error: 'File type not allowed' });
    }
    
    // Check file size (e.g., 10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      logSecurityEvent(req, 'Large File Upload Attempt', 'Medium',
        `Attempted upload of large file: ${req.file.size} bytes`);
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  next();
};

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|\||&)/,
    /(\b(OR|AND)\b.*\b(=|>|<|\!=)\b)/i
  ];
  
  const checkForSqlInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSqlInjection(value));
    }
    
    return false;
  };
  
  if (checkForSqlInjection(req.body) || checkForSqlInjection(req.query) || checkForSqlInjection(req.params)) {
    logSecurityEvent(req, 'SQL Injection Attempt', 'Critical',
      `Potential SQL injection detected in request`);
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
  
  next();
};

// Utility function to log security events
const logSecurityEvent = (
  req: Request,
  event: string,
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  details: string,
  metadata?: any
) => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url,
    metadata
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY ${severity}] ${event}: ${details}`, securityEvent);
  }
  
  // In production, you would send this to your logging service
  // logger.security(securityEvent);
};

// Combine all security middlewares
export const securityMiddleware = [
  helmetMiddleware,
  corsMiddleware,
  securityHeaders,
  requestLogger,
  sanitizeRequest,
  sqlInjectionProtection
];

// Export configuration for external use
export { SECURITY_CONFIG };
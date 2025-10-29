import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'combined';

// Define custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service = 'auth-service', ...meta } = info;
    return JSON.stringify({
      timestamp,
      level,
      service,
      message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/auth-error.log',
    level: 'error',
    format: customFormat
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/auth-combined.log',
    format: customFormat
  }));
}

// Create specialized loggers for different contexts
export const authLogger = {
  login: (data: any) => logger.info('User login attempt', { context: 'login', ...data }),
  loginSuccess: (data: any) => logger.info('User login successful', { context: 'login-success', ...data }),
  loginFailed: (data: any) => logger.warn('User login failed', { context: 'login-failed', ...data }),
  logout: (data: any) => logger.info('User logout', { context: 'logout', ...data }),
  register: (data: any) => logger.info('User registration attempt', { context: 'register', ...data }),
  registerSuccess: (data: any) => logger.info('User registration successful', { context: 'register-success', ...data }),
  registerFailed: (data: any) => logger.warn('User registration failed', { context: 'register-failed', ...data }),
  passwordReset: (data: any) => logger.info('Password reset requested', { context: 'password-reset', ...data }),
  tokenRefresh: (data: any) => logger.info('Token refresh', { context: 'token-refresh', ...data }),
  securityEvent: (data: any) => logger.warn('Security event', { context: 'security', ...data })
};

export { logger };
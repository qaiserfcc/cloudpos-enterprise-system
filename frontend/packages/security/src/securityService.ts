// Simple encryption using btoa/atob for demo purposes (use proper crypto library in production)
const simpleEncrypt = (data: string, key: string): string => {
  return btoa(data + key);
};

const simpleDecrypt = (encryptedData: string, key: string): string => {
  const decoded = atob(encryptedData);
  return decoded.substring(0, decoded.length - key.length);
};

const simpleHash = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

// Security configuration
const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'cloudpos-default-key',
  API_RATE_LIMIT: 1000, // requests per hour
  CSP_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
};

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  event: string;
  user?: string;
  ip?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  details: string;
  metadata?: Record<string, any>;
}

export interface SessionInfo {
  userId: string;
  email: string;
  role: string;
  loginTime: Date;
  lastActivity: Date;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

export interface SecurityAudit {
  passwordStrength: number;
  mfaEnabled: number;
  sessionSecurity: number;
  dataEncryption: number;
  overallScore: number;
  recommendations: string[];
}

class SecurityService {
  private static instance: SecurityService;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private securityEvents: SecurityEvent[] = [];
  private activeSessions: Map<string, SessionInfo> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Password Security
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    requirements: { met: boolean; text: string }[];
  } {
    const requirements = [
      { test: (p: string) => p.length >= SECURITY_CONFIG.PASSWORD_MIN_LENGTH, text: `At least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters` },
      { test: (p: string) => /[a-z]/.test(p), text: 'Contains lowercase letter' },
      { test: (p: string) => /[A-Z]/.test(p), text: 'Contains uppercase letter' },
      { test: (p: string) => /\d/.test(p), text: 'Contains number' },
      { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), text: 'Contains special character' },
      { test: (p: string) => !/(.)\1{2,}/.test(p), text: 'No repeated characters (3+)' },
      { test: (p: string) => !/^(.{1,2})\1+$/.test(p), text: 'Not a simple pattern' }
    ];

    const results = requirements.map(req => ({
      met: req.test(password),
      text: req.text
    }));

    const score = (results.filter(r => r.met).length / requirements.length) * 100;
    const isValid = score >= 70; // Require 70% compliance

    return { isValid, score, requirements: results };
  }

  public generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*()_+-='[Math.floor(Math.random() * 13)];

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Data Encryption
  public encryptData(data: string): string {
    try {
      return simpleEncrypt(data, SECURITY_CONFIG.ENCRYPTION_KEY);
    } catch (error) {
      this.logSecurityEvent('Encryption Failed', 'High', `Failed to encrypt data: ${error}`);
      throw new Error('Encryption failed');
    }
  }

  public decryptData(encryptedData: string): string {
    try {
      return simpleDecrypt(encryptedData, SECURITY_CONFIG.ENCRYPTION_KEY);
    } catch (error) {
      this.logSecurityEvent('Decryption Failed', 'High', `Failed to decrypt data: ${error}`);
      throw new Error('Decryption failed');
    }
  }

  public hashData(data: string, salt?: string): string {
    const saltValue = salt || Math.random().toString(36);
    return simpleHash(data + saltValue);
  }

  // Session Management
  public initializeSession(sessionInfo: Omit<SessionInfo, 'lastActivity'>): void {
    const session: SessionInfo = {
      ...sessionInfo,
      lastActivity: new Date()
    };
    
    this.activeSessions.set(sessionInfo.sessionId, session);
    this.startSessionTimeout();
    
    this.logSecurityEvent(
      'Session Started',
      'Low',
      `User ${sessionInfo.email} logged in`,
      { sessionId: sessionInfo.sessionId, ip: sessionInfo.ipAddress }
    );
  }

  public updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.activeSessions.set(sessionId, session);
      this.startSessionTimeout();
    }
  }

  public terminateSession(sessionId: string, reason: string = 'Manual logout'): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.delete(sessionId);
      this.logSecurityEvent(
        'Session Terminated',
        'Low',
        `Session ended: ${reason}`,
        { sessionId, user: session.email }
      );
    }
  }

  public terminateAllSessions(excludeSessionId?: string): void {
    Array.from(this.activeSessions.keys()).forEach(sessionId => {
      if (sessionId !== excludeSessionId) {
        this.terminateSession(sessionId, 'All sessions terminated');
      }
    });
  }

  private startSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.checkSessionTimeouts();
    }, 60000); // Check every minute
  }

  private checkSessionTimeouts(): void {
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - SECURITY_CONFIG.SESSION_TIMEOUT);

    Array.from(this.activeSessions.entries()).forEach(([sessionId, session]) => {
      if (session.lastActivity < timeoutThreshold) {
        this.terminateSession(sessionId, 'Session timeout');
      }
    });

    if (this.activeSessions.size > 0) {
      this.startSessionTimeout();
    }
  }

  // Login Attempt Tracking
  public recordLoginAttempt(identifier: string, success: boolean): boolean {
    const now = new Date();
    const attempt = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

    if (success) {
      this.loginAttempts.delete(identifier);
      return true;
    }

    // Check if lockout period has passed
    const lockoutExpiry = new Date(attempt.lastAttempt.getTime() + SECURITY_CONFIG.LOCKOUT_DURATION);
    if (now > lockoutExpiry) {
      attempt.count = 1;
    } else {
      attempt.count++;
    }

    attempt.lastAttempt = now;
    this.loginAttempts.set(identifier, attempt);

    if (attempt.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      this.logSecurityEvent(
        'Account Locked',
        'High',
        `Account locked due to ${attempt.count} failed login attempts`,
        { identifier, lockoutExpiry: lockoutExpiry.toISOString() }
      );
      return false;
    }

    this.logSecurityEvent(
      'Failed Login Attempt',
      'Medium',
      `Failed login attempt ${attempt.count}/${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}`,
      { identifier }
    );

    return attempt.count < SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  }

  public isAccountLocked(identifier: string): boolean {
    const attempt = this.loginAttempts.get(identifier);
    if (!attempt || attempt.count < SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    const lockoutExpiry = new Date(attempt.lastAttempt.getTime() + SECURITY_CONFIG.LOCKOUT_DURATION);
    return new Date() < lockoutExpiry;
  }

  // Security Event Logging
  public logSecurityEvent(
    event: string,
    severity: SecurityEvent['severity'],
    details: string,
    metadata?: Record<string, any>
  ): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      event,
      severity,
      details,
      ...(metadata && { metadata })
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY ${severity}] ${event}: ${details}`, metadata);
    }

    // Send to backend for persistent logging
    this.sendSecurityEventToBackend(securityEvent);
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendSecurityEventToBackend(_event: SecurityEvent): Promise<void> {
    try {
      // This would typically send to your backend API
      // await fetch('/api/security/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send security event to backend:', error);
    }
  }

  // Security Audit
  public performSecurityAudit(): SecurityAudit {
    const audit: SecurityAudit = {
      passwordStrength: this.auditPasswordStrength(),
      mfaEnabled: this.auditMFAStatus(),
      sessionSecurity: this.auditSessionSecurity(),
      dataEncryption: this.auditDataEncryption(),
      overallScore: 0,
      recommendations: []
    };

    audit.overallScore = (
      audit.passwordStrength +
      audit.mfaEnabled +
      audit.sessionSecurity +
      audit.dataEncryption
    ) / 4;

    audit.recommendations = this.generateSecurityRecommendations(audit);

    return audit;
  }

  private auditPasswordStrength(): number {
    // This would typically check current user's password policy compliance
    return 85; // Mock score
  }

  private auditMFAStatus(): number {
    // This would check if MFA is enabled for the current user
    return 90; // Mock score
  }

  private auditSessionSecurity(): number {
    const score = 80;
    return score;
  }

  private auditDataEncryption(): number {
    return 95; // Mock score - assuming encryption is properly configured
  }

  private generateSecurityRecommendations(audit: SecurityAudit): string[] {
    const recommendations: string[] = [];

    if (audit.passwordStrength < 90) {
      recommendations.push('Consider implementing stronger password requirements');
    }

    if (audit.mfaEnabled < 100) {
      recommendations.push('Enable two-factor authentication for enhanced security');
    }

    if (audit.sessionSecurity < 90) {
      recommendations.push('Review session timeout settings and implement stricter controls');
    }

    if (audit.dataEncryption < 95) {
      recommendations.push('Ensure all sensitive data is properly encrypted');
    }

    if (audit.overallScore < 85) {
      recommendations.push('Schedule a comprehensive security review');
    }

    return recommendations;
  }

  // Content Security Policy
  public applyContentSecurityPolicy(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = SECURITY_CONFIG.CSP_POLICY;
    document.head.appendChild(meta);
  }

  // Rate Limiting (client-side tracking)
  private apiRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  public checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const resetTime = now + hourMs;

    const current = this.apiRequestCounts.get(endpoint);
    
    if (!current || now > current.resetTime) {
      this.apiRequestCounts.set(endpoint, { count: 1, resetTime });
      return true;
    }

    if (current.count >= SECURITY_CONFIG.API_RATE_LIMIT) {
      this.logSecurityEvent(
        'Rate Limit Exceeded',
        'Medium',
        `API rate limit exceeded for endpoint: ${endpoint}`,
        { endpoint, count: current.count }
      );
      return false;
    }

    current.count++;
    return true;
  }

  // Getters
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  public getActiveSessions(): SessionInfo[] {
    return Array.from(this.activeSessions.values());
  }

  public getSecurityConfig() {
    return { ...SECURITY_CONFIG };
  }
}

export const securityService = SecurityService.getInstance();
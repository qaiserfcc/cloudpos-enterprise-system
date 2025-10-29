export { 
  securityService, 
  configureSecurityService,
  type SecurityEvent, 
  type SessionInfo, 
  type SecurityAudit 
} from './securityService';

// Re-export for easy access
export { securityService as default } from './securityService';
// src/utils/security-monitoring.ts
export const securityMonitor = {
  logSecurityEvent: (event: string, details?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Envoyer à votre service de monitoring
      console.warn(`[SECURITY] ${event}`, details);
    }
  },

  detectXSS: (input: string) => {
    const xssPatterns = [
      /<script\b[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /alert\(/i
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  },

  validateURL: (url: string) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
};
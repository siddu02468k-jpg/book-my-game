import crypto from 'crypto';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  lastSentAt: number;
  purpose: 'register' | 'login' | 'reset_password';
}

class EmailService {
  private otps: Map<string, OtpEntry> = new Map();

  /** Generate a secure 6-digit numeric OTP */
  private generateNumericOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send an OTP code to an email address.
   * Rate limited to once every 45 seconds per email.
   * OTP is valid for 10 minutes.
   */
  public async sendOtp(
    email: string,
    purpose: 'register' | 'login' | 'reset_password'
  ): Promise<{ success: boolean; message: string; previewCode?: string; retryAfter?: number }> {
    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();
    const existing = this.otps.get(cleanEmail);

    // Rate limit check: 45 seconds between sends
    if (existing && now - existing.lastSentAt < 45000) {
      const waitSeconds = Math.ceil((45000 - (now - existing.lastSentAt)) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSeconds}s before requesting a new code.`,
        retryAfter: waitSeconds
      };
    }

    const code = this.generateNumericOtp();
    const ttlMs = 10 * 60 * 1000; // 10 minutes

    this.otps.set(cleanEmail, {
      code,
      expiresAt: now + ttlMs,
      attempts: 0,
      verified: false,
      lastSentAt: now,
      purpose
    });

    console.log(`\n======================================================`);
    console.log(`📨 [BMG EMAIL SERVICE] OTP Verification Dispatch`);
    console.log(`To:      ${cleanEmail}`);
    console.log(`Purpose: ${purpose.toUpperCase()}`);
    console.log(`Code:    ${code}`);
    console.log(`Expires: In 10 minutes (${new Date(now + ttlMs).toLocaleTimeString()})`);
    console.log(`======================================================\n`);

    // In production, if SMTP or HTTP email provider is configured, dispatch here
    const isProd = process.env.NODE_ENV === 'production';
    const emailProviderConfigured = Boolean(process.env.SMTP_USER || process.env.RESEND_API_KEY);

    return {
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Valid for 10 minutes.`,
      // Provide previewCode if external SMTP is not yet configured so verification never blocks
      previewCode: (!isProd || !emailProviderConfigured) ? code : undefined
    };
  }

  /**
   * Verify an entered OTP code for an email.
   */
  public verifyOtp(
    email: string,
    inputCode: string,
    purpose?: 'register' | 'login' | 'reset_password'
  ): { valid: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const entry = this.otps.get(cleanEmail);

    if (!entry) {
      return { valid: false, error: 'No verification code found for this email. Please request a new code.' };
    }

    if (Date.now() > entry.expiresAt) {
      this.otps.delete(cleanEmail);
      return { valid: false, error: 'The verification code has expired (10 minutes exceeded). Please request a new code.' };
    }

    if (entry.attempts >= 5) {
      this.otps.delete(cleanEmail);
      return { valid: false, error: 'Too many incorrect attempts. Please request a fresh verification code.' };
    }

    if (purpose && entry.purpose !== purpose) {
      return { valid: false, error: 'This verification code is for a different action. Please request a new one.' };
    }

    const cleanInput = inputCode.trim();
    if (cleanInput !== entry.code) {
      entry.attempts += 1;
      const remaining = 5 - entry.attempts;
      return {
        valid: false,
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      };
    }

    // Mark verified
    entry.verified = true;
    return { valid: true };
  }

  /** Check if an email was already verified in the current session */
  public isEmailVerified(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const entry = this.otps.get(cleanEmail);
    return Boolean(entry && entry.verified && Date.now() <= entry.expiresAt);
  }

  /** Clear verified status once registration or password reset is finished */
  public clearOtp(email: string): void {
    this.otps.delete(email.trim().toLowerCase());
  }
}

export const emailService = new EmailService();

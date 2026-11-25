import crypto from 'crypto';
import https from 'https';

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

    // In production, if Resend or Brevo is configured, dispatch live email
    const dispatchedLive = await this.dispatchExternalEmail(cleanEmail, code, purpose);
    const isProd = process.env.NODE_ENV === 'production';
    const emailProviderConfigured = Boolean(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || process.env.SMTP_USER);

    return {
      success: true,
      message: dispatchedLive 
        ? `A 6-digit verification code has been delivered to ${cleanEmail}. Valid for 10 minutes.`
        : `A 6-digit verification code has been dispatched to ${cleanEmail}. Valid for 10 minutes.`,
      // Provide previewCode in development or if external provider is not configured
      previewCode: (!isProd || !emailProviderConfigured) ? code : undefined
    };
  }

  /**
   * Dispatch live HTML verification email to user inbox via Resend or Brevo API.
   * Zero external dependencies required.
   */
  private async dispatchExternalEmail(to: string, code: string, purpose: string): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'Book My Game <onboarding@resend.dev>';

    const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verification Code — Book My Game</title></head>
<body style="margin: 0; padding: 0; background-color: #0a0f0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0f0d; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #111815; border: 1px solid #1e2923; border-radius: 24px; padding: 36px 28px; text-align: center;">
          <tr>
            <td align="center">
              <div style="display: inline-block; padding: 10px 18px; background: linear-gradient(135deg, #15803d, #22c55e); border-radius: 12px; margin-bottom: 22px;">
                <span style="font-size: 18px; font-weight: 900; color: #000000; letter-spacing: 1.5px;">book my GAME</span>
              </div>
              <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; text-transform: uppercase;">Verify Your Account</h1>
              <p style="font-size: 13px; color: #94a3b8; margin: 0 0 24px 0;">Use the 6-digit code below to complete your ${purpose.replace('_', ' ')} on Book My Game Kurnool.</p>
              
              <div style="background-color: #0a0f0d; border: 2px dashed #22c55e; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #4ade80; font-family: monospace;">${code}</span>
              </div>

              <p style="font-size: 11px; color: #64748b; line-height: 1.6; margin: 0 0 16px 0;">
                ⏱️ This verification code is valid for <strong>10 minutes</strong>.<br>
                🔒 Never share this code with anyone. Book My Game staff will never ask for your code.
              </p>
              <div style="border-top: 1px solid #1e2923; padding-top: 16px; font-size: 10px; color: #475569;">
                Kurnool Sports Ground &amp; Turf Hourly Booking • Andhra Pradesh
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 1. Resend API
    if (resendApiKey) {
      try {
        const payload = JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: `${code} is your Book My Game verification code`,
          html: htmlContent
        });

        return await new Promise<boolean>((resolve) => {
          const req = https.request('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`✅ [BMG EMAIL] Live email delivered via Resend to ${to}`);
                resolve(true);
              } else {
                console.warn(`⚠️ [BMG EMAIL] Resend returned status ${res.statusCode}: ${data}`);
                resolve(false);
              }
            });
          });
          req.on('error', (err) => {
            console.warn(`⚠️ [BMG EMAIL] Resend connection error:`, err.message);
            resolve(false);
          });
          req.write(payload);
          req.end();
        });
      } catch (err: any) {
        console.warn('Resend dispatch failed:', err.message);
      }
    }

    // 2. Brevo API
    if (brevoApiKey) {
      try {
        const payload = JSON.stringify({
          sender: { name: 'Book My Game', email: process.env.SENDER_EMAIL || 'noreply@bookmygame.kurnool.dev' },
          to: [{ email: to }],
          subject: `${code} is your Book My Game verification code`,
          htmlContent
        });

        return await new Promise<boolean>((resolve) => {
          const req = https.request('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`✅ [BMG EMAIL] Live email delivered via Brevo to ${to}`);
                resolve(true);
              } else {
                resolve(false);
              }
            });
          });
          req.on('error', () => resolve(false));
          req.write(payload);
          req.end();
        });
      } catch (err: any) {
        console.warn('Brevo dispatch failed:', err.message);
      }
    }

    return false;
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

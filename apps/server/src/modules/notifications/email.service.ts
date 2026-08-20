import { config } from '../../config';
import { logger } from '../../lib/logger';

// ─────────────────────────────────────────────────────────────
// Email Service – pluggable (SMTP / Mock)
// ─────────────────────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verifyUrl = `${config.API_BASE_URL}/auth/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify your MediLoop account',
      html: `
        <h2>Welcome to MediLoop!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create a MediLoop account, you can safely ignore this email.</p>
      `,
      text: `Welcome to MediLoop! Please verify your email: ${verifyUrl}`,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${config.API_BASE_URL}/auth/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset your MediLoop password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your MediLoop password: ${resetUrl}`,
    });
  }

  async sendCaregiverInvitation(email: string, patientName: string, token: string): Promise<void> {
    const acceptUrl = `${config.API_BASE_URL}/caregivers/accept?token=${token}`;

    await this.send({
      to: email,
      subject: `${patientName} invited you to be their caregiver on MediLoop`,
      html: `
        <h2>Caregiver Invitation</h2>
        <p>${patientName} has invited you to help manage their medications on MediLoop.</p>
        <a href="${acceptUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Accept Invitation</a>
        <p>This invitation expires in 7 days.</p>
      `,
      text: `${patientName} invited you to MediLoop: ${acceptUrl}`,
    });
  }

  private async send(options: EmailOptions): Promise<void> {
    if (config.EMAIL_PROVIDER === 'mock' || config.NODE_ENV === 'test') {
      logger.info({ to: options.to, subject: options.subject }, '[MOCK EMAIL] Would send email');
      return;
    }

    // SMTP implementation
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
        ...options,
      });

      logger.info({ to: options.to, subject: options.subject }, 'Email sent');
    } catch (err) {
      logger.error({ err, to: options.to }, 'Failed to send email');
    }
  }
}

export const emailService = new EmailService();

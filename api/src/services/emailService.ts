import { Resend } from 'resend';
import config from '../config/env.js';
import { logger } from '../utils/logger.js';

const resend = new Resend(config.resendApiKey);

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: 'Verify your email',
    html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Welcome to ReviHub!</h2>
                <p>Your verification code is:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 16px; background: #f4f4f4; border-radius: 8px; text-align: center;">
                    ${code}
                </p>
                <p>The code expires in 10 minutes.</p>
                <p>If you didn't request this, just ignore this email.</p>
            </div>
        `,
  });

  if (error) {
    logger.error('Failed to send verification email', { error, to });
    throw new Error('Failed to send verification email');
  }
}

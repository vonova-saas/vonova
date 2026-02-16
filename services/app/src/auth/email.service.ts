import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Get email configuration from ConfigService
    const emailHost =
      this.configService.get<string>('env.emailHost') || process.env.EMAIL_HOST;
    const emailPort =
      this.configService.get<number>('env.emailPort') ||
      parseInt(process.env.EMAIL_PORT || '465', 10);
    const emailSecure =
      this.configService.get<boolean>('env.emailSecure') ??
      process.env.EMAIL_SECURE !== 'false';
    const emailUser =
      this.configService.get<string>('env.emailUser') || process.env.EMAIL_USER;
    const emailPassword =
      this.configService.get<string>('env.emailPassword') ||
      process.env.EMAIL_PASSWORD;

    // Create Nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailSecure, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const emailFrom =
        this.configService.get<string>('env.emailFrom') ||
        process.env.EMAIL_FROM;

      const mailOptions = {
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(` Email sent to ${options.to}`, info.messageId);
    } catch (err) {
      console.error(' Email send error:', err);
      throw new Error('Failed to send email');
    }
  }

  private emailTemplate(title: string, body: string): string {
    return `
  <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 40px 0; color: #333;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #9B99FE, #2BC8B7); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">ONYX</h1>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <h2 style="margin-top: 0; font-size: 20px; color: #111;">${title}</h2>
        <div style="font-size: 15px; line-height: 1.6; color: #444;">
          ${body}
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 13px; color: #6b7280;">
        © ${new Date().getFullYear()} Onyx. All rights reserved.<br/>
        <a href="onyxtap.com" style="color: #2BC8B7; text-decoration: none;">Visit Onyx</a>
      </div>
    </div>
  </div>`;
  }

  async sendVerificationEmail(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    const subject = 'Verify Your Email - Onyx';
    const html = this.emailTemplate(
      'Verify Your Email Address',
      `
      <p>Thank you for joining Onyx! Please use the following code to verify your email address:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 6px;">
        <h1 style="color: #2BC8B7; font-size: 32px; margin: 0;">${verificationCode}</h1>
      </div>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
    );

    const text = `Your Onyx verification code is ${verificationCode}. It expires in 10 minutes.`;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendPasswordResetEmail(
    email: string,
    resetCode: string,
  ): Promise<void> {
    const subject = 'Password Reset Request - Onyx';
    const html = this.emailTemplate(
      'Password Reset Request',
      `
      <p>You requested a password reset. Please use the following code to reset your password:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 6px;">
        <h1 style="color: #dc3545; font-size: 32px; margin: 0;">${resetCode}</h1>
      </div>
      <p>This code will expire in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
    );

    const text = `Your Onyx password reset code is ${resetCode}. It expires in 15 minutes.`;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendPasswordResetConfirmationEmail(email: string): Promise<void> {
    const subject = 'Your Onyx Password Has Been Reset';
    const html = this.emailTemplate(
      'Password Reset Successful',
      `
      <p>Your Onyx password has been <strong>successfully reset</strong>.</p>
      <p>If you did not perform this action, please contact our support team immediately.</p>
      <p>For your security, you have been logged out of all devices.</p>
    `,
    );

    const text = `Your Onyx password has been successfully reset. If this wasn't you, contact support immediately.`;

    await this.sendEmail({ to: email, subject, html, text });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to Onyx!';
    const html = this.emailTemplate(
      `Welcome to Onyx, ${name}!`,
      `
      <p>We're excited to have you on board </p>
      <p>You can now explore the full features of Onyx, from your personal portfolio card to our powerful e-commerce platform.</p>
      <p>If you have any questions, our support team is always here to help.</p>
    `,
    );

    const text = `Welcome to Onyx, ${name}! You can now enjoy the full features of our platform.`;

    await this.sendEmail({ to: email, subject, html, text });
  }
}

// Note: Backward compatibility functions removed as they require ConfigService injection
// Use EmailService through dependency injection instead

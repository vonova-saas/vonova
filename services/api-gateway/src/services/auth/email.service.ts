import { Resend } from "resend";
import { Env } from "../../config/env.config";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const resend = new Resend(Env.RESEND_API_KEY);

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await resend.emails.send({
      from: Env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent to ${options.to}`);
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw new Error("Failed to send email");
  }
};

// -----------------------------
// Email Template Wrapper
// -----------------------------
const emailTemplate = (title: string, body: string): string => {
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
      <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          © ${new Date().getFullYear()} Vonova. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  `;
};

// -----------------------------
// Email Functions
// -----------------------------

export const sendVerificationEmail = async (email: string, code: string): Promise<void> => {
  const title = "Verify Your Email Address";
  const body = `
    <p>Thank you for registering with Vonova!</p>
    <p>Please use the following verification code to verify your email address:</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
      <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #111; font-family: monospace;">${code}</h1>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Verify Your Email - Vonova",
    html: emailTemplate(title, body),
  });
};

export const sendPasswordResetEmail = async (email: string, code: string): Promise<void> => {
  const title = "Reset Your Password";
  const body = `
    <p>We received a request to reset your password.</p>
    <p>Please use the following reset code:</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
      <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #111; font-family: monospace;">${code}</h1>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes.</p>
    <p>If you didn't request a password reset, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Reset Your Password - Vonova",
    html: emailTemplate(title, body),
  });
};

export const sendPasswordResetConfirmationEmail = async (email: string): Promise<void> => {
  const title = "Password Reset Successful";
  const body = `
    <p>Your password has been successfully reset.</p>
    <p>If you didn't make this change, please contact our support team immediately.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Password Reset Confirmation - Vonova",
    html: emailTemplate(title, body),
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const title = "Welcome to Vonova!";
  const body = `
    <p>Hi ${name},</p>
    <p>Welcome to Vonova! We're excited to have you on board.</p>
    <p>Get started by exploring our platform and discover amazing learning opportunities.</p>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Happy learning!</p>
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to Vonova!",
    html: emailTemplate(title, body),
  });
};


import nodemailer from "nodemailer";
import { Env } from "../config/env.config";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Configuration for a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: Env.EMAIL_HOST,
  port: Env.EMAIL_PORT,
  secure: Env.EMAIL_SECURE,
  auth: {
    user: Env.EMAIL_USER,
    pass: Env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: Env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent");
  } catch (err) {
    console.error("Email send error: ", err);
    throw new Error("Failed to send verification email");
  }
};

export const sendVerificationEmail = async (
  email: string,
  verificationCode: string
): Promise<void> => {
  const subject = "Verify Your Email Address";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verify Your Email Address</h2>
      <p>Thank you for registering! Please use the following code to verify your email address:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #007bff; font-size: 32px; margin: 0;">${verificationCode}</h1>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    </div>
  `;

  const text = `
    Verify Your Email Address
    
    Thank you for registering! Please use the following code to verify your email address:
    
    ${verificationCode}
    
    This code will expire in 10 minutes.
    
    If you didn't create an account, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetCode: string
): Promise<void> => {
  const subject = "Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested a password reset. Please use the following code to reset your password:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #dc3545; font-size: 32px; margin: 0;">${resetCode}</h1>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
    </div>
  `;

  const text = `
    Password Reset Request
    
    You requested a password reset. Please use the following code to reset your password:
    
    ${resetCode}
    
    This code will expire in 10 minutes.
    
    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

export const sendPasswordResetConfirmationEmail = async (
  email: string
): Promise<void> => {
  const subject = "Password Reset Successful";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Successful</h2>
      <p>Your password has been successfully reset.</p>
      <p>If you didn't make this change, please contact our support team immediately.</p>
      <p>For security reasons, you have been logged out of all devices.</p>
    </div>
  `;

  const text = `
    Password Reset Successful
    
    Your password has been successfully reset.
    
    If you didn't make this change, please contact our support team immediately.
    
    For security reasons, you have been logged out of all devices.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const subject = "Welcome to Our Platform!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome ${name}!</h2>
      <p>Thank you for verifying your email and joining our platform.</p>
      <p>You can now enjoy all the features of our application.</p>
      <p>If you have any questions, feel free to contact our support team.</p>
    </div>
  `;

  const text = `
    Welcome ${name}!
    
    Thank you for verifying your email and joining our platform.
    
    You can now enjoy all the features of our application.
    
    If you have any questions, feel free to contact our support team.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};
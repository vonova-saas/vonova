import { type NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
});

// Gmail OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

async function createGmailTransporter() {
  try {
    const { token } = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_EMAIL,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: token as string,
      },
    });

    return transporter;
  } catch (error) {
    console.error('Error creating Gmail transporter:', error);
    throw new Error('Failed to create Gmail transporter');
  }
}

function createWelcomeEmailTemplate(userFirstname: string) {
  return {
    html: `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Welcome to Our Waitlist</title>
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
						line-height: 1.6;
						color: #333;
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
						background-color: #f9f9f9;
					}
					.container {
						background-color: white;
						padding: 40px;
						border-radius: 12px;
						box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
					}
					.header {
						text-align: center;
						margin-bottom: 30px;
					}
					.logo {
						width: 60px;
						height: 60px;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						border-radius: 12px;
						margin: 0 auto 20px;
						display: flex;
						align-items: center;
						justify-content: center;
						color: white;
						font-size: 24px;
						font-weight: bold;
					}
					.status-badge {
						display: inline-flex;
						align-items: center;
						gap: 8px;
						background-color: #f0f9ff;
						border: 1px solid #e0f2fe;
						padding: 8px 16px;
						border-radius: 24px;
						font-size: 14px;
						color: #0369a1;
						margin-bottom: 20px;
					}
					.pulse {
						width: 8px;
						height: 8px;
						background-color: #3b82f6;
						border-radius: 50%;
						animation: pulse 2s infinite;
					}
					@keyframes pulse {
						0%, 100% { opacity: 1; }
						50% { opacity: 0.5; }
					}
					h1 {
						color: #1f2937;
						font-size: 28px;
						margin-bottom: 16px;
					}
					.subtitle {
						color: #6b7280;
						font-size: 16px;
						margin-bottom: 30px;
					}
					.content {
						margin-bottom: 30px;
					}
					.feature-list {
						list-style: none;
						padding: 0;
						margin: 20px 0;
					}
					.feature-list li {
						padding: 8px 0;
						display: flex;
						align-items: center;
						gap: 12px;
					}
					.checkmark {
						width: 20px;
						height: 20px;
						background-color: #10b981;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						color: white;
						font-size: 12px;
					}
					.cta-section {
						background-color: #f8fafc;
						padding: 24px;
						border-radius: 8px;
						text-align: center;
						margin: 20px 0;
					}
					.footer {
						text-align: center;
						color: #6b7280;
						font-size: 14px;
						margin-top: 30px;
						padding-top: 20px;
						border-top: 1px solid #e5e7eb;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="logo">🚀</div>
						<div class="status-badge">
							<div class="pulse"></div>
							<span>AVAILABLE IN EARLY 2025</span>
						</div>
					</div>
					
					<h1>Welcome to the waitlist, ${userFirstname}!</h1>
					<p class="subtitle">You've successfully secured your spot. We'll hit you up the moment it's your turn to dive in.</p>
					
					<div class="content">
						<p>Thank you for joining our exclusive waitlist! You're now part of a select group who will get early access to our revolutionary AI-powered productivity platform.</p>
						
						<h3>What to expect:</h3>
						<ul class="feature-list">
							<li>
								<div class="checkmark">✓</div>
								<span>Priority access when we launch</span>
							</li>
							<li>
								<div class="checkmark">✓</div>
								<span>Exclusive updates on our development progress</span>
							</li>
							<li>
								<div class="checkmark">✓</div>
								<span>Special launch pricing and bonuses</span>
							</li>
							<li>
								<div class="checkmark">✓</div>
								<span>Direct feedback channel with our team</span>
							</li>
						</ul>
						
						<div class="cta-section">
							<h3>Stay Connected</h3>
							<p>Follow us on social media for behind-the-scenes updates and sneak peeks of what's coming.</p>
						</div>
					</div>
					
					<div class="footer">
						<p>Thanks for being awesome! 🎉</p>
						<p>The Team</p>
						<p style="margin-top: 20px; font-size: 12px;">
							If you have any questions, feel free to reply to this email.
						</p>
					</div>
				</div>
			</body>
			</html>
		`,
    text: `
			Welcome to the waitlist, ${userFirstname}!
			
			You've successfully secured your spot. We'll hit you up the moment it's your turn to dive in.
			
			Thank you for joining our exclusive waitlist! You're now part of a select group who will get early access to our revolutionary AI-powered productivity platform.
			
			What to expect:
			• Priority access when we launch
			• Exclusive updates on our development progress
			• Special launch pricing and bonuses
			• Direct feedback channel with our team
			
			Stay connected with us on social media for behind-the-scenes updates and sneak peeks of what's coming.
			
			Thanks for being awesome! 🎉
			The Team
			
			If you have any questions, feel free to reply to this email.
		`
  };
}

export async function POST(request: NextRequest) {
  let ip: string;
  const xForwardedForHeader = request.headers.get("x-forwarded-for");

  if (xForwardedForHeader) {
    ip = xForwardedForHeader.split(",")[0].trim();
  } else {
    ip = request.headers.get("x-real-ip")?.trim() ?? "127.0.0.1";
  }

  const result = await ratelimit.limit(ip);

  if (!result.success) {
    return NextResponse.json({ error: "Too many requests!" }, { status: 429 });
  }

  try {
    const { email, name, firstname } = await request.json();
    const userName = firstname || name || "there";

    // Create Gmail transporter
    const transporter = await createGmailTransporter();

    // Create email template
    const emailTemplate = createWelcomeEmailTemplate(userName);

    // Send email
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: "🎉 Welcome to the Waitlist - You're In!",
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json(
      {
        message: "Email sent successfully",
        messageId: info.messageId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);

    // Return specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        return NextResponse.json(
          { error: "Gmail authentication failed. Please check your credentials." },
          { status: 500 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: "Email quota exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
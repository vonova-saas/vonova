import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import configuration from '../common/config/configuration';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = configuration().RESEND_API_KEY;
    this.fromAddress = configuration().EMAIL_FROM ?? '';
    if (!apiKey?.trim()) {
      throw new Error('RESEND_API_KEY is required in .env');
    }
    if (!this.fromAddress.trim()) {
      throw new Error('EMAIL_FROM is required in .env');
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, html } = options;

    const result = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
    if (result.error) {
      const message =
        result.error.message || `Resend rejected email to ${to}`;
      this.logger.error(`Email send failed: ${message}`);
      throw new Error(message);
    }
  }
}

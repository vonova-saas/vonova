import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import configuration from '../common/config/configuration';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailSenderService {
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = configuration().RESEND_API_KEY;
    this.fromAddress = configuration().EMAIL_FROM!;
    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, html } = options;

    await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
  }
}

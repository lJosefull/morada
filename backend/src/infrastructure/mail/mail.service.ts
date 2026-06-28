import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.nova.com.co',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const from = process.env.SMTP_FROM || 'noreply@morada.app';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendUrl}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Confirma tu correo electrónico - Morada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Bienvenido a Morada</h2>
          <p>Gracias por registrarte. Para activar tu cuenta, confirma tu correo electrónico haciendo clic en el siguiente enlace:</p>
          <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Confirmar correo
          </a>
          <p style="color: #6b7280; font-size: 14px;">O copia este enlace en tu navegador:</p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${link}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Si no creaste esta cuenta, ignora este mensaje.</p>
        </div>
      `,
    });
  }
}

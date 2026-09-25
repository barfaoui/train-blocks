import nodemailer, { type Transporter } from 'nodemailer';

import { EmailDeliveryError } from '../data/types/errors';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: Transporter | undefined;

// Created on first use so the service still boots (and tests import cleanly) without SMTP
// settings. Locally they point at the Mailpit container from docker-compose.yml.
function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    // Nodemailer waits up to 2 minutes to connect and 10 for a stalled socket by default;
    // a request that sends mail would hang that long if the SMTP server stops answering.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export async function sendMail(message: MailMessage): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM ?? 'Training Planning <no-reply@localhost>',
      ...message,
    });
  } catch (error) {
    throw new EmailDeliveryError(error);
  }
}

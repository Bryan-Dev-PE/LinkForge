import nodemailer from 'nodemailer';
import { env, hasSmtpConfigured } from '../config/env';
import { logger } from '../utils/logger';

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!hasSmtpConfigured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

export async function sendMail(payload: MailPayload): Promise<boolean> {
  const smtp = getTransporter();
  if (!smtp) {
    logger.info(`[mail] Skipping email send (no SMTP configured). Recipient=${payload.to}`);
    return false;
  }
  try {
    await smtp.sendMail({
      from: env.smtp.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send email', error);
    return false;
  }
}
import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailProvider } from '../models/types';
import { logger } from '../utils/logger';

export class NodemailerEmailProvider implements EmailProvider {
  name = 'nodemailer';
  private transporter: nodemailer.Transporter;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  async sendEmail(params: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const mailOptions = {
        from: params.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        replyTo: params.replyTo,
        headers: params.trackingId ? {
          'X-Tracking-ID': params.trackingId
        } : undefined
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully via Nodemailer', {
        messageId: result.messageId,
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: result.messageId,
        providerResponse: result
      };
    } catch (error) {
      logger.error('Failed to send email via Nodemailer:', error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Nodemailer connection verification failed:', error);
      return false;
    }
  }
}

export class SESEmailProvider implements EmailProvider {
  name = 'ses';
  private sesClient: SESClient;

  constructor(config: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    this.sesClient = new SESClient({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      } : undefined
    });
  }

  async sendEmail(params: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const command = new SendEmailCommand({
        Source: params.from,
        Destination: {
          ToAddresses: [params.to]
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: params.text,
              Charset: 'UTF-8'
            },
            Html: params.html ? {
              Data: params.html,
              Charset: 'UTF-8'
            } : undefined
          }
        },
        ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
        Tags: params.trackingId ? [{
          Name: 'tracking-id',
          Value: params.trackingId
        }] : undefined
      });

      const result = await this.sesClient.send(command);
      
      logger.info('Email sent successfully via SES', {
        messageId: result.MessageId,
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: result.MessageId || 'unknown',
        providerResponse: result
      };
    } catch (error) {
      logger.error('Failed to send email via SES:', error);
      throw error;
    }
  }
}

export class SendGridEmailProvider implements EmailProvider {
  name = 'sendgrid';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      const msg = {
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html,
        replyTo: params.replyTo,
        customArgs: params.trackingId ? {
          'tracking-id': params.trackingId
        } : undefined
      };

      const result = await sgMail.send(msg);
      
      logger.info('Email sent successfully via SendGrid', {
        messageId: result[0].headers['x-message-id'],
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: result[0].headers['x-message-id'] || 'unknown',
        providerResponse: result[0]
      };
    } catch (error) {
      logger.error('Failed to send email via SendGrid:', error);
      throw error;
    }
  }
}

// Email Provider Factory
export class EmailProviderFactory {
  static createProvider(type: string, config: any): EmailProvider {
    switch (type.toLowerCase()) {
      case 'nodemailer':
      case 'smtp':
        return new NodemailerEmailProvider(config);
      case 'ses':
        return new SESEmailProvider(config);
      case 'sendgrid':
        return new SendGridEmailProvider(config.apiKey);
      default:
        throw new Error(`Unsupported email provider: ${type}`);
    }
  }
}
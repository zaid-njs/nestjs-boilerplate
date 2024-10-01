import { Injectable } from '@nestjs/common';
import { renderFile } from 'ejs';
import { htmlToText } from 'html-to-text';
import * as nodemailer from 'nodemailer';
import { join } from 'path';
import { ConfigService } from './config.service';

interface EmailUser {
  email: string;
  firstName?: string;
}

@Injectable()
export class EmailService {
  private from: string;
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get('EMAIL_FROM');
    this.baseUrl = this.configService.get('API_HOSTED_URL');
  }

  newTransport() {
    // SendGrid
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net', // SendGrid's SMTP host
      // port: 587, // ! Port 587 is used for TLS
      port: 465, // ! Port 465 is used for SSL; USE THIS ONLY IF TLS DOES NOT WORK
      auth: {
        user: this.configService.get('SENDGRID_USERNAME'),
        pass: this.configService.get('SENDGRID_PASSWORD'),
      },
    });
  }

  // Send the actual email
  async send(
    user: EmailUser,
    template: string,
    subject?: string,
    url?: string,
    payload?,
  ) {
    let attachments = [];
    const { email, firstName } = user;

    // 1) Render HTML based on a pug template
    const _path: string = join(
      __dirname,
      '..',
      '..',
      'views',
      'email',
      `${template}.ejs`,
    );

    const html = await renderFile(_path, {
      firstName: firstName,
      url: url,
      to: email,
      subject,
      payload,
      baseUrl: this.baseUrl,
    });

    if (!!payload?.attachments) {
      attachments = payload.attachments.map((file) => {
        return { path: file.url };
      });
    }

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: email,
      subject,
      html: html,
      text: htmlToText(html),
      attachments: attachments,
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    console.log('Email Sent Successfully');
  }

  async sendForgotPassword(user: EmailUser, payload: object) {
    await this.send(user, 'forgotPassword', 'Forgot Password', '', payload);
  }

  async sendClientCredentials(user: EmailUser, payload: object) {
    await this.send(user, 'sendCredential', 'Client Credentials', '', payload);
  }

  async sendEmailVerification(user: EmailUser, payload: object) {
    await this.send(user, 'verifyEmail', 'Email Verification', '', payload);
  }

  async sendOtpResend(user: EmailUser, payload: object) {
    await this.send(user, 'resendOtp', 'Resend OTP', '', payload);
  }
}

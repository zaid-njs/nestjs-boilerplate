import { Injectable } from '@nestjs/common';
import { renderFile } from 'ejs';
import { htmlToText } from 'html-to-text';
import * as nodemailer from 'nodemailer';
import { join } from 'path';
import { ConfigService } from 'src/config/config.service';

interface EmailUser {
  email: string;
  firstName?: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

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

    const _path: string =
      process.env.NODE_ENV === 'production'
        ? join(__dirname, '..', '..', 'views', 'email', `${template}.ejs`)
        : join(__dirname, '..', 'views', 'email', `${template}.ejs`);

    const html = await renderFile(_path, {
      firstName: firstName,
      url: url,
      to: email,
      subject,
      payload,
      baseUrl: this.configService.get('API_HOSTED_URL'),
    });

    if (!!payload?.attachments) {
      attachments = payload.attachments.map((file) => {
        return { path: file.url };
      });
    }

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject,
      html: html,
      text: htmlToText(html),
      attachments: attachments,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendForgotPassword(user: EmailUser, payload: object) {
    await this.send(user, 'forgotPassword', 'Forgot Password', '', payload);
  }

  async sendSignupEmail(user: EmailUser, payload: object) {
    await this.send(user, 'signupOtp', 'Email Verification', '', payload);
  }

  async sendOtpResend(user: EmailUser, payload: object) {
    await this.send(user, 'resendOtp', 'Resend OTP', '', payload);
  }
}

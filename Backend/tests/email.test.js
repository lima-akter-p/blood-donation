import assert from 'node:assert/strict';
import { afterEach, it } from 'node:test';
import nodemailer from 'nodemailer';
import { sendDonationStatusEmails } from '../utils/email.js';

const smtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM'];
const originalEnvironment = Object.fromEntries(smtpKeys.map((key) => [key, process.env[key]]));
const originalCreateTransport = nodemailer.createTransport;

afterEach(() => {
  for (const key of smtpKeys) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
  nodemailer.createTransport = originalCreateTransport;
});

it('sends individual status emails through configured SMTP and reports delivery', async () => {
  process.env.SMTP_HOST = 'smtp.example.test';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'smtp-user';
  process.env.SMTP_PASSWORD = 'smtp-password';
  process.env.MAIL_FROM = 'LifeDrop <no-reply@example.test>';
  const messages = [];
  let closed = false;
  nodemailer.createTransport = (configuration) => {
    assert.deepEqual(configuration, {
      host: 'smtp.example.test',
      port: 587,
      secure: false,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
    });
    return {
      async sendMail(message) {
        messages.push(message);
      },
      close() {
        closed = true;
      },
    };
  };

  const result = await sendDonationStatusEmails({
    recipients: ['requester@example.test', 'donor@example.test', 'requester@example.test'],
    subject: 'LifeDrop request update',
    text: 'The request was updated.',
  });

  assert.deepEqual(result, { sent: true, message: 'Email notification sent.' });
  assert.deepEqual(messages.map(({ to }) => to), ['requester@example.test', 'donor@example.test']);
  assert.equal(messages[0].from, 'LifeDrop <no-reply@example.test>');
  assert.equal(closed, true);
});

it('clearly reports when SMTP is not configured without creating a transport', async () => {
  for (const key of smtpKeys) delete process.env[key];
  nodemailer.createTransport = () => {
    throw new Error('Unconfigured SMTP must not create a transport.');
  };

  const result = await sendDonationStatusEmails({
    recipients: ['requester@example.test'],
    subject: 'LifeDrop request update',
    text: 'The request was updated.',
  });

  assert.deepEqual(result, {
    sent: false,
    message: 'The request status was updated, but email is not configured on the server.',
  });
});

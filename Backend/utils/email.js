import nodemailer from 'nodemailer';

function getSmtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();
  const from = process.env.MAIL_FROM?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;

  if (
    !host
    || !Number.isInteger(port)
    || port < 1
    || port > 65535
    || !['true', 'false'].includes(secureValue)
    || !from
    || Boolean(user) !== Boolean(password)
  ) {
    return null;
  }

  return {
    host,
    port,
    secure: secureValue === 'true',
    from,
    ...(user ? { auth: { user, pass: password } } : {}),
  };
}

export async function sendDonationStatusEmails({ recipients, subject, text }) {
  const addresses = [...new Set(recipients.filter((email) => typeof email === 'string' && email))];
  if (addresses.length === 0) {
    return { sent: false, message: 'No email recipient is available for this status update.' };
  }

  const configuration = getSmtpConfiguration();
  if (!configuration) {
    return {
      sent: false,
      message: 'The request status was updated, but email is not configured on the server.',
    };
  }

  const transport = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    ...(configuration.auth ? { auth: configuration.auth } : {}),
  });
  let delivered = 0;
  try {
    await Promise.all(addresses.map(async (to) => {
      try {
        await transport.sendMail({ from: configuration.from, to, subject, text });
        delivered += 1;
      } catch (error) {
        console.error('Donation status email delivery failed:', error.name || 'Error');
      }
    }));

    if (delivered === addresses.length) {
      return { sent: true, message: 'Email notification sent.' };
    }
    if (delivered > 0) {
      return {
        sent: false,
        message: 'The status was updated, but email could not be delivered to every recipient.',
      };
    }
    return {
      sent: false,
      message: 'The status was updated, but email notification could not be delivered.',
    };
  } finally {
    transport.close();
  }
}

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;
  let fromEmail = 'noreply@stayease.com';
  let fromName = 'StayEase Support';

  // If local environment credentials are missing, configure test or mock mailer
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      console.log('====== MOCK EMAIL SERVICE (PRODUCTION FALLBACK) ======');
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.message}`);
      console.log('======================================================');
      return { success: true, mock: true };
    }

    console.log('Configuring temporary Ethereal SMTP account for developer visual preview...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      fromEmail = testAccount.user;
    } catch (err) {
      // Offline fallback
      console.log('====== MOCK EMAIL SERVICE ======');
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.message}`);
      console.log('================================');
      return { success: true, mock: true };
    }
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    fromEmail = process.env.SMTP_EMAIL;
    if (process.env.FROM_EMAIL) fromEmail = process.env.FROM_EMAIL;
    if (process.env.FROM_NAME) fromName = process.env.FROM_NAME;
  }

  const message = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  const info = await transporter.sendMail(message);
  
  if (info && info.messageId) {
    console.log('Email sent: %s', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('====== ETHEREAL EMAIL PREVIEW URL ======');
      console.log(`Preview URL: ${previewUrl}`);
      console.log('========================================');
      info.previewUrl = previewUrl;
    }
  }
  return info;
};

module.exports = sendEmail;

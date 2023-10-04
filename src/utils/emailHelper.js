const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) create transporter
  const transporter = nodemailer.createTransport({
    // service: 'email'
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PWD
    }
    // active in email "less secure app" option
  });

  // 2) set options
  const mailOptions = {
    from: 'Ryan <ryan@test.com>',
    to: options.emailTo,
    subject: options.subject,
    text: options.text
    // html
  };

  // 3) send it
  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

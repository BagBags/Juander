const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: `"Juander Support" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your Juander Verification Code",
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendOtpEmail;

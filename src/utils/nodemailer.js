const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
});

transporter.verify((error, success) => {
    if (error || !success) {
        console.log(error);
    } else {
        console.log("Ready for messages.");
    }
});

module.exports = transporter;

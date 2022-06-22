const nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
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

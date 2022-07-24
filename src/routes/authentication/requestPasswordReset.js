const express = require("express");
const User = require("../../models/user");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const PasswordReset = require("../../models/passwordReset");
const router = express.Router();
const transporter = require("../../utils/nodemailer");

async function sendResetEmail({ _id, email }) {
    const resetString = uuidv4() + _id;
    const currentUrl = process.env.FRONTEND_URL;

    // Clear all existing reset records.
    await PasswordReset.deleteMany({ userId: _id });

    // Create the email message.
    const message = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password reset request — DollarPlanner",
        html: `
            <p>We have processed your request to reset your password.</p>
            <p>Please click <a href = "${
                currentUrl + "/reset-password/" + _id + "/" + resetString
            }">here</a> to reset your password.</p>
            <p>
                This link will expire in 1 hour.
            </p>
            <p>
                This is an automatically generated message. Please do not reply to this email.
            </p>
        `,
    };

    // Create the password reset record.
    await new PasswordReset({
        userId: _id,
        resetString: await bcrypt.hash(resetString, 10),
        dateCreated: Date.now(),
        dateExpired: Date.now() + 3600000,
    }).save();

    // Send the email.
    await transporter.sendMail(message);
}

async function sendUnregisteredEmail(email) {
    const message = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password reset request — DollarPlanner",
        html: `
            <p>
                You have recently requested a password reset for this email address, but our records show that
                you do not have a DollarPlanner account registered with this email address.
            </p>
            <p>
                If you did not request a password reset, you may ignore this email.
            </p>
            <p>
                Otherwise, you may click the link below to create a DollarPlanner account:
            </p>
            <a href="${process.env.FRONTEND_URL}/sign-up">${process.env.FRONTEND_URL}/sign-up</a>
            <p>
                This is an automatically generated message. Please do not reply to this email.
            </p>
        `,
    };
    await transporter.sendMail(message);
}

async function sendUnverifiedEmail({ email }) {
    const message = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password reset request — DollarPlanner ",
        html: `
            <p>
                You have recently requested a password reset for this email address, but our records show that
                you have not verified your email address for your DollarPlanner account.
            </p>
            <p>
                If you did not request a password reset, you may ignore this email.
            </p>
            <p>
                Otherwise, please search your inbox for our previous email to verify your account,
                or create a new account with the following link:
            </p>
            <a href="${process.env.FRONTEND_URL}/sign-up">${process.env.FRONTEND_URL}/sign-up</a>
            <p>
                This is an automatically generated message. Please do not reply to this email.
            </p>
        `,
    };
    await transporter.sendMail(message);
}

router.post("/", async (req, res) => {
    const email = req.body.email;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            await sendUnregisteredEmail(email);
            return res.status(200).json({
                title: "Password reset email sent.",
                description: "Please check your email.",
            });
        }
        if (!user.verified) {
            await sendUnverifiedEmail(user);
            return res.status(200).json({
                title: "Password reset email sent.",
                description: "Please check your email.",
            });
        }
        console.log(email);
        await sendResetEmail(user);
        res.status(200).json({
            title: "Password reset email sent.",
            description: "Please check your email.",
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            title: "Something went wrong.",
            description:
                "We couldn't send you an email with a link to reset your password. " +
                "Please try again later.",
        });
    }
});

module.exports = router;

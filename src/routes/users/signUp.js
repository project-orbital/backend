const express = require("express");
const router = express.Router();
const { hashPassword } = require("../../utils/crypto");
const { v4: uuidv4 } = require("uuid");
const transporter = require("../../utils/nodemailer");
const User = require("../../models/user");
const UserVerification = require("../../models/userVerification");

router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({
            $or: [{ email: req.body.email }, { username: req.body.username }],
        });
        // If the user doesn't exist, then we can go ahead with registration.
        if (!user) {
            await register(
                new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    username: req.body.username,
                    password: await hashPassword(req.body.password),
                    verified: false,
                })
            );
            return res.send("Please check your email to verify your account.");
        }
        if (user.username === req.body.username) {
            return res.status(409).json({
                cause: "username",
                reason: "That username is already taken.",
                resolution: "Please choose a different username.",
            });
        }
        if (user.verified) {
            return res.status(409).send({
                cause: "email",
                reason: "That email address is already in use.",
                resolution: "Please use a different email address.",
            });
        }
        res.status(401).send({
            cause: "email",
            reason: "That email address is registered, but not verified.",
            resolution: "Please check your email to verify your account.",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            cause: "unknown",
            reason: "An error occurred while signing up.",
            resolution: "Please try again.",
        });
    }
});

async function register(user) {
    const { _id, email } = await user.save();
    const uniqueString = uuidv4() + _id;
    const uniqueLink = `${process.env.FRONTEND_URL}/verify/${_id}/${uniqueString}`;
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your Email with DollarPlanner",
        html: `<p>Verify your email address to complete the signup and login to your account.</p>
                <p>This link expires in 6 hours.</p>
                <p>Click <a href="${uniqueLink}">here</a> to verify.</p>`,
    };
    await transporter.sendMail(mailOptions);
    const newVerification = new UserVerification({
        userId: _id,
        uniqueString: await hashPassword(uniqueString),
        dateCreated: Date.now(),
        dateExpired: Date.now() + 2160000,
    });
    return newVerification.save();
}

module.exports = router;

const express = require("express");
const router = express.Router();
const { hashPassword } = require("../../utils/crypto");
const { v4: uuidv4 } = require("uuid");
const transporter = require("../../utils/nodemailer");
const User = require("../../models/user");
const UserVerification = require("../../models/userVerification");

const registerUser = async (req) => {
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        password: await hashPassword(req.body.password),
        verified: false,
    });
    return newUser.save().then(({ _id, email }) => {
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
        return transporter.sendMail(mailOptions).then(async () => {
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: await hashPassword(uniqueString),
                dateCreated: Date.now(),
                dateExpired: Date.now() + 2160000,
            });
            return newVerification.save();
        });
    });
};

router.post("/", (req, res) => {
    User.findOne({ email: req.body.email }).then((user) => {
        if (user) {
            if (user.verified) {
                res.status(409).send({
                    cause: "email",
                    reason: "That email address is already in use.",
                    resolution: "Please use a different email address.",
                });
            } else {
                res.status(401).send({
                    cause: "email",
                    reason: "That email address is registered, but not verified. Please check your email to verify your account.",
                    resolution:
                        "Please check your email to verify your account.",
                });
            }
        } else {
            registerUser(req)
                .then(() => {
                    res.send("Please check your email to verify your account.");
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        cause: "unknown",
                        reason: "An error occurred signing up.",
                        resolution: "Please try again.",
                    });
                });
        }
    });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const { validatePassword, issueJWT } = require("../../utils/crypto");

router.post("/", async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        // Check that the user exists in the database.
        if (!user) {
            return res.status(401).json({
                cause: "username",
                reason: "Account does not exist.",
                resolution: "Please re-enter your credentials and try again.",
            });
        }
        // Check that the user's email is verified.
        if (!user.verified) {
            return res.status(401).json({
                cause: "verification",
                reason: "Account not verified.",
                resolution: "Please check your email to verify your account.",
            });
        }
        // Check that the user's hashed password matches the hash of the given password.
        const isValid = await validatePassword(
            req.body.password,
            user.password
        );
        if (!isValid) {
            return res.status(401).json({
                cause: "credentials",
                reason: "Incorrect username/password.",
                resolution: "Please re-enter your credentials and try again.",
            });
        }
        // The user has been validated, so issue them the JWT token.
        const token = issueJWT(user);
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 24 * 3600000), // cookie expires after 1 day
            httpOnly: true,
            sameSite: "strict",
        }).send();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            cause: "unknown",
            reason: "An error occurred while signing in.",
            resolution: "Please try again.",
        });
        next(error);
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const { validatePassword, issueJWT } = require("../../utils/crypto");

router.post("/", (req, res, next) => {
    User.findOne({ username: req.body.username })
        .then(async (user) => {
            if (!user) {
                return res.status(401).json({
                    cause: "user",
                    reason: "User does not exist.",
                    resolution:
                        "Please re-enter your credentials and try again.",
                });
            }
            const isValid = await validatePassword(
                req.body.password,
                user.password
            );
            if (isValid) {
                const token = issueJWT(user);
                res.cookie("jwt", token, {
                    expires: new Date(Date.now() + 24 * 3600000), // cookie will be removed after 1 day
                    httpOnly: true,
                    sameSite: "strict",
                }).send();
            } else {
                res.status(401).json({
                    cause: "credentials",
                    reason: "Incorrect username/password.",
                    resolution:
                        "Please re-enter your credentials and try again.",
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                cause: "unknown",
                reason: "An error occurred signing up.",
                resolution: "Please try again.",
            });
            next(err);
        });
});

module.exports = router;

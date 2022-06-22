const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const { validatePassword, issueJWT } = require("../../utils/crypto");

router.post("/", (req, res, next) => {
    User.findOne({ username: req.body.username })
        .then((user) => {
            if (!user) {
                return res
                    .status(401)
                    .json({ message: "User does not exist." });
            }
            const isValid = validatePassword(req.body.password, user.password);
            if (isValid) {
                const tokenObject = issueJWT(user);
                res.json({
                    token: tokenObject.token,
                    expiresIn: tokenObject.expires,
                });
            } else {
                res.status(401).json({
                    message: "Incorrect username/password.",
                });
            }
        })
        .catch((err) => next(err));
});

module.exports = router;

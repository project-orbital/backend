const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const {
    readIDFromRequestWithJWT,
    hashPassword,
    validatePassword,
} = require("../../utils/crypto");
const passport = require("passport");

// Get profile information
router.get(
    "/user-profile",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const profile = await User.findById(id).select(
                "firstName lastName username email -_id"
            );
            res.status(200).json(profile);
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

// Set profile information
// Email change not supported at the moment due to email verification requirements.
router.patch(
    "/user-profile",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { username } = await User.findById(id);
            console.log(await User.findById(id));
            // Check that new username is not already in use.
            if (username !== req.body.username) {
                const user = await User.findOne({
                    username: req.body.username,
                });
                if (user) {
                    return res.status(400).json({
                        username: "Username is already taken.",
                    });
                }
            }
            // Update the profile as the username is valid.
            const profile = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
            };
            await User.findByIdAndUpdate(id, { $set: profile });
            console.log(await User.findById(id));
            res.status(200).send("Profile updated successfully.");
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

// Set dark mode preference
router.post(
    "/dark-mode",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const pref = {
                "preferences.prefersDarkMode": req.body.prefersDarkMode,
            };
            await User.findOneAndUpdate({ _id: id }, { $set: pref });
            res.status(200).send("Dark mode preference updated.");
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

// Set account password
router.post(
    "/change-password",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            if (req.body.password.length < 8) {
                return res
                    .status(400)
                    .send("Password must be at least 8 characters.");
            }
            if (req.body.password !== req.body.confirmPassword) {
                return res.status(400).send("Passwords do not match.");
            }
            const hash = await hashPassword(req.body.password);
            await User.findOneAndUpdate(
                { _id: id },
                { $set: { password: hash } }
            );
            res.status(200).send("Password changed.");
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

// Delete account
router.delete(
    "/delete-account",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { password } = await User.findById(id);
            const isValidPassword = await validatePassword(
                req.body.password,
                password
            );
            if (!isValidPassword) {
                return res.status(401).send("Incorrect password.");
            }
            await User.findByIdAndDelete(id);
            res.status(200).send("Account deleted.");
        } catch (e) {
            console.log(e);
            res.status(500).send("Something went wrong.");
        }
    }
);

module.exports = router;

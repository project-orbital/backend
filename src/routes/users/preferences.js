const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const {
    readIDFromRequestWithJWT,
    hashPassword,
    validatePassword,
} = require("../../utils/crypto");
const passport = require("passport");

// Get user preferences
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { preferences } = await User.findById(id).select(
                "preferences -_id"
            );
            res.status(200).json(preferences);
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
            // Check that the old password is correct.
            const { password } = await User.findById(id);
            const isValid = await validatePassword(
                req.body.currentPassword,
                password
            );
            if (!isValid) {
                return res.status(401).json({
                    currentPassword: "Current password is incorrect.",
                });
            }
            // Validate the new password.
            if (req.body.password.length < 8) {
                return res.status(400).json({
                    password: "Password must be at least 8 characters long.",
                });
            }
            if (req.body.password !== req.body.confirmPassword) {
                return res.status(400).json({
                    confirmPassword: "Passwords must match.",
                });
            }
            // Update the password.
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
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

// Erase data
router.delete(
    "/erase-data",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { password } = await User.findById(id);
            const isValidPassword = await validatePassword(
                req.get("password"),
                password
            );
            if (!isValidPassword) {
                return res
                    .status(401)
                    .json({ password: "Incorrect password." });
            }
            res.status(200).json("Data erased.");
        } catch {
            res.status(500).json({ all: "Something went wrong." });
        }
    }
);

module.exports = router;

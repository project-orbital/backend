const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Account = require("../../models/account");
const Asset = require("../../models/portfolio/Asset");
const Liability = require("../../models/portfolio/Liability");
const Order = require("../../models/portfolio/Order");
const Payment = require("../../models/portfolio/Payment");
const Transaction = require("../../models/transaction");
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

// Set data storage preference
router.post(
    "/data-sync",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const pref = {
                "preferences.allowsDataStorage": req.body.allowsDataStorage,
            };
            await User.findByIdAndUpdate(id, { $set: pref });
            res.status(200).send("Data storage preference updated.");
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
            res.status(500).json({ unknown: "Something went wrong." });
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
                req.get("password"),
                password
            );
            if (!isValidPassword) {
                return res.status(401).json({
                    password: "Incorrect password.",
                    title: "Incorrect password.",
                    description: "Please enter your password again.",
                });
            }
            await User.findByIdAndDelete(id);
            await Transaction.deleteMany({ user_id: id });
            await Account.deleteMany({ user_id: id });
            await Asset.deleteMany({ user_id: id });
            await Liability.deleteMany({ user_id: id });
            await Order.deleteMany({ user_id: id });
            await Payment.deleteMany({ user_id: id });
            res.status(200).send("Account deleted.");
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                unknown: "Please try again.",
            });
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
                return res.status(401).json({
                    password: "Incorrect password.",
                    title: "Incorrect password.",
                    description: "Please enter your password again.",
                });
            }
            await Transaction.deleteMany({ user_id: id });
            await Account.deleteMany({ user_id: id });
            await Asset.deleteMany({ user_id: id });
            await Liability.deleteMany({ user_id: id });
            await Order.deleteMany({ user_id: id });
            await Payment.deleteMany({ user_id: id });
            res.status(200).json("Data erased.");
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                unknown: "Please try again.",
            });
        }
    }
);

module.exports = router;

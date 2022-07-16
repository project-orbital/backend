const express = require("express");
const router = express.Router();
const Account = require("../../models/account");
const Transaction = require("../../models/transaction");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");

// Create an account for a user.
router.post(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const account = await new Account({
                user_id: id,
                createdAt: new Date(),
                name: req.body.name,
                nickname: req.body.nickname,
            }).save();
            res.status(200).json(account);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific account of a user.
router.get(
    "/:accountId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const accountId = req.params.accountId;
            const userId = await readIDFromRequestWithJWT(req);
            const account = await Account.findById({
                _id: accountId,
                user_id: userId,
            });
            if (!account) {
                return res
                    .status(404)
                    .json({ message: "Account does not exist." });
            }
            res.status(200).json(account);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Retrieve all accounts of a user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const accounts = (await Account.find({ user_id: id })) ?? [];
            res.status(200).json(accounts);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific account of a user.
router.put(
    "/:accountId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const accountId = req.params.accountId;
            const userId = await readIDFromRequestWithJWT(req);
            const account = await Account.findOneAndUpdate(
                { _id: accountId, user_id: userId },
                { name: req.body.name, nickname: req.body.nickname },
                { new: true }
            );
            if (!account) {
                return res
                    .status(404)
                    .json({ title: "Account does not exist." });
            }
            res.status(200).json(account);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Delete a specific account of a user.
router.delete(
    "/:accountId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const accountId = req.params.accountId;
            const userId = await readIDFromRequestWithJWT(req);
            const account = await Account.findById({
                _id: accountId,
                user_id: userId,
            });
            if (!account) {
                return res
                    .status(404)
                    .json({ message: "Account does not exist." });
            }
            // Delete all transactions of the account.
            await Transaction.deleteMany({
                user_id: userId,
                account_id: accountId,
            });
            await Account.findOneAndDelete({ _id: accountId, user_id: userId });
            res.status(200).json({ title: "Account deleted." });
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

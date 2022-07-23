const express = require("express");
const router = express.Router();
const Account = require("../models/account");
const Transaction = require("../models/transaction");
const { readIDFromRequestWithJWT } = require("../utils/crypto");
const passport = require("passport");

// Create a transaction for a specific user and account.
router.post(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const account = await Account.findById(req.body.accountId);
            if (!account) {
                return res
                    .status(404)
                    .json({ message: "Account does not exist." });
            }
            if (account.user_id.toString() !== userId) {
                return res
                    .status(403)
                    .json({ message: "You are not authorized to do this." });
            }
            const transaction = await new Transaction({
                user_id: userId,
                account_id: req.body.accountId,
                createdAt: Date.now(),
                date: req.body.date,
                amount: req.body.amount,
                balance: req.body.balance,
                category: req.body.category,
                description: req.body.description,
            }).save();
            res.status(200).json(transaction);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific transaction.
router.get(
    "/:transactionId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const transactionId = req.params.transactionId;
            const transaction = await Transaction.findOne({
                _id: transactionId,
                user_id: userId,
            });
            if (!transaction) {
                return res
                    .status(404)
                    .json({ message: "Transaction does not exist." });
            }
            res.status(200).json(transaction);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Retrieve all transactions of a user or account.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            // Check if an account is selected, if so, return all transactions of that account.
            if (req.query.accountId) {
                const accountId = req.query.accountId;
                const transactions =
                    (await Transaction.find({
                        account_id: accountId,
                        user_id: userId,
                    })) ?? [];
                return res.status(200).json(transactions);
            }
            // Otherwise, return all transactions of the user.
            const transactions =
                (await Transaction.find({ user_id: userId })) ?? [];
            return res.status(200).json(transactions);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific transaction.
router.put(
    "/:transactionId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const transactionId = req.params.transactionId;
            const userId = await readIDFromRequestWithJWT(req);
            const transaction = await Transaction.findOneAndUpdate(
                { _id: transactionId, user_id: userId },
                req.body,
                { new: true }
            );
            if (!transaction) {
                return res
                    .status(404)
                    .json({ title: "Transaction does not exist." });
            }
            res.status(200).json(transaction);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Delete a specific transaction.
router.delete(
    "/:transactionId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const transactionId = req.params.transactionId;
            const userId = await readIDFromRequestWithJWT(req);
            const transaction = await Transaction.findById({
                _id: transactionId,
                user_id: userId,
            });
            if (!transaction) {
                return res
                    .status(404)
                    .json({ message: "Account does not exist." });
            }
            await Transaction.findOneAndDelete({
                _id: transactionId,
                user_id: userId,
            });
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

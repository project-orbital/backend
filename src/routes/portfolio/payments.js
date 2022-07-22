const passport = require("passport");
const express = require("express");
const router = express.Router();
const Payment = require("../../models/portfolio/Payment");
const Liability = require("../../models/portfolio/Liability");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Create a new payment for a specific user.
router.post(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const user = await User.findById(userId);
            if (!user) {
                return res
                    .status(404)
                    .json({ message: "User does not exist." });
            }
            const liabilityId = req.body.liabilityId;
            const liability = await Liability.findOne({
                _id: liabilityId,
                user_id: userId,
            });
            if (!liability) {
                return res
                    .status(404)
                    .json({ message: "Liability does not exist." });
            }
            const payment = await new Payment({
                user_id: userId,
                liability_id: liabilityId,
                createdAt: new Date(),
                date: req.body.date,
                amount: req.body.amount,
            }).save();
            res.status(200).json(payment);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific payment.
router.get(
    "/:paymentId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const paymentId = req.params.paymentId;
            const payment = await Payment.findOne({
                _id: paymentId,
                user_id: userId,
            });
            if (!payment) {
                return res
                    .status(404)
                    .json({ message: "Payment does not exist." });
            }
            res.status(200).json(payment);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Retrieve all payments of a user or liability.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            // Check if an liability is selected, if so, return all payments of that liability.
            if (req.query.liabilityId) {
                const liabilityId = req.query.liabilityId;
                const payments =
                    (await Payment.find({
                        user_id: userId,
                        liability_id: liabilityId,
                    })) ?? [];
                return res.status(200).json(payments);
            }
            const payments = (await Payment.find({ user_id: userId })) ?? [];
            return res.status(200).json(payments);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific payment.
router.put(
    "/:paymentId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const paymentId = req.params.paymentId;
            const userId = await readIDFromRequestWithJWT(req);
            const payment = await Payment.findOneAndUpdate(
                { _id: paymentId, user_id: userId },
                req.body,
                { new: true }
            );
            if (!payment) {
                return res
                    .status(404)
                    .json({ title: "Payment does not exist." });
            }
            res.status(200).json(payment);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Delete a specific payment.
router.delete(
    "/:paymentId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const paymentId = req.params.paymentId;
            const userId = await readIDFromRequestWithJWT(req);
            const payment = await Payment.findById({
                _id: paymentId,
                user_id: userId,
            });
            if (!payment) {
                return res
                    .status(404)
                    .json({ message: "Payment does not exist." });
            }
            await Payment.findOneAndDelete({
                _id: paymentId,
                user_id: userId,
            });
            res.status(200).json({ title: "Payment deleted." });
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

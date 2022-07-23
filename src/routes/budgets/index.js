const express = require("express");
const router = express.Router();
const Budget = require("../../models/budget");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");

// Create a budget for the user
router.post(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const budget = await new Budget({
                user_id: userId,
                budget: req.body.budget,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
            }).save();
            res.status(200).json(budget);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve the user's budget
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const budget = (await Budget.findOne({ user_id: userId })) ?? [];
            res.status(200).json(budget);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific transaction.
router.put(
    "/update",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const budget = await Budget.findOneAndUpdate(
                { user_id: userId },
                { budget: req.body.budget }
            );
            res.status(200).json(budget);
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
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            await Budget.findOneAndDelete({
                user_id: userId,
            });
            res.status(200).json({ title: "Budget deleted." });
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

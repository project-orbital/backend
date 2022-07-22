const passport = require("passport");
const express = require("express");
const router = express.Router();
const Liability = require("../../models/portfolio/Liability");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Create a new liability for a specific user.
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
            const liability = await new Liability({
                user_id: userId,
                createdAt: new Date(),
                name: req.body.name,
                description: req.body.description,
                amount: req.body.amount,
                interest: req.body.interest,
            }).save();
            res.status(200).json(liability);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific liability.
router.get(
    "/:liabilityId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const liabilityId = req.params.liabilityId;
            const liability = await Liability.findOne({
                _id: liabilityId,
                user_id: userId,
            });
            if (!liability) {
                return res
                    .status(404)
                    .json({ message: "Liability does not exist." });
            }
            res.status(200).json(liability);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Retrieve all liabilities of a user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const liabilities =
                (await Liability.find({ user_id: userId })) ?? [];
            return res.status(200).json(liabilities);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific liability.
router.put(
    "/:liabilityId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const liabilityId = req.params.liabilityId;
            const userId = await readIDFromRequestWithJWT(req);
            const liability = await Liability.findOneAndUpdate(
                { _id: liabilityId, user_id: userId },
                req.body,
                { new: true }
            );
            if (!liability) {
                return res
                    .status(404)
                    .json({ title: "Liability does not exist." });
            }
            res.status(200).json(liability);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Delete a specific liability.
router.delete(
    "/:liabilityId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const liabilityId = req.params.liabilityId;
            const userId = await readIDFromRequestWithJWT(req);
            const liability = await Liability.findById({
                _id: liabilityId,
                user_id: userId,
            });
            if (!liability) {
                return res
                    .status(404)
                    .json({ message: "Liability does not exist." });
            }
            await liability.findOneAndDelete({
                _id: liabilityId,
                user_id: userId,
            });
            res.status(200).json({ title: "Liability deleted." });
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

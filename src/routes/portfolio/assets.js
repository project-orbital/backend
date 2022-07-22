const passport = require("passport");
const express = require("express");
const router = express.Router();
const Asset = require("../../models/portfolio/Asset");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Create a new asset for a specific user.
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
            const asset = await new Asset({
                user_id: userId,
                createdAt: new Date(),
                name: req.body.name,
                symbol: req.body.symbol,
                price: req.body.price,
                yield: req.body.yield,
            }).save();
            res.status(200).json(asset);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific asset.
router.get(
    "/:assetId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const assetId = req.params.assetId;
            const asset = await Asset.findOne({
                _id: assetId,
                user_id: userId,
            });
            if (!asset) {
                return res
                    .status(404)
                    .json({ message: "Asset does not exist." });
            }
            res.status(200).json(asset);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Retrieve all assets of a user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const assets = (await Asset.find({ user_id: userId })) ?? [];
            return res.status(200).json(assets);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific asset.
router.put(
    "/:assetId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const assetId = req.params.assetId;
            const userId = await readIDFromRequestWithJWT(req);
            const asset = await Asset.findOneAndUpdate(
                { _id: assetId, user_id: userId },
                req.body,
                { new: true }
            );
            if (!asset) {
                return res.status(404).json({ title: "Asset does not exist." });
            }
            res.status(200).json(asset);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Delete a specific asset.
router.delete(
    "/:assetId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const assetId = req.params.assetId;
            const userId = await readIDFromRequestWithJWT(req);
            const asset = await Asset.findById({
                _id: assetId,
                user_id: userId,
            });
            if (!asset) {
                return res
                    .status(404)
                    .json({ message: "Asset does not exist." });
            }
            await Asset.findOneAndDelete({
                _id: assetId,
                user_id: userId,
            });
            res.status(200).json({ title: "Asset deleted." });
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

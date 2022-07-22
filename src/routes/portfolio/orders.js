const passport = require("passport");
const express = require("express");
const router = express.Router();
const Order = require("../../models/portfolio/Order");
const Asset = require("../../models/portfolio/Asset");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Create a new order for a specific user.
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
            const assetId = req.body.assetId;
            const asset = await Asset.findOne({
                _id: assetId,
                user_id: userId,
            });
            if (!asset) {
                return res
                    .status(404)
                    .json({ message: "Asset does not exist." });
            }
            const order = await new Order({
                user_id: userId,
                asset_id: assetId,
                createdAt: new Date(),
                date: req.body.date,
                amount: req.body.amount,
                price: req.body.price,
                fee: req.body.fee,
            }).save();
            res.status(200).json(order);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific order.
router.get(
    "/:orderId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const orderId = req.params.orderId;
            const order = await Order.findOne({
                _id: orderId,
                user_id: userId,
            });
            if (!order) {
                return res
                    .status(404)
                    .json({ message: "Order does not exist." });
            }
            res.status(200).json(order);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Retrieve all orders of a user or asset.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            // Check if an asset is selected, if so, return all orders of that asset.
            if (req.query.assetId) {
                const assetId = req.query.assetId;
                const orders =
                    (await Order.find({
                        user_id: userId,
                        asset_id: assetId,
                    })) ?? [];
                return res.status(200).json(orders);
            }
            const orders = (await Order.find({ user_id: userId })) ?? [];
            return res.status(200).json(orders);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

// Update a specific order.
router.put(
    "/:orderId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const userId = await readIDFromRequestWithJWT(req);
            const order = await Order.findOneAndUpdate(
                { _id: orderId, user_id: userId },
                req.body,
                { new: true }
            );
            if (!order) {
                return res.status(404).json({ title: "Order does not exist." });
            }
            res.status(200).json(order);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Delete a specific order.
router.delete(
    "/:orderId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const userId = await readIDFromRequestWithJWT(req);
            const order = await Order.findById({
                _id: orderId,
                user_id: userId,
            });
            if (!order) {
                return res
                    .status(404)
                    .json({ message: "Order does not exist." });
            }
            await Order.findOneAndDelete({
                _id: orderId,
                user_id: userId,
            });
            res.status(200).json({ title: "Order deleted." });
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

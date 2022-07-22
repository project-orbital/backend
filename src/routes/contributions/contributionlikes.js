const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Retrieve an array of contributions reported by the user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { likedContributions } = await User.findById(id);

            res.status(200).json(likedContributions);
        } catch {
            res.status(500).json({
                message: "Something went wrong.",
            });
        }
    }
);

module.exports = router;

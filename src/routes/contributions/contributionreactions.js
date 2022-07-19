const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Get contributions reported by a particular user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { reportedContributions } = await User.findById(id);
            res.status(200).json(reportedContributions);
        } catch {
            res.status(500).json({
                message: "Something went wrong.",
            });
        }
    }
);

module.exports = router;

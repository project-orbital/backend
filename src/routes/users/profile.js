const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../../models/user");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");

// Get profile information
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const profile = await User.findById(id).select(
                "firstName lastName username email -_id"
            );
            console.log(profile);
            res.status(200).json(profile);
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

// Set profile information
// Email change not supported at the moment due to email verification requirements.
router.patch(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { username } = await User.findById(id);
            // Check that new username is not already in use.
            if (username !== req.body.username) {
                const user = await User.findOne({
                    username: req.body.username,
                });
                if (user) {
                    return res.status(400).json({
                        username: "Username is already taken.",
                    });
                }
            }
            // Update the profile as the username is valid.
            const profile = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
            };
            await User.findByIdAndUpdate(id, { $set: profile });
            res.status(200).send("Profile updated successfully.");
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

module.exports = router;

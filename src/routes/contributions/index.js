const express = require("express");
const router = express.Router();
const Contribution = require("../../models/contribution");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");
const user = require("../../models/user");

// Create an account for a user.
router.post(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            //find the id specific username
            const { username } = await user.findById(id);
            const contribution = await new Contribution({
                username: username,
                header: req.body.header,
                summary: req.body.summary,
                link: req.body.link,
                submissionDate: new Date(),
            }).save();
            res.status(200).json(contribution);
        } catch {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve all accounts of a user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            await readIDFromRequestWithJWT(req);
            const contributions = (await Contribution.find()) ?? [];
            res.status(200).json(contributions);
        } catch {
            res.status(500).json({ message: "Something went wrong." });
        }
    }
);

module.exports = router;

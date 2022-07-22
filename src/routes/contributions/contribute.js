const express = require("express");
const router = express.Router();
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");
const user = require("../../models/user");
const Contribution = require("../../models/contribution");

// Create a contribution.
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
                submissionDate: Date.now(),
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

module.exports = router;

const express = require("express");
const router = express.Router();
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");
const user = require("../../models/user");
const Contribution = require("../../models/contribution/contribution");

// Create a contribution.
router.post(
    "/contribute",
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

// Retrieve all contributions.
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

//Update contribution with user who reported it and report text.
router.put(
    "/report/:id",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const UserId = await readIDFromRequestWithJWT(req);
            const contributionId = req.params.id;
            // Update the contribution with likedBy
            await Contribution.findOneAndUpdate(contributionId, {
                $push: {
                    reportedBy: `${UserId}`,
                    reportText: `${req.body.text}`,
                },
            });
            res.status(200).send("Contribution updated successfully.");
        } catch {
            res.status(500).send({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

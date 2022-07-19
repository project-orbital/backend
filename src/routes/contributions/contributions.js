const express = require("express");
const router = express.Router();
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");
const User = require("../../models/user");
const Contribution = require("../../models/contribution/contribution");

// Retrieve all contributions.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            await readIDFromRequestWithJWT(req);
            //check if the current user has reported
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
            await Contribution.findByIdAndUpdate(contributionId, {
                $push: {
                    reportedBy: UserId,
                    reportText: req.body.text,
                },
            });
            await User.findByIdAndUpdate(UserId, {
                $push: {
                    reportedContributions: contributionId,
                },
            });
            res.status(200).send("Contribution reported successfully.");
        } catch {
            res.status(500).send({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

module.exports = router;

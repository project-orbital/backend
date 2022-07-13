const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Account = require("../../models/account").Account;
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const passport = require("passport");

// Create an account for a user.
router.post(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const account = await new Account({
                name: req.body.name,
                nickname: req.body.nickname,
                transactions: [],
                createdAt: new Date(),
            });
            const user = await User.findByIdAndUpdate(id, {
                $push: { accounts: account },
                new: true,
            });
            res.status(200).json(user);
        } catch (e) {
            res.status(500).json({
                title: "Something went wrong.",
                description: "Please try again.",
            });
        }
    }
);

// Retrieve a specific account of a user.
router.get(
    "/:accountId",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            // const userId = await readIDFromRequestWithJWT(req);
            const accountId = req.params.accountId;
            const { accounts } = await User.findOne(
                { "accounts._id": accountId },
                { _id: 0, accounts: { $elemMatch: { accounts: accountId } } }
            );
            console.log(accounts[0]);
            res.status(200).json(accounts[0]);
        } catch (error) {
            console.log(error);
            res.status(500).json("Something went wrong.");
        }
    }
);

// Retrieve all accounts of a user.
router.get(
    "/",
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const id = await readIDFromRequestWithJWT(req);
            const { accounts } = await User.findById(id);
            res.status(200).json(accounts ?? []);
        } catch {
            res.status(500).send("Something went wrong.");
        }
    }
);

module.exports = router;

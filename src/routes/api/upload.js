const multer = require("multer");
const express = require("express");
const router = express.Router();
const extractor = require("../../utils/pdf");
const parser = require("../../../parser/pkg");
const passport = require("passport");
const { readIDFromRequestWithJWT } = require("../../utils/crypto");
const Account = require("../../models/account");
const Transaction = require("../../models/transaction");
const mongoose = require("mongoose");

router.post(
    "/:id",
    multer().array("files"),
    passport.authenticate("jwt", { session: false }, undefined),
    async (req, res) => {
        try {
            const userId = await readIDFromRequestWithJWT(req);
            const accountId = req.params.id;
            const account = await Account.findById(accountId);
            if (!account) {
                return res
                    .status(404)
                    .json({ title: "Account does not exist." });
            }
            if (account.user_id.toString() !== userId) {
                return res
                    .status(403)
                    .json({ title: "You are not authorized to do this." });
            }
            const text = await extractor.extract(req.files);
            const json = await parser.parse(text);
            const transactions = JSON.parse(json).map((tx) => ({
                user_id: userId,
                account_id: accountId,
                createdAt: Date.now(),
                date: Date.parse(tx.date),
                amount: new mongoose.Types.Decimal128(tx.amount),
                balance: new mongoose.Types.Decimal128(tx.balance ?? "0"),
                category: "Others",
                description: tx.description,
            }));
            await Transaction.insertMany(transactions);
            res.status(200).json("Files parsed.");
        } catch (e) {
            console.log(e);
            res.status(500).json({
                title: "Your files could not be parsed.",
                description: "We're always working on improving our parser.",
            });
        }
    }
);

module.exports = router;

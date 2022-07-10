const mongoose = require("mongoose");
const TransactionSchema = require("./transaction").TransactionSchema;

const accountSchema = new mongoose.Schema({
    name: String,
    nickname: String,
    transactions: [TransactionSchema],
    createdAt: Date,
});

module.exports.AccountSchema = accountSchema;
module.exports.Account = mongoose.model("Account", accountSchema);

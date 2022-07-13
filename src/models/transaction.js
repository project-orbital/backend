const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    account_id: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    date: Date,
    amount: Number,
    balance: Number,
    description: String,
});

module.exports.TransactionSchema = transactionSchema;
module.exports.Transaction = mongoose.model("Transaction", transactionSchema);

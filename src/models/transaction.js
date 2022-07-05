const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
    date: Date,
    amount: Number,
    balance: Number,
    description: String,
});

module.exports.TransactionSchema = transactionSchema;
module.exports.Transaction = mongoose.model("Transaction", transactionSchema);

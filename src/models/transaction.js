const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    account_id: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    date: Date,
    amount: mongoose.Schema.Types.Decimal128,
    balance: mongoose.Schema.Types.Decimal128,
    category: String,
    description: String,
});

module.exports = mongoose.model("Transaction", transactionSchema);

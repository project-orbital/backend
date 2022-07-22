const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    liability_id: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    date: Date,
    amount: mongoose.Schema.Types.Decimal128,
});

module.exports = mongoose.model("Payment", paymentSchema);

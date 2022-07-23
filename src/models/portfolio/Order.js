const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    asset_id: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    date: Date,
    amount: mongoose.Schema.Types.Decimal128,
    price: mongoose.Schema.Types.Decimal128,
    fee: mongoose.Schema.Types.Decimal128,
});

module.exports = mongoose.model("Order", orderSchema);

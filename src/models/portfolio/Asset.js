const mongoose = require("mongoose");
const assetSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    name: String,
    symbol: String,
    category: String,
    price: mongoose.Schema.Types.Decimal128,
    yield: mongoose.Schema.Types.Decimal128,
});

module.exports = mongoose.model("Asset", assetSchema);

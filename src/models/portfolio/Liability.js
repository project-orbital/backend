const mongoose = require("mongoose");
const liabilitySchema = new mongoose.Schema(
    {
        user_id: mongoose.Schema.Types.ObjectId,
        createdAt: Date,
        name: String,
        description: String,
        category: String,
        amount: mongoose.Schema.Types.Decimal128,
        interest: mongoose.Schema.Types.Decimal128,
    },
    { collection: "liabilities" }
);

module.exports = mongoose.model("Liability", liabilitySchema);

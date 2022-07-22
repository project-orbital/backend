const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    budget: Number,
    start_date: Date,
    end_date: Date,
});

module.exports = mongoose.model("Budget", budgetSchema);

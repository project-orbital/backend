const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    budget: Number,
    start_date: Date,
    end_date: Date,
});

module.exports = mongoose.model("Budget", budgetSchema);

const mongoose = require("mongoose");
const contributionschema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    header: String,
    summary: String,
    link: String,
    submissionDate: Date,
});

module.exports = mongoose.model("Contribution", contributionschema);

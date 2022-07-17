const mongoose = require("mongoose");
const contributionschema = new mongoose.Schema({
    username: String,
    header: String,
    summary: String,
    link: String,
    submissionDate: Date,
});

module.exports = mongoose.model("Contribution", contributionschema);

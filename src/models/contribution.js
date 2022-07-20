const mongoose = require("mongoose");
const contributionschema = new mongoose.Schema({
    username: String,
    header: String,
    summary: String,
    link: String,
    submissionDate: Date,
    likeCount: Number,
    likedBy: [mongoose.Schema.Types.ObjectId],
    reportedBy: [mongoose.Schema.Types.ObjectId],
    reportText: [String],
});

module.exports = mongoose.model("Contribution", contributionschema);

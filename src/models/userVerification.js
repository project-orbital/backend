const mongoose = require("mongoose");
const userVerification = new mongoose.Schema({
    userId: String,
    uniqueString: String,
    dateCreated: Date,
    dateExpired: Date,
});

module.exports = mongoose.model("UserVerification", userVerification);

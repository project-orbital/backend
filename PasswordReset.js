const mongoose = require("mongoose");

const PasswordReset = new mongoose.Schema({
    userId: String,
    resetString: String,
    dateCreated: Date,
    dateExpired: Date,
});

module.exports = mongoose.model("PasswordReset", PasswordReset);

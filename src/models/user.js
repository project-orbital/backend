const mongoose = require("mongoose");
const user = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    username: String,
    password: String,
    verified: Boolean,
    preferences: {
        prefersDarkMode: Boolean,
        allowsDataStorage: Boolean,
    },
    reportedContributions: [mongoose.Schema.Types.ObjectId],
    likedContributions: [mongoose.Schema.Types.ObjectId],
});

module.exports = mongoose.model("User", user);

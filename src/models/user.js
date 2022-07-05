const mongoose = require("mongoose");
const AccountSchema = require("./account").AccountSchema;

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
    accounts: [AccountSchema],
});

module.exports = mongoose.model("User", user);

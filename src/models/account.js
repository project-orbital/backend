const mongoose = require("mongoose");
const accountSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    name: String,
    nickname: String,
});

module.exports = mongoose.model("Account", accountSchema);

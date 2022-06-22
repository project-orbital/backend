const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_URI, () => {
    console.log("Database connected.");
});

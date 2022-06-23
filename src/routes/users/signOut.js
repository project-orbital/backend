const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    // Set the JWT to expire after 5 seconds.
    res.cookie("jwt", "none", {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true,
        sameSite: "strict",
    }).send();
});

module.exports = router;

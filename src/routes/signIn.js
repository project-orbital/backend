const passport = require("passport");
const express = require("express");
const router = express.Router();

router.post("/", (req, res, next) => {
    passport.authenticate("local", (err, user) => {
        if (err) throw err;
        if (!user) {
            res.status(401).send("Incorrect username/password.");
        } else {
            // checks if verified
            req.logIn(user, (err) => {
                if (err) throw err;
                res.send("Signed in successfully.");
                console.log(req.user);
            });
        }
    })(req, res, next);
});

module.exports = router;

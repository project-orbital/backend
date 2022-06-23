const fs = require("fs");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/user");

const PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");

function cookieExtractor(req) {
    let token = null;
    if (req && req.cookies) token = req.cookies["jwt"];
    return token;
}

const options = {
    jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
    secretOrKey: PUBLIC_KEY,
    algorithms: ["RS256"],
};

module.exports = (passport) => {
    passport.use(
        new JwtStrategy(options, function (jwt_payload, done) {
            User.findOne({ _id: jwt_payload.sub }, function (err, user) {
                if (err) {
                    return done(err, false);
                }
                if (user) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        })
    );
};

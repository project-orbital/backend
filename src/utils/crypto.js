const fs = require("fs");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, "utf8");

/**
 * Hashes a given plaintext password.
 *
 * @param {string} password the plaintext password
 * @returns {string} the hashed password
 */
function hashPassword(password) {
    return bcrypt.hashSync(password, 22);
}

/**
 * Validates a plaintext password against a given hash.
 *
 * @param {string} password the plaintext password
 * @param {string} hash the hash stored in the database
 * @returns {boolean} `true` if the password is valid, `false` otherwise
 */
function validatePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
function issueJWT(user) {
    const _id = user._id;
    const expiresIn = "1d";
    const payload = {
        sub: _id,
        iat: Date.now(),
    };
    const signedToken = jsonwebtoken.sign(payload, PRIVATE_KEY, {
        expiresIn: expiresIn,
        algorithm: "RS256",
    });
    return {
        token: "Bearer " + signedToken,
        expires: expiresIn,
    };
}

module.exports.validatePassword = validatePassword;
module.exports.hashPassword = hashPassword;
module.exports.issueJWT = issueJWT;

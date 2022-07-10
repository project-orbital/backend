const fs = require("fs");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");
const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, "utf8");

/**
 * Hashes a given plaintext password.
 *
 * @param {string} password the plaintext password
 * @returns {string} the hashed password
 */
async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

/**
 * Validates a plaintext password against a given hash.
 *
 * @param {string} password the plaintext password
 * @param {string} hash the hash stored in the database
 * @returns {boolean} `true` if the password is valid, `false` otherwise
 */
async function validatePassword(password, hash) {
    return await bcrypt.compare(password, hash);
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
    return jsonwebtoken.sign(payload, PRIVATE_KEY, {
        expiresIn: expiresIn,
        algorithm: "RS256",
    });
}

function readJWT(token) {
    return jsonwebtoken.verify(token, PUBLIC_KEY, {
        algorithms: ["RS256"],
    });
}

async function readIDFromRequestWithJWT(req) {
    return await readJWT(req.cookies.jwt).sub;
}

module.exports.validatePassword = validatePassword;
module.exports.hashPassword = hashPassword;
module.exports.issueJWT = issueJWT;
module.exports.readJWT = readJWT;
module.exports.readIDFromRequestWithJWT = readIDFromRequestWithJWT;

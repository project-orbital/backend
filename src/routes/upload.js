const multer = require("multer");
const express = require("express");
const router = express.Router();
const extractor = require("../utils/pdf");
const parser = require("../../parser/pkg");

router.post("/", multer().array("files"), async (req, res) => {
    const json = await extractor
        .extract(req.files)
        .then(parser.parse)
        .catch((err) => {
            console.log(err);
            return "[]";
        });
    res.send(json);
});

module.exports = router;

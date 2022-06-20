const pdf = require('pdf-parse');

/**
 * Asynchronously extracts text from each PDF file in an array.
 *
 * @param files the array of PDF files
 * @returns a promise of an array of strings of the text extracted
 */
async function extract(files) {
    return await Promise.all(
        files.map(file => pdf(file.buffer).then(data => data.text))
    );
}

exports.extract = extract;

const mailgun = require("mailgun-js");

const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = require("./config");

const mg = mailgun({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN });

module.exports = { mg };

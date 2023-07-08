const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 7000;

const {
  LOG_LEVEL,
  MONGO_URL,
  JWT_SECRET_KEY,
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  MAILGUN_FROM_EMAIL,
  APP_URL,
  ENV
} = process.env;

const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
};

module.exports = {
  PORT,
  LOG_LEVEL,
  MONGO_URL,
  MONGO_OPTIONS,
  JWT_SECRET_KEY,
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  MAILGUN_FROM_EMAIL,
  APP_URL,
  ENV
};

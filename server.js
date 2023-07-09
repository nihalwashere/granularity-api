const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("./src/utils/logger");

// ENV PORT
const { PORT, MONGO_URL, MONGO_OPTIONS, ENV } = require("./src/utils/config");

const PUBLIC_DIR = "src/public";

const app = express();

app.use(morgan("combined"));
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

const whitelist = [
  "https://granularity-app.nihalwashere.xyz",
  "https://granularity-web.nihalwashere.xyz",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (whitelist.indexOf(origin) === -1) {
        return callback(
          new Error(
            "The CORS policy for this site does not allow access from the specified Origin."
          ),
          false
        );
      }

      return callback(null, true);
    }
  })
);

// ROUTES
const users = require("./src/api/v1/users");
const forms = require("./src/api/v1/forms");
const responses = require("./src/api/v1/responses");
const insights = require("./src/api/v1/insights");

// USE ROUTES
app.use("/api/v1/users", users);
app.use("/api/v1/forms", forms);
app.use("/api/v1/responses", responses);
app.use("/api/v1/insights", insights);

// CONNECT TO MONGODB
mongoose
  .connect(MONGO_URL, MONGO_OPTIONS)
  .then(() => logger.info("MongoDB Connected!!!"))
  .catch((err) => logger.error("MongoDB Connection Failed : ", err));

app.get("/", (req, res) =>
  res.status(200).json({ success: true, message: "API is healthy." })
);

app.get("/logo_192.png", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, "logo_192.png"));
});

app.get("/logo_512.png", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, "logo_512.png"));
});

app.get("/embed.js", (req, res) => {
  if (ENV === "PROD") {
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, "embed.min.js"));
  } else if (ENV === "DEVELOP") {
    res
      .status(200)
      .sendFile(path.join(__dirname, PUBLIC_DIR, "embed-dev.min.js"));
  } else {
    // LOCAL
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, "embed.js"));
  }
});

const server = app.listen(PORT, () => {
  try {
    logger.info(`App is now running on port ${PORT}!!!`);
  } catch (error) {
    logger.error("Failed to start server -> error : ", error);
  }
});

module.exports = { app, server };

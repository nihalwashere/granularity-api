const log4js = require("log4js");
const { LOG_LEVEL } = require("./config");

// log4js.addLayout("json", (config) => (logEvent) =>
//   JSON.stringify(logEvent) + config.separator
// );

// log4js.configure({
//   appenders: {
//     out: { type: "stdout", layout: { type: "json", separator: "," } }
//   },
//   categories: {
//     default: { appenders: ["out"], level: LOG_LEVEL }
//   }
// });

const logger = log4js.getLogger();

logger.level = LOG_LEVEL;

module.exports = logger;

const mongoose = require("mongoose");

const UsersModel = require("../models/Users");

const { decodeJWT } = require("./jwt");

const newId = () => mongoose.Types.ObjectId();

const newIdString = () => mongoose.Types.ObjectId().toHexString();

const waitForMilliSeconds = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const validateToken = async (headers) => {
  const token = headers["x-access-token"];

  if (!token) {
    return { status: 400, error: true, message: "Invalid Request." };
  }

  const decodedJWT = decodeJWT(token);

  if (!decodedJWT || !decodedJWT.userId) {
    return { status: 400, error: true, message: "Invalid Token." };
  }

  const user = await UsersModel.findOne({ _id: decodedJWT.userId });

  if (!user) {
    return { status: 400, error: true, message: "User does not exist." };
  }

  return { error: false, userId: decodedJWT.userId };
};

module.exports = { newId, newIdString, waitForMilliSeconds, validateToken };

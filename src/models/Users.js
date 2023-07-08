const mongoose = require("mongoose");

const collection = "Users";

const { getUserRoles } = require("../enums/userRoles");

const { Schema } = mongoose;

const UsersSchema = new Schema(
  {
    email: {
      type: String,
      index: true
    },
    password: {
      type: String
    },
    role: {
      type: String,
      enum: getUserRoles()
    },
    name: {
      type: String
    },
    avatar: {
      type: String
    },
    isEmailVerified: {
      type: Boolean
    }
  },
  { timestamps: true }
);

const Users = mongoose.model(collection, UsersSchema);

module.exports = Users;

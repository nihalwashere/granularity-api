const mongoose = require("mongoose");

const collection = "Forms";

const { Schema } = mongoose;

const FormsSchema = new Schema(
  {
    formRef: {
      type: String,
      index: true
    },
    ownerId: {
      type: String,
      index: true
    },
    title: {
      type: String
    },
    questions: {
      type: [Schema.Types.Mixed]
    },
    isEmailNotificationEnabled: {
      type: Boolean
    },
    shouldPublish: {
      type: Boolean
    },
    customMetadata: {
      title: {
        type: String
      },
      description: {
        type: String
      }
    }
  },
  { timestamps: true }
);

const Forms = mongoose.model(collection, FormsSchema);

module.exports = Forms;

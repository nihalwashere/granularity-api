const mongoose = require("mongoose");

const collection = "PublishedForms";

const { Schema } = mongoose;

const PublishedFormsSchema = new Schema(
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
    }
  },
  { timestamps: true }
);

const PublishedForms = mongoose.model(collection, PublishedFormsSchema);

module.exports = PublishedForms;

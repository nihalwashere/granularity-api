const mongoose = require("mongoose");

const collection = "Responses";

const { Schema } = mongoose;

const ResponsesSchema = new Schema(
  {
    formRef: {
      type: String,
      index: true
    },
    responseRef: {
      type: String,
      index: true
    },
    response: {
      type: [Schema.Types.Mixed]
    }
  },
  { timestamps: true }
);

const Responses = mongoose.model(collection, ResponsesSchema);

module.exports = Responses;

const mongoose = require("mongoose");

const collection = "Insights";

const { Schema } = mongoose;

const InsightsSchema = new Schema(
  {
    formRef: {
      type: String,
      index: true
    },
    opens: {
      type: Number
    },
    starts: {
      type: Number
    },
    completions: {
      type: Number
    },
    completionRate: {
      type: Number
    },
    questions: [
      {
        _id: false,
        id: {
          type: String
        },
        type: {
          type: String
        },
        questionValue: {
          type: String
        },
        views: {
          type: Number
        }
      }
    ]
  },
  { timestamps: true }
);

const Insights = mongoose.model(collection, InsightsSchema);

module.exports = Insights;

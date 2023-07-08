const express = require("express");

const router = express.Router();

const FormsModel = require("../../../models/Forms");
const PublishedFormsModel = require("../../../models/PublishedForms");
const InsightsModel = require("../../../models/Insights");
const ResponsesModel = require("../../../models/Responses");
const { validateToken } = require("../../../utils/common");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../../utils/constants");
const logger = require("../../../utils/logger");

// GET all forms for user
router.get("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { userId } = token;

    const forms = await FormsModel.find({ ownerId: userId }).sort({
      createdAt: -1
    });

    const data = [];

    for (let i = 0; i < forms.length; i += 1) {
      const responses = await ResponsesModel.countDocuments({
        formRef: forms[i].formRef
      });

      data.push({ ...forms[i]._doc, responses });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("GET /api/v1/forms -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// GET a particular form for user
router.get("/:formRef", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { userId } = token;

    const { formRef } = req.params;

    const form = await FormsModel.findOne({ ownerId: userId, formRef });

    if (!form) {
      return res
        .status(400)
        .json({ success: false, message: "Form does not exists." });
    }

    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    logger.error("GET /api/v1/forms/:formRef -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// GET a particular published form for user
router.get("/published/:formRef", async (req, res) => {
  try {
    const { formRef } = req.params;

    const publishedForm = await PublishedFormsModel.findOne({
      formRef
    });

    if (!publishedForm) {
      return res
        .status(400)
        .json({ success: false, message: "Published form does not exists." });
    }

    return res.status(200).json({ success: true, data: publishedForm });
  } catch (error) {
    logger.error("GET /api/v1/forms/published/:formRef -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// PUT a particular form for user
router.put("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { userId } = token;

    const {
      title,
      formRef,
      questions,
      isEmailNotificationEnabled,
      shouldPublish,
      customMetadata
    } = req.body;

    const fieldsToUpdate = {};

    if (title) {
      fieldsToUpdate.title = title;
    }

    if (isEmailNotificationEnabled !== null) {
      fieldsToUpdate.isEmailNotificationEnabled = isEmailNotificationEnabled;
    }

    if (shouldPublish !== null) {
      fieldsToUpdate.shouldPublish = shouldPublish;
    }

    if (customMetadata) {
      fieldsToUpdate.customMetadata = customMetadata;
    }

    if (questions !== null && questions.length) {
      fieldsToUpdate.questions = questions;

      const insights = await InsightsModel.findOne({
        formRef
      });

      if (!insights) {
        // create new insights object

        await new InsightsModel({
          formRef,
          opens: 0,
          starts: 0,
          completions: 0,
          completionRate: 0.0,
          questions: questions.map((question) => ({
            id: question.id,
            type: question.type,
            questionValue: question.questionValue,
            views: 0
          }))
        }).save();
      } else {
        // update existing insights object

        const newQuestions = [];

        const { questions: insightQuestions } = insights;

        questions.map((question) => {
          const newQuestion = {
            id: question.id,
            type: question.type,
            questionValue: question.questionValue
          };

          const foundQuestion = insightQuestions.find(
            (insightQuestion) => insightQuestion.id === question.id
          );

          if (foundQuestion) {
            newQuestion.views = foundQuestion.views;
          } else {
            newQuestion.views = 0;
          }

          newQuestions.push(newQuestion);
        });

        await InsightsModel.findOneAndUpdate(
          { formRef },
          {
            questions: newQuestions
          }
        );
      }
    }

    const form = await FormsModel.findOneAndUpdate(
      { formRef, ownerId: userId },
      fieldsToUpdate,
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    logger.error("PUT /api/v1/forms -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// PUT a published form for user
router.put("/publish", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { userId } = token;

    const { formRef, title, questions } = req.body;

    const publishedForm = await PublishedFormsModel.findOneAndUpdate(
      { formRef, ownerId: userId },
      { title, questions },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, data: publishedForm });
  } catch (error) {
    logger.error("PUT /api/v1/forms/publish -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// DELETE a particular form for user
router.delete("/:formRef", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { formRef } = req.params;

    await FormsModel.findOneAndRemove({ formRef });

    await InsightsModel.findOneAndRemove({ formRef });

    await ResponsesModel.findOneAndRemove({ formRef });

    await PublishedFormsModel.findOneAndRemove({ formRef });

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("DELETE /api/v1/forms -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// PUT custom metadata for form
router.put("/custom-metadata", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { userId } = token;

    const { formRef, title, description } = req.body;

    const fieldsToUpdate = {};

    if (title) {
      fieldsToUpdate.title = title;
    }

    if (description) {
      fieldsToUpdate.description = description;
    }

    await FormsModel.findOneAndUpdate(
      { formRef, ownerId: userId },
      {
        customMetadata: fieldsToUpdate
      }
    );

    return res.status(200).json({
      success: true,
      message: "Custom Metadata updated successfully."
    });
  } catch (error) {
    logger.error("PUT /api/v1/forms/custom-metadata -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;

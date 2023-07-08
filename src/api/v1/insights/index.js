const express = require("express");

const router = express.Router();

const InsightsModel = require("../../../models/Insights");
const { validateToken } = require("../../../utils/common");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../../utils/constants");
const logger = require("../../../utils/logger");

// GET insights for form
router.get("/:formRef", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ error: true, message: token.message });
    }

    const { formRef } = req.params;

    const insights = await InsightsModel.findOne({ formRef });

    return res.status(200).json({ success: true, data: insights });
  } catch (error) {
    logger.error("GET /api/v1/insights -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// POST open event for form
router.post("/events/open", async (req, res) => {
  try {
    const { formRef } = req.body;

    const insights = await InsightsModel.findOne({ formRef });

    if (!insights) {
      return res.status(400).json({
        success: false,
        message: "Insights does not exists for form."
      });
    }

    const { opens } = insights;

    const updatedOpens = Number(opens) + 1;

    await InsightsModel.findOneAndUpdate({ formRef }, { opens: updatedOpens });

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/insights/events/open -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// POST start event for form
router.post("/events/start", async (req, res) => {
  try {
    const { formRef } = req.body;

    const insights = await InsightsModel.findOne({ formRef });

    if (!insights) {
      return res.status(400).json({
        success: false,
        message: "Insights does not exists for form."
      });
    }

    const { starts, completions } = insights;

    const updatedStarts = Number(starts) + 1;

    await InsightsModel.findOneAndUpdate(
      { formRef },
      {
        starts: updatedStarts,
        completionRate: Number.parseFloat(
          (completions / updatedStarts) * 100
        ).toFixed(2)
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/insights/events/start -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// POST complete event for form
router.post("/events/complete", async (req, res) => {
  try {
    const { formRef } = req.body;

    const insights = await InsightsModel.findOne({ formRef });

    if (!insights) {
      return res.status(400).json({
        success: false,
        message: "Insights does not exists for form."
      });
    }

    const { starts, completions } = insights;

    const updatedCompletions = Number(completions) + 1;

    await InsightsModel.findOneAndUpdate(
      { formRef },
      {
        completions: updatedCompletions,
        completionRate: Number.parseFloat(
          (updatedCompletions / starts) * 100
        ).toFixed(2)
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/insights/events/complete -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// POST see question insight event for form
router.post("/events/see", async (req, res) => {
  try {
    const { formRef, seenQuestionId } = req.body;

    const insights = await InsightsModel.findOne({ formRef });

    if (!insights) {
      return res.status(400).json({
        success: false,
        message: "Insights does not exists for form."
      });
    }

    const { questions } = insights;

    const newQuestions = [...questions];

    const questionIndex = newQuestions.findIndex(
      (elem) => elem.id === seenQuestionId
    );

    const question = newQuestions.find((elem) => elem.id === seenQuestionId);

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question does not exists."
      });
    }

    const { views } = question;

    const updatedViews = views + 1;

    newQuestions[questionIndex].views = updatedViews;

    await InsightsModel.findOneAndUpdate(
      { formRef },
      { questions: newQuestions }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("GET /api/v1/insights/events/see -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;

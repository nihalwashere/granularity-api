const express = require("express");
// const {
//   stringOfFormResponseReceivedEmail
// } = require("@getgranularity/email-engine");

const router = express.Router();

const ResponsesModel = require("../../../models/Responses");
const FormsModel = require("../../../models/Forms");
const UsersModel = require("../../../models/Users");
const { mg } = require("../../../utils/mailgun");
const { MAILGUN_FROM_EMAIL } = require("../../../utils/config");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../../utils/constants");
const logger = require("../../../utils/logger");

// POST response for a particular form
router.post("/", async (req, res) => {
  try {
    const { formRef, responseRef, response } = req.body;

    // save response
    await new ResponsesModel({
      formRef,
      responseRef,
      response
    }).save();

    const form = await FormsModel.findOne({ formRef });

    if (form.isEmailNotificationEnabled) {
      const { ownerId } = form;

      const user = await UsersModel.findById(ownerId);

      const { email } = user;

      // send email notification for response
      const data = {
        from: MAILGUN_FROM_EMAIL,
        to: email,
        subject: "Your form received a new response!"
        // html: stringOfFormResponseReceivedEmail({
        //   formTitle: form.title,
        //   data: response
        // })
      };

      await mg.messages().send(data);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/responses -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

// GET responses for a particular form
router.get("/:formRef", async (req, res) => {
  try {
    const { formRef } = req.params;

    const responses = await ResponsesModel.find({
      formRef
    }).sort({
      createdAt: -1
    });

    return res.status(200).json({ success: true, data: responses });
  } catch (error) {
    logger.error("GET /api/v1/responses -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;

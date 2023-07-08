const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const UsersModel = require("../../../models/Users");
const FormsModel = require("../../../models/Forms");
const ResponsesModel = require("../../../models/Responses");
const { UserRoles } = require("../../../enums/userRoles");
const { createSalt, hashPassword, encodeJWT } = require("../../../utils/jwt");
const { validateToken } = require("../../../utils/common");
const { MAILGUN_FROM_EMAIL, APP_URL } = require("../../../utils/config");
const { mg } = require("../../../utils/mailgun");
const { decodeJWT } = require("../../../utils/jwt");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../../utils/constants");
const logger = require("../../../utils/logger");

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required." });
    }

    const user = await UsersModel.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with email already exists. Please sign in."
      });
    }

    const hashedPassword = hashPassword(password, createSalt());

    const name = email.split("@")[0];

    const newUser = await new UsersModel({
      email,
      password: hashedPassword,
      role: UserRoles.OWNER,
      name,
      avatar: crypto.createHash("md5").update(email).digest("hex"),
      isEmailVerified: false
    }).save();

    const token = encodeJWT({ userId: newUser._id });

    return res
      .status(200)
      .json({ success: true, data: { email: newUser.email, token } });
  } catch (error) {
    logger.error("POST /api/v1/users/signup -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .json({ success: false, message: "Email is required." })
        .status(400);
    }

    if (!password) {
      return res
        .json({ success: false, message: "Password is required." })
        .status(400);
    }

    const user = await UsersModel.findOne({ email });

    if (!user) {
      return res
        .json({
          success: false,
          message:
            "User with email does not exist. Please check your credentials and try again."
        })
        .status(400);
    }

    const salt = user.password.split("$")[0];

    const hashedPassword = hashPassword(password, salt);

    if (hashedPassword !== user.password) {
      return res.status(403).json({
        success: false,
        message: "Incorrect password. Please try again."
      });
    }

    const token = encodeJWT({ userId: user._id });

    return res
      .status(200)
      .json({ success: true, data: { email: user.email, token } });
  } catch (error) {
    logger.error("POST /api/v1/users/signin -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.get("/info", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId } = token;

    const user = await UsersModel.findById(userId);

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("POST /api/v1/users/info -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.put("/account", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId } = token;

    const { name } = req.body;

    const updatedUser = await UsersModel.findOneAndUpdate(
      { _id: userId },
      { name, avatar: crypto.createHash("md5").update(name).digest("hex") },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Account name updated successfully.",
      data: updatedUser
    });
  } catch (error) {
    logger.error("POST /api/v1/users/account -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.get("/account/stats", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId } = token;

    const forms = await FormsModel.find({ ownerId: userId });

    let responsesCount = 0;

    for (let i = 0; i < forms.length; i += 1) {
      const responses = await ResponsesModel.countDocuments({
        formRef: forms[i].formRef
      });

      responsesCount += responses;
    }

    return res.status(200).json({
      success: true,
      data: { forms: forms.length, responses: responsesCount }
    });
  } catch (error) {
    logger.error("GET /api/v1/users/account/stats -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/trigger-email-verification", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { email } = req.body;

    const link = `${APP_URL}/verify-email/${encodeJWT({
      email
    })}`;

    // send email verification notification
    const data = {
      from: MAILGUN_FROM_EMAIL,
      to: email,
      subject: "Verify your email!",
      text: `Hey there, hope you are doing good!\n\nPlease verify your email by clicking on this link:\n${link}`
    };

    await mg.messages().send(data);

    return res.status(200).json({
      success: true,
      message: "Please check your email to continue with verification."
    });
  } catch (error) {
    logger.error(
      "POST /api/v1/users/trigger-email-verification -> error : ",
      error
    );

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { emailToken } = req.body;

    const decodedEmailToken = decodeJWT(emailToken);

    if (!decodedEmailToken || !decodedEmailToken.email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email token." });
    }

    const user = await UsersModel.findOne({ email: decodedEmailToken.email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Email verification failed." });
    }

    await UsersModel.findOneAndUpdate(
      { email: decodedEmailToken.email },
      { isEmailVerified: true }
    );

    return res
      .status(200)
      .json({ success: true, message: "Email verification successful." });
  } catch (error) {
    logger.error("POST /api/v1/users/verify-email -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.put("/change-password", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId } = token;

    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword) {
      return res
        .json({ success: false, message: "Old password is required." })
        .status(400);
    }

    if (!newPassword) {
      return res
        .json({ success: false, message: "New password is required." })
        .status(400);
    }

    if (!confirmNewPassword) {
      return res
        .json({ success: false, message: "Confirm new password is required." })
        .status(400);
    }

    const user = await UsersModel.findById(userId);

    if (!user) {
      return res
        .json({
          success: false,
          message: "User with email does not exist. Please try again."
        })
        .status(400);
    }

    const salt = user.password.split("$")[0];

    const oldHashedPassword = hashPassword(oldPassword, salt);

    if (oldHashedPassword !== user.password) {
      return res.status(403).json({
        success: false,
        message:
          "Your current password does not match our records. Please try again."
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message:
          "New password and confirmed new passwords don't match. Please try again."
      });
    }

    const confirmedNewHashedPassword = hashPassword(
      confirmNewPassword,
      createSalt()
    );

    await UsersModel.findOneAndUpdate(
      { email: user.email },
      { password: confirmedNewHashedPassword }
    );

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    logger.error("PUT /api/v1/users/change-password -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/send-password-reset-instructions", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const user = await UsersModel.findOne({ email });

    const link = `${APP_URL}/reset-password-check-expiry/${encodeJWT(
      {
        email
      },
      { expiresIn: "1h" }
    )}`;

    if (user) {
      const data = {
        from: MAILGUN_FROM_EMAIL,
        to: email,
        subject: "Reset your Granularity password",
        text: `Hey there,\n\nTo get a new password for your Granularity account, just click on the link below.\n\nIf you didn't request a password reset, safely ignore this email.\n\n${link}`
      };

      await mg.messages().send(data);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error(
      "POST /api/v1/users/send-password-reset-instructions -> error : ",
      error
    );

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/check-reset-password-link-expiry", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required." });
    }

    const decodedToken = decodeJWT(token);

    if (!decodedToken || !decodedToken.email || !decodedToken.exp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token." });
    }

    const { email, exp } = decodedToken;

    if (Date.now() >= exp * 1000) {
      // expired
      return res
        .status(400)
        .json({ success: false, message: "Token is expired." });
    }

    return res.status(200).json({ success: true, data: { email } });
  } catch (error) {
    logger.error(
      "POST /api/v1/users/check-reset-password-link-expiry -> error : ",
      error
    );

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, confirmNewPassword } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required." });
    }

    if (!confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Confirm new password is required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message:
          "New password and confirmed new passwords don't match. Please try again."
      });
    }

    const user = await UsersModel.findOne({ email });

    if (!user) {
      return res
        .json({
          success: false,
          message: "User with email does not exist."
        })
        .status(400);
    }

    const token = encodeJWT({ userId: user._id });

    const confirmedNewHashedPassword = hashPassword(
      confirmNewPassword,
      createSalt()
    );

    await UsersModel.findOneAndUpdate(
      { email },
      { password: confirmedNewHashedPassword }
    );

    return res
      .status(200)
      .json({ success: true, data: { email: user.email, token } });
  } catch (error) {
    logger.error("PUT /api/v1/users/reset-password -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;

import express from "express";
import { upload } from "../helper/mullterHelper.js";
import {
  Login,
  changePassword,
  forgotPassword,
  setPassword,
  verifyPassToken,
} from "../controllers/adminController.js";
import message from "../utilities/message/index.js";
import { check } from "express-validator";
import { validationfield } from "../field_validator/index.js";
import { isAdmin } from "../middleware/adminValidator.js";

const router = express.Router();

router.post(
  "/login",
  [
    check("email").notEmpty().withMessage(message?.emailIsRequired),
    check("password").notEmpty().withMessage(message.passwordIsRequired),
  ],
  validationfield,
  Login
);

router.post(
  "/set-password",
  upload.single("profile"),
  [
    check("token").notEmpty().withMessage(message?.passwordTokenIsRequired),
    check("password")
      .notEmpty()
      .withMessage(message.passwordIsRequired)
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/s),
  ],
  validationfield,
  setPassword
);

router.post(
  "/change/pass",
  isAdmin,
  [
    check("old_password").notEmpty().withMessage(message?.passwordIsRequired),
    check("new_pass")
      .notEmpty()
      .withMessage(message?.newPasswordRequired)
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/s)
      .withMessage(message?.passwordFormatIsNotValid),
  ],
  validationfield,
  changePassword
);

router.post(
  "/forgot-pass-link",
  [check("email").notEmpty().withMessage(message?.emailIsRequired)],
  validationfield,
  forgotPassword
);

router.post("/verify-pass-token", [check("token").notEmpty().withMessage(message?.tokenIsRequired)],validationfield,verifyPassToken)

export default router;

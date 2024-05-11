import config from "../config/index.js";
import crypto from "crypto";
import { AdminSchema } from "../models/adminModels.js";
import { sendTextMail } from "../helper/sendgridHelper.js";
import { sendBadRequest, sendSuccess } from "../utilities/response/index.js";
import { errorHelper } from "../helper/errorHelper.js";
import message from "../utilities/message/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createAdmin = async (req, res) => {
  try {
    const admin = await AdminSchema.findOne({
      email: config.ADMIN_EMAIL,
    });
    if (admin) return;
    const cryptoToken = crypto.randomBytes(30);
    await new AdminSchema({
      email: config.ADMIN_EMAIL,
      set_password_token: cryptoToken.toString("hex"),
      set_password_token_exp_time: new Date(
        new Date().getTime() + 60 * 1440 * 1000
      ),
    }).save();
    console.log("ADMIN_CREATED_SUCCESSFULLY");

    await sendTextMail(
      [config?.ADMIN_EMAIL],
      config.SG_MAIL,
      "Set password",
      `url: http:192.168.29.5:3000/set-password`
    );
  } catch (e) {
    console.log(e);
    console.log("ADMIN_CREATE");
  }
};

export const setPassword = async (req, res) => {
  try {
    const data = req.body;
    const admin = await AdminSchema.findOne({ set_password_token: data.token });
    if (!admin) return sendBadRequest(res, message.tokenIsNotExist);

    const currentTime = new Date();
    if (admin.set_password_token_exp_time < currentTime)
      return sendBadRequest(res, message.tokenExpiredError);

    if (admin && admin.password) {
      admin.password = await bcrypt.hashSync(data.password, 10);
      await admin.save();
      await AdminSchema.update(
        {
          _id: admin._id,
        },
        {
          $unset: {
            set_password_token: "",
            set_password_token_exp_time: "",
          },
        }
      );
      return sendSuccess(res, message.passwordResetSuccessfully);
    }

    admin.name = data.name;
    if (req.file) {
      admin.profile = "public/file/" + req.file.filename;
    }
    console.log(data.password);
    admin.password = await bcrypt.hashSync(data?.password, 10);
    await admin.save();
    return sendSuccess(res, message.passwordSetSuccessfully);
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, "SET_PASSWORD"));
  }
};

export const Login = async (req, res) => {
  try {
    const data = req.body;
    const admin = await AdminSchema.findOne({ email: data.email });
    if (!admin) return sendBadRequest(res, message.adminNotFound);

    const password = await bcrypt.compare(data.password, admin.password);
    if (!password) return sendBadRequest(res, message.passwordIsNotValid);

    const accessTokenId = await crypto.randomBytes(30).toString("hex");
    const refereshTokenId = await crypto.randomBytes(30).toString("hex");

    const accessToken = await jwt.sign(
      {
        _id: admin._id,
        accessTokenId,
      },
      config.ACCESS_TOKEN_ADMIN,
      {
        expiresIn: config.ACCESS_TOKEN_EXP * 60,
      }
    );
    const refereshToken = await jwt.sign(
      {
        _id: admin._id,
        refereshTokenId,
      },
      config.REFRESH_TOKEN_EXP,
      {
        expiresIn: config.REFRESH_TOKEN_EXP * 60,
      }
    );

    admin.accessTokenId = accessTokenId;
    admin.refereshTokenId = refereshTokenId;

    await admin.save();

    return sendSuccess(
      res,
      { accessToken: accessToken, refereshToken: refereshToken },
      message.loginSuccessfully
    );
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, "ADMIN_LOGIN"));
  }
};

export const changePassword = async (req, res) => {
  try {
    const data = req.body;
    const comparePass = await bcrypt.compareSync(
      data.old_password,
      req.admin.password
    );
    if (!comparePass) return sendBadRequest(res, message.passwordIsNotValid);
    const samePass = await bcrypt.compareSync(
      data.new_pass,
      req.admin.password
    );

    if (samePass) return sendBadRequest(res, message.selectDifferentPassword);

    req.admin.password = await bcrypt.hashSync(data.new_pass, 10);
    
    await req.admin.save();
    return sendSuccess(res, message.passwordChangeSuccess);
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, "CHANGE_PASSWORD"));
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const data = req.body;

    const admin = await AdminSchema.findOne({ email: data.email });
    if (!admin) return sendBadRequest(res, message.adminNotFound);

    const cryptoToken = crypto.randomBytes(30).toString("hex");
    admin.set_password_token = cryptoToken;
    (admin.set_password_token_exp_time = new Date(
      new Date().getTime() + 60 * 1440 * 1000
    )),
      await sendTextMail(
        [config?.ADMIN_EMAIL],
        config.SG_MAIL,
        "forgot password",
        `url: http:192.168.29.5:3000/forgot-password`
      );
    await admin.save();
    return sendSuccess(res, message.linkSendSuccessfully);
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, "FORGOT_PASSWORD"));
  }
};

export const verifyPassToken = async (req, res) => {
  try {
    const data = req.body;
    const admin = await AdminSchema.findOne({ set_password_token: data.token });
    if (!admin) return sendBadRequest(res, message.tokenIsNotExist);

    if (admin.set_password_token_exp_time < new Date().getDay() + 2)
      return sendBadRequest(res, message.tokenExpiredError);
    return sendSuccess(res,message.tokenVerifySuccessfully)
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, "VERIFY_PASS_TOKEN"));
  }
};

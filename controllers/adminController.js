import { errorHelper } from '../helper/errorHelper.js'
import {
  sendBadRequest,
  sendBadRequestWith401Code,
  sendSuccess
} from '../utilities/response/index.js'
import { AdminModal } from '../models/adminModels.js'
import config from '../config/index.js'
import crypto from 'crypto'
import { sendTextMail } from '../helper/sendgridHelper.js'
import message from '../utilities/message/index.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// create admin
export const createAdmin = async (req, res) => {
  try {
    const admin = await AdminModal?.findOne({ email: config?.ADMIN_EMAIL })
    if (admin) return

    const cryptoToken = crypto?.randomBytes(30)?.toString('hex')

    await new AdminModal({
      email: config?.ADMIN_EMAIL,
      set_password_token: cryptoToken,
      set_password_token_exp_time: new Date(
        new Date().getTime() + 60 * 1440 * 1000
      )
    }).save()
    await sendTextMail(
      [config?.ADMIN_EMAIL],
      config?.SG_MAIL,
      'Set password',
      'url:/set-password'
    )

    console.log('ADMIN CREATED SUCCESSFULLY')
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, 'CREATE_ADMIN'))
  }
}

// set password
export const setPassword = async (req, res) => {
  try {
    const data = req?.body
    const admin = await AdminModal?.findOne({
      set_password_token: data?.token
    })
    if (!admin) return sendBadRequest(res, message?.tokenNotExist)

    const currentTime = Date.now()
    if (!(currentTime < admin.set_password_token_exp_time)) {
      return sendBadRequestWith401Code(res, message.tokenExpiredError)
    }

    if (admin && admin.password) {
      admin.password = await bcrypt.hashSync(data.password, 10)
      await admin.save()
      await AdminModal.update(
        {
          _id: admin._id
        },
        {
          $unset: {
            set_password_token: '',
            set_password_token_exp_time: ''
          }
        }
      )

      return sendSuccess(res, message.passwordResetSuccessfully)
    }

    admin.name = data.name
    if (req.file) {
      admin.profile = config.IMAGE_PATH + req.file.filename
    }
    admin.password = await bcrypt.hashSync(data?.password, 10)
    admin.isNewAdmin = false
    await admin.save()
    return sendSuccess(res, message?.passwordSetSuccessfully)
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, 'SET_PASSWORD'))
  }
}

// login
export const Login = async (req, res) => {
  try {
    const data = req.body

    const admin = await AdminModal.findOne({ email: data?.email })
    if (!admin) return sendBadRequest(res, message.adminNotFound)

    const matchPass = await bcrypt.compare(data.password, admin.password)
    if (!matchPass) return sendBadRequest(res, message.passwordNotMatch)

    const accessTokenId = crypto?.randomBytes(30)?.toString('hex')
    const refereshTokenId = crypto?.randomBytes(30)?.toString('hex')

    const accessToken = await jwt.sign(
      {
        _id: admin._id,
        accessTokenId
      },
      config?.ADMIN_SECRET,
      { expiresIn: config?.TOKEN_EXP * 60 }
    )

    const refreshToken = await jwt.sign(
      {
        _id: admin._id,
        refereshTokenId
      },
      config?.ADMIN_SECRET_REF,
      { expiresIn: config?.REFRESH_TOKEN_EXP * 60 }
    )

    admin.accessTokenId = accessTokenId
    admin.refereshTokenId = refereshTokenId

    await admin.save()

    return sendSuccess(
      res,
      { accessToken, refreshToken },
      message.loginSuccessfully
    )
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, 'LOGIN'))
  }
}

// change password
export const changePassword = async (req, res) => {
  try {
    const data = req?.body
    const admin = await AdminModal.findOne({ _id: req?.admin?._id })
    if (!admin) return sendBadRequest(res, message?.adminNotFound)
    // match password
    const matchPass = await bcrypt.compare(data?.oldPass, admin?.password)
    if (!matchPass) return sendBadRequest(res, message?.invalidPassword)
    // match old and new password
    const matchOldAndNewPass = await bcrypt.compare(data?.newPass, admin?.password)
    if (matchOldAndNewPass) return sendBadRequest(res, message?.selectDifferentPassword)

    const newPass = await bcrypt.hashSync(data?.newPass, 10)

    admin.password = newPass
    await admin.save()
    return sendSuccess(res, message?.passwordChangeSuccess)
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, 'CHANGE_PASSWORD'))
  }
}

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const data = req?.body
    const admin = await AdminModal.findOne({ email: data?.email })
    if (!admin) return sendBadRequest(res, message?.adminNotFound)

    const cryptoToken = crypto.randomBytes(30)
    admin.set_password_token = cryptoToken.toString('hex')
    admin.set_password_token_exp_time = new Date(
      new Date().getTime() + 60 * 1440 * 1000
    )

    await admin.save()
    await sendTextMail(
      [data?.email],
      config.SG_MAIL,
      'Set password',
      'forgot pass'
    )

    return sendSuccess(res, message.linkSendSuccessfully)
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, 'FORGOT_PASSWORD'))
  }
}

// verify pass token
export const verifyToken = async (req, res) => {
  try {
    const admin = await AdminModal.findOne({ set_password_token: req.body.token })
    if (!admin) return sendBadRequest(res, message.tokenNotExist)
    if (!admin.set_password_token_exp_time > Date.now()) {
      return sendBadRequest(res, message.tokenExpiredError)
    }
    return sendSuccess(res, message.tokenVerifySuccessfully)
  } catch (e) {
    return sendBadRequest(res, errorHelper(e, 'TOKEN_VERIFY'))
  }
}

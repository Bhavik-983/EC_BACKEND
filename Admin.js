import crypto from 'crypto'
import config from '../../config/index.js'
import { AdminModal } from '../../modals/Admin/Admin.js'
import logger from '../../utilities/logger.js'
import message from '../../utilities/messages/message.js'
import bcrypt from 'bcrypt'
import { sendBadRequest, sendBadRequestWith401Code, sendSuccess } from '../../utilities/response/index.js'
import Jwt from 'jsonwebtoken'
// import constant from '../../utilities/constant.js'
// import { SchemeModal } from '../../modals/Scheme/Scheme.js'
import { UserModel } from '../../modals/Users/User.js'
import fs from 'fs'
import { sendTextMail } from '../../helper/sendgridHelper.js'
// import { check } from 'express-validator'

// Use for create admin
export const addAdmin = async (req, res) => {
  try {
    const findAdminData = await AdminModal.findOne({ email: config?.EMAIL })
    if (findAdminData) {
      return
    }

    const cryptoToken = crypto.randomBytes(30).toString('hex')

    const adminData = await new AdminModal({
      email: config?.EMAIL,
      set_password_token: cryptoToken,
      isMasterAdmin: true,
      set_password_token_exp_time: new Date(
        new Date().getTime() + 60 * 1440 * 1000
      )
    })
    await adminData.save()
    await sendTextMail(
      [config?.EMAIL],
      config.SG_MAIL,
      'Set password',
            `url: http:192.168.29.5:3000/set-password/${adminData.set_password_token}`
    )

    console.log('admin created successfully!')
  } catch (e) {
    logger.error(e)
    logger.error('ADMIN_CREATE')
    return sendBadRequest(res, message?.somethingGoneWrong)
  }
}

// Use for login
export const adminLogIn = async (req, res) => {
  try {
    const data = req?.body
    const findAdminData = await AdminModal.findOne({ email: data?.email })
    if (!findAdminData) {
      return sendBadRequest(res, message?.adminNotFound)
    }

    if (!findAdminData.password) {
      return sendBadRequest(res, message?.passwordNotExist)
    }

    // match password
    const matchPassword = await bcrypt.compare(data?.password, findAdminData?.password)
    if (!matchPassword) {
      return sendBadRequest(res, message?.invalidPassword)
    }

    // generate accesstoken
    const token = Jwt.sign({
      id: findAdminData?._id
    },
    config?.ACCESS_TOKEN_ADMIN,
    { expiresIn: config?.ACCESS_TOKEN_EXP * 60 }
    )

    // generate refreshtoken
    const refreshToken = Jwt.sign({
      id: findAdminData?._id
    },
    config?.REFRESH_TOKEN_ADMIN,
    { expiresIn: config?.REFRESH_TOKEN_EXP * 60 }
    )

    return sendSuccess(res, { access_token: token, refresh_token: refreshToken }, message?.loginSuccessfully)
  } catch (e) {
    console.log(e)
    logger.error(e)
    logger.error('ADMIN_SIGNIN')
    return sendBadRequest(res, message?.somethingGoneWrong)
  }
}

// Use for set password
export const setPassword = async (req, res) => {
  try {
    const data = req?.body
    if (!data.token) {
      return sendBadRequest(res, message.setTokenIsRequired)
    }
    if (!data.password) {
      return sendBadRequest(res, message.passwordRequired)
      // return check(data.password).notEmpty().withMessage(message?.newPasswordRequired).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/s)
    }

    const adminDetails = await AdminModal.findOne({ set_password_token: data?.token })
    if (!adminDetails) {
      return sendBadRequest(res, message?.tokenNotExist)
    }
    const currentTime = Date.now()
    if (!(currentTime < adminDetails.set_password_token_exp_time)) return sendBadRequestWith401Code(res, message.tokenExpiredError)

    if (adminDetails && adminDetails.password) {
      adminDetails.password = await bcrypt.hashSync(data.password, 10)
      await adminDetails.save()
      await AdminModal.update(
        {
          _id: adminDetails._id
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

    adminDetails.username = data.username
    if (req.file) {
      adminDetails.profile_image = config.IMAGE_PATH + req.file.filename
    }
    adminDetails.password = await bcrypt.hashSync(data?.password, 10)
    adminDetails.isNewAdmin = false
    await adminDetails.save()
    return sendSuccess(res, adminDetails, message?.passwordSetSuccessfully)
  } catch (e) {
    logger.error(e)
    logger.error('ADMIN_RESET_PASSWORD')
    return sendBadRequest(res, message?.somethingGoneWrong)
  }
}

// Use for change password
export const changePassword = async (req, res) => {
  try {
    const data = req?.body
    const adminData = await AdminModal.findOne({ _id: req?.admin?._id })
    if (!adminData) {
      return sendBadRequest(res, message?.adminNotFound)
    }
    // match password
    const matchPassword = await bcrypt.compare(data?.password, adminData?.password)
    if (!matchPassword) {
      return sendBadRequest(res, message?.invalidPassword)
    }
    // match old and new password
    const matchOldAndNewPaswd = await bcrypt.compare(data?.new_password, adminData?.password)
    if (matchOldAndNewPaswd) {
      return sendBadRequest(res, message?.selectDifferentPassword)
    }

    const hashNewPassword = await bcrypt.hashSync(data?.new_password, 10)

    adminData.password = hashNewPassword
    await adminData.save()
    return sendSuccess(res, adminData, message?.passwordResetSuccessfully)
  } catch (e) {
    logger.error(e)
    logger.error('ADMIN_RESET_PASSWORD')
    return sendBadRequest(res, message?.somethingGoneWrong)
  }
}

// Use for forgot password
export const forgotPassword = async (req, res) => {
  try {
    const data = req?.body
    const adminData = await AdminModal.findOne({ email: data?.email })
    if (!adminData) {
      return sendBadRequest(res, message?.adminNotFound)
    }

    const cryptoToken = crypto.randomBytes(30)
    adminData.set_password_token = cryptoToken.toString('hex')
    adminData.set_password_token_exp_time = new Date(
      new Date().getTime() + 60 * 1440 * 1000
    )

    await adminData.save()
    if (adminData.isNewAdmin === true) {
      await sendTextMail(
        [data?.email],
        config.SG_MAIL,
        'Set password',
                `url: http:192.168.29.5:3000/set-password/${adminData.set_password_token}`
      )
    } else {
      await sendTextMail(
        [data?.email],
        config.SG_MAIL,
        'Set password',
                `url: http:192.168.29.5:3000/reset-password/${adminData.set_password_token}`
      )
    }

    return sendSuccess(res, message.linkSendSuccessfully)
  } catch (e) {
    logger.error(e)
    logger.error('FORGOT_PASSWORD')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for verify token
export const verifyToken = async (req, res) => {
  try {
    const adminData = await AdminModal.findOne({ set_password_token: req.params.token })
    if (!adminData) {
      return sendBadRequest(res, message.tokenNotExist)
    }
    if (!adminData.set_password_token_exp_time > Date.now()) {
      return sendBadRequest(res, message.tokenExpiredError)
    }
    return sendSuccess(res, { isNewAdmin: adminData.isNewAdmin }, message.tokenVerifySuccessfully)
  } catch (e) {
    logger.error(e)
    logger.error('TOKEN_VERIFY')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for create sub admin
export const createSubAdmin = async (req, res) => {
  try {
    const data = req.body
    const findAdminData = await AdminModal.findOne({ email: data.email })
    if (findAdminData) {
      return sendBadRequest(res, message.adminAlreadyExist)
    }

    const cryptoToken = crypto.randomBytes(30)

    const adminData = await new AdminModal({
      email: data?.email,
      admin_ref_id: req?.admin?._id,
      admin_status: true,
      set_password_token: cryptoToken.toString('hex'),
      set_password_token_exp_time: new Date(
        new Date().getTime() + 60 * 1440 * 1000
      )
    })

    await adminData.save()
    await sendTextMail(
      [data?.email],
      config.SG_MAIL,
      'Set password',
            `url: http:192.168.29.5:3000/set-password/${adminData.set_password_token}`
    )
    return sendSuccess(res, adminData, message.subAdminCreatedSuccessfully)
  } catch (e) {
    logger.error(e)
    logger.error('CREATE_SUB_ADMIN')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for get all active admindata
export const getAllAdminData = async (req, res) => {
  try {
    const options = {}
    if (req.query.status) {
      options.admin_status = req.query.status
    } else {
      options._id = { $ne: req.admin._id }
    }
    const adminData = await AdminModal.find(options).sort({ createdAt: -1 }).select({
      username: 1,
      email: 1,
      status: 1,
      _id: 1,
      createdAt: 1,
      admin_status: 1
    })
    return sendSuccess(res, adminData)
  } catch (e) {
    logger.error(e)
    logger.error('GET_ALL_ADMIN')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for get admin profile
export const getAdminProfileData = async (req, res) => {
  try {
    const adminData = await AdminModal.findOne({ _id: req.admin._id }).select({
      username: 1,
      email: 1,
      status: 1,
      _id: 1,
      createdAt: 1,
      profile_image: 1,
      admin_status: 1
    })
    if (!adminData) {
      return sendBadRequest(res, message.adminDataNotFound)
    }
    return sendSuccess(res, adminData)
  } catch (e) {
    logger.error(e)
    logger.error('GET_ADMIN_PROFILE_DATA')
    return sendBadRequest(res, message.getAdminProfileData)
  }
}

// Use for update admin profile
export const updateAdminProfile = async (req, res) => {
  try {
    const data = req.body
    const adminData = await AdminModal.findOne({ _id: req.admin._id })
    if (!adminData) {
      return sendBadRequest(res, message.adminNotFound)
    }
    if (data.username) {
      adminData.username = data.username
    }

    if (req.file) {
      if (adminData.profile_image) {
        const Path = adminData.profile_image
        fs.unlink(Path, function (err) {
          if (err) {
            throw err
          } else {
            console.log('File deleted!')
          }
        })
      }
      adminData.profile_image = config.IMAGE_PATH + req.file.filename
    }
    await adminData.save()
    return sendSuccess(res, adminData, message.profileUpdatedSuccessfully)
  } catch (e) {
    logger.error('Update_Admin_Details')
    logger.error(e)
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for update status
export const activateAndDiactivateAdmin = async (req, res) => {
  try {
    const data = req?.body
    const adminData = await AdminModal.findOne({ _id: req.params.adminId })
    if (!adminData) {
      return sendBadRequest(res, message.adminNotFound)
    }
    if (adminData._id.equals(req.admin._id)) {
      return sendBadRequest(res, message.youCanNotDeactivateYourAccout)
    }
    if (adminData.isMasterAdmin) {
      return sendBadRequest(res, message.youCanNotDeactivateStatusOfMainAdmin)
    }
    // if (!isBoolean(data.status)) {
    //     return sendBadRequest(res, message.enterValidStatus)
    // }
    adminData.admin_status = data.admin_status
    await adminData.save()
    return sendSuccess(res, adminData, message.statusUpdatedSuccessfully)
  } catch (e) {
    logger.error(e)
    logger.error('ACTIVATE_DIACTIVATE_ADMIN')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for get user prfoile
export const getUserProfileData = async (req, res) => {
  try {
    const userProfileData = await UserModel.findOne({ _id: req.params.userId }).select({
      firstname: 1,
      lastname: 1,
      email: 1,
      phone_number: 1,
      scheme_id: 1,
      status: 1
    }).populate('scheme_id', 'name')
    if (!userProfileData) {
      return sendBadRequest(res, message.userNotFound)
    }
    return sendSuccess(res, userProfileData)
  } catch (e) {
    logger.error(e)
    logger.error('GET_USER_PROFILE_DATA_BY_ADMIN')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for get user prfoile
export const getAllUserData = async (req, res) => {
  try {
    const options = {}

    if (req.query.firstname) {
      options.firstname = { $regex: req.query.firstname, $options: 'i' }
    }
    if (req.query.lastname) {
      options.lastname = { $regex: req.query.lastname, $options: 'i' }
    }
    if (req.query.email) {
      options.email = { $regex: req.query.email, $options: 'i' }
    }
    if (req.query.scheme_id) {
      options.scheme_id = req.query.scheme_id
    }
    if (req.query.phone_number) {
      options.phone_number = { $regex: req.query.phone_number, $options: 'i' }
    }
    if (req.query.status) {
      options.status = req.query.status
    }
    const userData = await UserModel.find(options).sort({ createdAt: -1 }).select({
      firstname: 1,
      lastname: 1,
      email: 1,
      phone_number: 1,
      scheme_id: 1,
      status: 1
    }).populate('scheme_id', 'name')
    if (!userData) {
      return sendBadRequest(res, message.userDataNotFound)
    }
    return sendSuccess(res, userData)
  } catch (e) {
    logger.error(e)
    logger.error('GET_USER_DATA_BY_ADMIN')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

// Use for delete user(soft delete)
export const deactivateUserProfile = async (req, res) => {
  try {
    const data = req.body
    const userData = await UserModel.findOne({ _id: req.params.userId })
    if (!userData) {
      return sendBadRequest(res, message.userNotFound)
    }
    if (data.status) {
      userData.status = data.status
    }
    userData.save()
    if (data.status === true) {
      return sendBadRequest(res, message.userProfileActivatedSuccessfully)
    }
    return sendBadRequest(res, message.userProfileDectivatedSuccessfully)
  } catch (e) {
    console.log(e)
    logger.error(e)
    logger.error('USER_DELETE')
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

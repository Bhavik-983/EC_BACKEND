import jwt from 'jsonwebtoken'
import { sendBadRequestWith406Code } from '../utilities/response/index.js'
import config from '../config/index.js'
import message from '../utilities/message/index.js'
import { AdminModal } from '../models/adminModels.js'
import logger from '../utilities/logger.js'

export const isAdmin = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization

    if (!bearerToken) { return sendBadRequestWith406Code(res, message.authTokenRequired) }
    const tokenInfo = await jwt.verify(
      String(bearerToken).split(' ')[1],
      config.ADMIN_SECRET
    )

    if (!tokenInfo && !tokenInfo._id) { return sendBadRequestWith406Code(res, message.tokenFormatInvalid) }
    const admin = await AdminModal.findOne(
      { _id: tokenInfo._id },
      { _id: 1, email: 1, password: 1, accessTokenId: 1 }
    )

    if (!admin) return sendBadRequestWith406Code(res, message.adminNotFound)
    if (admin.accessTokenId !== tokenInfo.accessTokenId) { return sendBadRequestWith406Code(res, message.invalidToken) }

    req.admin = admin
    next()
  } catch (e) {
    logger.error('IS_ADMIN')
    if (String(e).includes('jwt expired')) {
      return sendBadRequestWith406Code(res, message.tokenExpiredError)
    } else if (String(e).includes('invalid token')) {
      return sendBadRequestWith406Code(res, message.invalidToken)
    } else if (String(e).includes('jwt malformed')) {
      return sendBadRequestWith406Code(res, message.invalidToken)
    } else if (String(e).includes('invalid signature')) {
      return sendBadRequestWith406Code(res, message.invalidSignature)
    }
    logger.error(e)
    return sendBadRequest(res, message.somethingGoneWrong)
  }
}

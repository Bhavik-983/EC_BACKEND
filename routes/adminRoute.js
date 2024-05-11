import express from 'express'
import { upload } from '../helper/mullterHelper.js'
import {
  Login,
  changePassword,
  forgotPassword,
  setPassword,
  verifyToken
} from '../controllers/adminController.js'
import message from '../utilities/message/index.js'
import { check } from 'express-validator'
import { validationfield } from '../field_valodator/index.js'
import { isAdmin } from '../middleware/adminValidator.js'

const router = express.Router()

// Login
router.post(
  '/login',
  [
    check('email').notEmpty().withMessage(message?.emailIsRequired),
    check('password').notEmpty().withMessage(message.passwordIsRequired)
  ],
  validationfield,
  Login
)

// set pass
router.post(
  '/set-password',
  upload.single('profile'),
  [
    check('token').notEmpty().withMessage(message?.passwordTokenIsRequired),
    check('password')
      .notEmpty()
      .withMessage(message.passwordIsRequired)
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/s)
  ],
  validationfield,
  setPassword
)

// change pass
router.post(
  '/change/pass',
  isAdmin,
  [
    check('oldPass').notEmpty().withMessage(message?.passwordIsRequired),
    check('newPass')
      .notEmpty()
      .withMessage(message?.newPasswordRequired)
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/s)
      .withMessage(message?.passwordFormatIsNotValid)
  ],
  validationfield,
  changePassword
)

// forgot pass
router.post(
  '/forgot-pass-link',
  [check('email').notEmpty().withMessage(message?.emailIsRequired)],
  validationfield,
  forgotPassword
)

// verify pass token
router.post('/verify-pass-token', [check('token').notEmpty().withMessage(message?.tokenIsRequired)], validationfield, verifyToken)

export default router

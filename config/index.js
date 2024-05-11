'use strict'

import dotenv from 'dotenv'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

export default {
  NETWORK: {
    ETH: {
      RPC_API: process.env.RPC_API
    }
  },

  DATABASE: {
    MONGO: {
      URI: process.env.MONGO_URI
    }
  },

  LOGGER: {
    LEVEL: process.env.LOG_LEVEL || 'debug'
  },

  API_KEY: process.env.API_KEY,
  EMAIL: process.env.EMAIL,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,
  ACCESS_TOKEN_ADMIN: process.env.ACCESS_TOKEN_ADMIN,
  REFRESH_TOKEN_ADMIN: process.env.REFRESH_TOKEN_ADMIN,
  REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SG_MAIL: process.env.SG_MAIL,
  BASE_URL: process.env.BASE_URL,
  IMAGE_PATH: process.env.IMAGE_PATH,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  TOKEN_EXP: process.env.TOKEN_EXP,
  ADMIN_SECRET_REF: process.env.ADMIN_SECRET_REF

}

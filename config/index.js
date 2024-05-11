"use strict";

import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default {
  NETWORK: {
    ETH: {
      RPC_API: process.env.RPC_API,
    },
  },

  DATABASE: {
    MONGO: {
      URI: process.env.MONGO_URI,
    },
  },

  LOGGER: {
    LEVEL: process.env.LOG_LEVEL || "debug",
  },
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SG_MAIL: process.env.SG_MAIL,
  ACCESS_TOKEN_ADMIN: process.env.ACCESS_TOKEN_ADMIN,
  USER_TOKEN_ADMIN: process.env.USER_TOKEN_ADMIN,
  ACCESS_TOKEN_EXP: process.env.ACCESS_TOKEN_EXP,
  REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP,
};

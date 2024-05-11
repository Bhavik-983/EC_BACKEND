import mongoose from "mongoose";
const Schema = await mongoose.Schema;
const adminSchema = await new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    accessTokenId: {
      type: String,
    },
    refereshTokenId: {
      type: String,
    },
    set_password_token: {
      type: String,
    },
    set_password_token_exp_time: {
      type: Date,
    },
    profile: {
      type: String,
    },
  },
  { timestamps: true }
);

export const AdminSchema = await mongoose.model("admins", adminSchema);

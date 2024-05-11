import express from "express";
import healthRoute from "./health/index.js";
import adminRoute from "./adminRoute.js";
import { isAdmin } from "../middleware/adminValidator.js";
const router = express.Router();

/* GET home page. */

//like router use like this
router.use("/health", healthRoute);
router.use("/admin", adminRoute);
export default router;

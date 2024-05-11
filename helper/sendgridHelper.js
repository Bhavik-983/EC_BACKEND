import sgMail from "../utilities/sgMailUtilities.js";
import logger from "../utilities/logger.js";

// SEND TEXT MAIL
export const sendTextMail = async (to, from, subject, text, attachments) => {
  try {
    return await sgMail.send({
      to,
      from,
      subject,
      text,
      attachments,
    });
  } catch (e) {
    logger.error(e);
    return "";
  }
};

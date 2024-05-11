import logger from '../utilities/logger.js'
import messages from '../utilities/message/index.js'

export const errorHelper = (e, functionName) => {
  logger.error(functionName)
  logger.error(e)
  return messages.somethingGoneWrong
}

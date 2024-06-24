import Log, { LoggerOptions, Logger } from 'pino';
var logger: Logger;

function initializeLog(options: LoggerOptions<never>) {
  logger = Log(options);
}

export { logger, initializeLog };

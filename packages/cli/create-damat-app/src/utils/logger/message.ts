import pc from "picocolors";
import { logger } from "./index";

type LogOptions = {
  message: string;
  type?: "error" | "success" | "info" | "warn" | "verbose";
  stack?: string;
};

export default ({ message, type = "info", stack }: LogOptions) => {
  switch (type) {
    case "info":
      logger.info(pc.white(message));
      break;
    case "success":
      logger.info(pc.green(message));
      break;
    case "warn":
      logger.warn(pc.yellow(message));
      break;
    case "verbose":
      logger.info(`${pc.bgYellow(pc.black("VERBOSE LOG:"))} ${message}`);
      break;
    case "error":
      console.error(pc.bold(pc.red(message.trim() + (stack || ""))));
      process.exit(1);
  }
};

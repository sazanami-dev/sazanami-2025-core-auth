import { Request, Response, NextFunction } from "express";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { DoResponse } from "@/utils/do-resnpose";
import Logger from "@/logger";
import { registEventLog } from "@/utils/regist-event-log";

const logger = new Logger('middleware', 'verify-manage-key');

export default function verifyManageKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-manage-key'] !== EnvUtil.get(EnvKey.MANAGE_API_KEY)) {
    logger.warn(`Unauthorized access attempt from IP: ${req.ip} to ${req.originalUrl}`);
    registEventLog(
      "SECURITY",
      "JSON",
      JSON.stringify({
        message: "Unauthorized access attempt detected!",
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'] || 'UNKNOWN',
        headers: req.headers,
      }),
      "MIDDLEWARE"
    );
    return DoResponse.init(res).status(401).json({ error: 'Unauthorized: Invalid manage key, This incident will be logged.' }).send();
  } else {
    next();
  }
};

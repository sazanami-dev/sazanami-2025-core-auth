import Logger from "@/logger";
import { registEventLog } from "@/utils/regist-event-log";
import os from "os";

const logger = new Logger('cron', 'record-system-state');

async function task() {
  logger.info('Recording system state...');
  try {
    const memoryUsage = process.memoryUsage();
    const loadAverage = os.loadavg();
    const uptime = os.uptime();
    const systemState = {
      memoryUsage,
      loadAverage,
      uptime,
      timestamp: new Date().toISOString(),
    };
    await registEventLog(
      "PERFORMANCE",
      "JSON",
      JSON.stringify(systemState),
      "SYSTEM"
    );
    logger.info('System state recorded successfully.');
  } catch (error) {
    await registEventLog(
      "PERFORMANCE",
      "JSON",
      JSON.stringify({
        message: "Error recording system state",
        error: (error as Error).message,
      }),
      "SYSTEM"
    );
    logger.error(`Error recording system state: ${(error as Error).message}`);
  }
}

export default task;

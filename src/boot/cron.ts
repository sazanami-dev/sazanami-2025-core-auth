import Logger from "@/logger";
import startCrons from "@/crons";

export const setupCronJobs = () => {
  const logger = new Logger('boot', 'cron');

  startCrons().then(() => {
    logger.info('Cron jobs started successfully.', 'start');
  }).catch((error) => {
    logger.error(`Error starting cron jobs: ${(error as Error).message}`, 'start');
  });
}

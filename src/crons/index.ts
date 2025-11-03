import nodeCron from "node-cron";

import sweepPendingRedirect from "./tasks/sweep-pending-redirect";
import recordSystemState from "./tasks/record-system-state";

async function startCrons() {
  // Sweep pending redirects every 2 minutes
  nodeCron.schedule("*/2 * * * *", sweepPendingRedirect);
  nodeCron.schedule("*/5 * * * *", recordSystemState);
}

export default startCrons;

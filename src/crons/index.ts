import nodeCron from "node-cron";

import sweepPendingRedirect from "./tasks/sweep-pending-redirect";

async function startCrons() {
  // Sweep pending redirects every 2 minutes
  nodeCron.schedule("*/2 * * * *", sweepPendingRedirect);
}

export default startCrons;

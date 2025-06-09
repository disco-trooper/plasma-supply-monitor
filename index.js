require("dotenv").config();
const { getTotalSupply } = require("./services/ethereumService");
const { sendNotification } = require("./services/notificationService");
const { log } = require("./utils/logger");

const pollingInterval = process.env.POLLING_INTERVAL || 60000;
let lastTotalSupply = null;

const monitorTotalSupply = async () => {
  try {
    const currentTotalSupply = await getTotalSupply();
    const currentTotalSupplyString = currentTotalSupply.toString();

    if (lastTotalSupply === null) {
      log(
        `Monitoring started. Initial total supply: ${currentTotalSupplyString}`
      );
      lastTotalSupply = currentTotalSupplyString;
      return;
    }

    if (lastTotalSupply !== currentTotalSupplyString) {
      const message = `Total Supply has changed!\nOld value: ${lastTotalSupply}\nNew value: ${currentTotalSupplyString}`;
      log(message);
      await sendNotification(message);
      lastTotalSupply = currentTotalSupplyString;
    } else {
      log(`Total supply unchanged: ${currentTotalSupplyString}`);
    }
  } catch (error) {
    log(`An error occurred during monitoring: ${error.message}`);
  }
};

const startMonitoring = () => {
  if (
    !process.env.ETHEREUM_RPC_URL ||
    !process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.TELEGRAM_CHAT_ID
  ) {
    log(
      "Error: Missing required environment variables. Please check your .env file."
    );
    process.exit(1);
  }

  log("Starting total supply monitor...");
  log(`Polling interval set to ${pollingInterval}ms`);
  log("Notifications will be sent via Telegram.");

  monitorTotalSupply();

  setInterval(monitorTotalSupply, parseInt(pollingInterval, 10));
};

startMonitoring();

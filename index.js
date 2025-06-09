require("dotenv").config();
const { getTotalSupply } = require("./services/ethereumService");
const { sendNotification } = require("./services/notificationService");

const pollingInterval = process.env.POLLING_INTERVAL || 60000;
let lastTotalSupply = null;

const monitorTotalSupply = async () => {
  try {
    const currentTotalSupply = await getTotalSupply();
    const currentTotalSupplyString = currentTotalSupply.toString();

    if (lastTotalSupply === null) {
      console.log(
        `Monitoring started. Initial total supply: ${currentTotalSupplyString}`
      );
      lastTotalSupply = currentTotalSupplyString;
      return;
    }

    if (lastTotalSupply !== currentTotalSupplyString) {
      const message = `Total Supply has changed!\nOld value: ${lastTotalSupply}\nNew value: ${currentTotalSupplyString}`;
      console.log(message);
      await sendNotification(message);
      lastTotalSupply = currentTotalSupplyString;
    } else {
      console.log(`Total supply unchanged: ${currentTotalSupplyString}`);
    }
  } catch (error) {
    console.error("An error occurred during monitoring:", error.message);
  }
};

const startMonitoring = () => {
  if (
    !process.env.ETHEREUM_RPC_URL ||
    !process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.TELEGRAM_CHAT_ID
  ) {
    console.error(
      "Error: Missing required environment variables. Please check your .env file."
    );
    process.exit(1);
  }

  console.log("Starting total supply monitor...");
  console.log(`Polling interval set to ${pollingInterval}ms`);
  console.log("Notifications will be sent via Telegram.");

  monitorTotalSupply();

  setInterval(monitorTotalSupply, parseInt(pollingInterval, 10));
};

startMonitoring();

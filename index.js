require("dotenv").config();
const {
  getTotalSupply,
  monitorSupplyEvents,
} = require("./services/ethereumService");
const { sendNotification } = require("./services/notificationService");
const { log, error } = require("./utils/logger");

let lastTotalSupply = null;

const handleSupplyChange = async (newTotalSupply) => {
  const newTotalSupplyString = newTotalSupply.toString();

  if (lastTotalSupply === null) {
    log(`Monitoring started. Initial total supply: ${newTotalSupplyString}`);
    lastTotalSupply = newTotalSupplyString;
    return;
  }

  if (lastTotalSupply !== newTotalSupplyString) {
    const message = `Total Supply has changed!\nOld value: ${lastTotalSupply}\nNew value: ${newTotalSupplyString}`;
    log(message);
    await sendNotification(message);
    lastTotalSupply = newTotalSupplyString;
  } else {
    // This case is less likely with event-driven model but good for safety
    log(`Event received, but total supply unchanged: ${newTotalSupplyString}`);
  }
};

const startMonitoring = async () => {
  if (
    !process.env.ETHEREUM_RPC_URL ||
    !process.env.ETHEREUM_WSS_URL ||
    !process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.TELEGRAM_CHAT_ID ||
    !process.env.CONTRACT_ADDRESS
  ) {
    error(
      "Error: Missing required environment variables. Please check your .env file."
    );
    process.exit(1);
  }

  log("Starting total supply monitor using event-driven model...");
  log("Notifications will be sent via Telegram.");

  // Perform an initial check for the total supply
  try {
    const initialSupply = await getTotalSupply();
    handleSupplyChange(initialSupply);
  } catch (err) {
    error("Failed to get initial total supply. Exiting.", err);
    process.exit(1);
  }

  // Set up the event listener for real-time updates
  monitorSupplyEvents(handleSupplyChange);
};

startMonitoring();

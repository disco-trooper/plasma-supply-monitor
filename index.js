const { ethers } = require("ethers");
require("dotenv").config();
const {
  initializeWebSocket,
  getTotalSupply,
  monitorSupplyEvents,
  getWebSocketProvider,
  getTokenDecimals,
} = require("./services/ethereumService");
const { sendNotification } = require("./services/notificationService");
const { log, error } = require("./utils/logger");

let previousTotalSupply = null;
let tokenDecimals = null;

async function onSupplyChange(newTotalSupply) {
  if (tokenDecimals === null) {
    error("Token decimals not available, cannot process supply change.");
    return;
  }

  if (previousTotalSupply === null) {
    const formattedSupply = ethers.formatUnits(newTotalSupply, tokenDecimals);
    log(`Monitoring started. Initial total supply: ${formattedSupply}`);
    previousTotalSupply = newTotalSupply;
    return;
  }

  const comparisonResult = newTotalSupply.sub(previousTotalSupply);
  if (comparisonResult.isZero()) {
    const formattedSupply = ethers.formatUnits(newTotalSupply, tokenDecimals);
    log(`Total supply unchanged: ${formattedSupply}`);
    return;
  }

  const difference = comparisonResult.abs();
  const formattedDifference = ethers.formatUnits(difference, tokenDecimals);
  const formattedNewSupply = ethers.formatUnits(newTotalSupply, tokenDecimals);

  let message;
  if (comparisonResult.isNegative()) {
    message = `Total supply decreased by ${formattedDifference}! New total supply: ${formattedNewSupply}`;
  } else {
    message = `Total supply increased by ${formattedDifference}! New total supply: ${formattedNewSupply}`;
  }

  log(message);
  sendNotification(message);

  previousTotalSupply = newTotalSupply;
}

function isWebSocketConnected() {
  const provider = getWebSocketProvider();
  // readyState === 1 means the WebSocket is OPEN
  return provider && provider.websocket && provider.websocket.readyState === 1;
}

async function main() {
  log("Starting total supply monitor using event-driven model...");
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    log("Notifications will be sent via Telegram.");
  }

  // Fetch decimals first, as it's needed for formatting
  try {
    tokenDecimals = await getTokenDecimals();
  } catch (err) {
    error("Failed to fetch token decimals. Exiting.", err);
    process.exit(1);
  }

  // Initial setup
  initializeWebSocket();
  monitorSupplyEvents(onSupplyChange);

  try {
    const initialSupply = await getTotalSupply();
    onSupplyChange(initialSupply);
  } catch (err) {
    error("Failed to get initial total supply. Exiting.", err);
    process.exit(1);
  }

  // Setup a monitor to check the connection and re-initialize if it drops
  setInterval(() => {
    if (!isWebSocketConnected()) {
      log("WebSocket connection lost. Attempting to re-initialize...");
      initializeWebSocket();
      // Re-subscribe to events on the new connection
      monitorSupplyEvents(onSupplyChange);
    }
  }, 10000); // Check every 10 seconds
}

main().catch((err) => {
  error("An unexpected error occurred in the main application loop:", err);
  process.exit(1);
});

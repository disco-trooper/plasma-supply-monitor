const { ethers } = require("ethers");
const { log, error } = require("../utils/logger");
require("dotenv").config();

let webSocketProvider;
let httpProvider;
let webSocketContract;
let heartbeatInterval;

function initializeWebSocket() {
  log("Initializing new WebSocket provider...");

  // Clean up any existing provider and listeners first
  if (webSocketProvider) {
    webSocketProvider.destroy();
    log("Previous WebSocket provider destroyed.");
  }
  stopHeartbeat();

  webSocketProvider = new ethers.WebSocketProvider(
    process.env.ETHEREUM_WSS_URL
  );

  webSocketContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    getContractAbi(),
    webSocketProvider
  );

  setupEventListeners();
  log("New WebSocket provider initialized and listeners attached.");
}

function setupEventListeners() {
  if (!webSocketProvider) return;

  const ws = webSocketProvider.websocket;

  ws.on("open", () => {
    log("WebSocket connection opened.");
    startHeartbeat();
  });

  ws.on("close", (code, reason) => {
    const reasonString =
      reason && reason.toString() !== ""
        ? reason.toString()
        : "No reason given";
    log(`WebSocket connection closed. Code: ${code}, Reason: ${reasonString}.`);
    stopHeartbeat();
    // The main app will monitor the connection and re-initialize if needed.
  });

  ws.on("error", (err) => {
    error("Raw WebSocket error:", err);
    stopHeartbeat();
  });

  webSocketProvider.on("error", (err) => {
    error("Ethers WebSocket Provider error:", err);
  });
}

function startHeartbeat() {
  log("Starting heartbeat mechanism.");
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(async () => {
    log("Sending heartbeat ping (getNetwork)...");
    try {
      if (webSocketProvider) {
        const network = await webSocketProvider.getNetwork();
        log(`Received heartbeat pong (chainId: ${network.chainId}).`);
      }
    } catch (err) {
      error("Heartbeat request failed:", err);
    }
  }, 30000);
}

function stopHeartbeat() {
  log("Stopping heartbeat mechanism.");
  clearInterval(heartbeatInterval);
}

const getTotalSupply = async () => {
  if (!httpProvider) {
    httpProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  }
  const httpContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    getContractAbi(),
    httpProvider
  );
  try {
    const totalSupply = await httpContract.totalSupply();
    return totalSupply;
  } catch (err) {
    error("Error fetching total supply:", err);
    throw err;
  }
};

const monitorSupplyEvents = (onSupplyChange) => {
  if (!webSocketContract) {
    error("Cannot monitor events, WebSocket contract is not initialized.");
    return;
  }
  log("Setting up contract event listener for Transfer events...");
  webSocketContract.on("Transfer", async (from, to) => {
    const zeroAddress = ethers.ZeroAddress;
    if (from === zeroAddress || to === zeroAddress) {
      log(`Supply-altering Transfer event detected. From: ${from}, To: ${to}`);
      try {
        const newTotalSupply = await getTotalSupply();
        onSupplyChange(newTotalSupply);
      } catch (err) {
        error("Error processing supply change after event:", err);
      }
    }
  });
};

function getWebSocketProvider() {
  return webSocketProvider;
}

function getContractAbi() {
  return [
    {
      constant: true,
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "from", type: "address" },
        { indexed: true, name: "to", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
  ];
}

module.exports = {
  initializeWebSocket,
  getTotalSupply,
  monitorSupplyEvents,
  getWebSocketProvider,
};

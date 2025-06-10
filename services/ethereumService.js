const { ethers } = require("ethers");
const { log, error } = require("../utils/logger");
require("dotenv").config();

// Provider for polling
const httpProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
// Provider for listening to events
const webSocketProvider = new ethers.WebSocketProvider(
  process.env.ETHEREUM_WSS_URL
);

// --- Attach listeners immediately after creation to avoid race conditions ---
const ws = webSocketProvider.websocket;

// --- Heartbeat Mechanism ---
let heartbeatInterval;

function heartbeat() {
  log("Sending heartbeat ping (eth_chainId)...");
  // Send a harmless JSON-RPC request to keep the connection alive
  webSocketProvider
    .send("eth_chainId", [])
    .then((chainId) => {
      log(`Received heartbeat pong (chainId: ${chainId}).`);
    })
    .catch((err) => {
      error("Heartbeat request failed:", err);
      // If the heartbeat fails, something is wrong with the connection.
      // Ethers will likely emit a 'close' or 'error' event, which will stop the heartbeat.
    });
}

function startHeartbeat() {
  log("Starting heartbeat mechanism.");
  // Clear any existing interval before starting a new one.
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(heartbeat, 30000); // 30 seconds
}

function stopHeartbeat() {
  log("Stopping heartbeat mechanism.");
  clearInterval(heartbeatInterval);
}
// -------------------------

// --- WebSocket Event Listeners ---
ws.on("open", () => {
  log("WebSocket connection opened.");
  startHeartbeat(); // Start the heartbeat when the connection opens.
});

ws.on("close", (code) => {
  log(
    `WebSocket connection closed with code: ${code}. Ethers.js will attempt to reconnect.`
  );
  stopHeartbeat(); // Stop the heartbeat when the connection closes.
});

ws.on("error", (err) => {
  error("Raw WebSocket error:", err);
  stopHeartbeat(); // Also stop on error to be safe.
});
// --------------------------------

const contractAddress = process.env.CONTRACT_ADDRESS;

const contractAbi = [
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

const httpContract = new ethers.Contract(
  contractAddress,
  contractAbi,
  httpProvider
);
const webSocketContract = new ethers.Contract(
  contractAddress,
  contractAbi,
  webSocketProvider
);

const getTotalSupply = async () => {
  try {
    const totalSupply = await httpContract.totalSupply();
    return totalSupply;
  } catch (err) {
    error("Error fetching total supply:", err);
    throw err;
  }
};

const monitorSupplyEvents = (onSupplyChange) => {
  log("Setting up contract event listener for Transfer events...");

  webSocketContract.on("Transfer", async (from, to) => {
    const zeroAddress = ethers.ZeroAddress;

    // A change in total supply occurs on mint (from zero address) or burn (to zero address)
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

  // The 'error' event on the provider is the correct way to handle provider-level errors
  webSocketProvider.on("error", (err) => {
    error(
      "Ethers WebSocket Provider error. The provider will attempt to reconnect.",
      err
    );
  });
};

module.exports = {
  getTotalSupply,
  monitorSupplyEvents,
};

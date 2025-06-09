const { ethers } = require("ethers");
const { log, error } = require("../utils/logger");
require("dotenv").config();

// Provider for polling
const httpProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
// Provider for listening to events
const webSocketProvider = new ethers.WebSocketProvider(
  process.env.ETHEREUM_WSS_URL
);

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
  log("Setting up event listener for Transfer events...");

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

  // The 'error' event on the provider is the correct way to handle WebSocket errors
  webSocketProvider.on("error", (err) => {
    error(
      "WebSocket Provider error. The provider will attempt to reconnect.",
      err
    );
  });
};

module.exports = {
  getTotalSupply,
  monitorSupplyEvents,
};

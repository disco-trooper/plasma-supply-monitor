const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

const contractAddress = process.env.CONTRACT_ADDRESS;

const contractAbi = [
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const contract = new ethers.Contract(contractAddress, contractAbi, provider);

const getTotalSupply = async () => {
  try {
    const totalSupply = await contract.totalSupply();
    return totalSupply;
  } catch (error) {
    console.error("Error fetching total supply:", error);
    throw error;
  }
};

module.exports = {
  getTotalSupply,
};

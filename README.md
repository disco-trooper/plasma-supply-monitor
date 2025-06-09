# Plasma Supply Monitor

This project contains a Node.js script that monitors the `totalSupply` of a specified Ethereum smart contract in real-time and sends a notification to Telegram when the value changes.

It uses a WebSocket connection to listen for `Transfer` events, which is more efficient than traditional polling.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/disco-trooper/plasma-supply-monitor.git
    cd plasma-supply-monitor
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root of the project. You can copy the example if one exists, or create it from scratch.

    Update the `.env` file with your specific credentials:

    - `ETHEREUM_RPC_URL`: Your HTTP connection URL to an Ethereum node (e.g., from [Infura](https://infura.io) or [Alchemy](https://www.alchemy.com/)). This is used for initial data fetching.
    - `ETHEREUM_WSS_URL`: Your WebSocket URL for real-time event monitoring (e.g., `wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID`).
    - `CONTRACT_ADDRESS`: The address of the smart contract to monitor.
    - `TELEGRAM_BOT_TOKEN`: The token for your Telegram bot.
    - `TELEGRAM_CHAT_ID`: The ID of the chat where the Telegram bot will send messages.

## Usage

To start the monitoring script, run the following command:

```bash
node index.js
```

The script will connect to the Ethereum network, get the initial supply, and then listen for events that change the `totalSupply`. Notifications will be sent to your configured Telegram chat when a change is detected.

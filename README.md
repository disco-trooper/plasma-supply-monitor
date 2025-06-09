# Ethereum Smart Contract totalSupply Monitor

This project contains a Node.js script that monitors the `totalSupply` variable of a specified Ethereum smart contract and sends a notification to Telegram when the value changes.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root of the project by copying the `.env.example` file.

    ```bash
    cp .env.example .env
    ```

    Update the `.env` file with your specific credentials:

    - `ETHEREUM_RPC_URL`: Your connection URL to an Ethereum node (e.g., from [Infura](https://infura.io) or [Alchemy](https://www.alchemy.com/)).
    - `CONTRACT_ADDRESS`: The address of the smart contract to monitor. (It is already pre-filled with the requested contract address).
    - `TELEGRAM_BOT_TOKEN`: The token for your Telegram bot.
    - `TELEGRAM_CHAT_ID`: The ID of the chat where the Telegram bot will send messages.
    - `POLLING_INTERVAL`: The interval in milliseconds to check for `totalSupply` changes (e.g., `60000` for 1 minute).

## Usage

To start the monitoring script, run the following command:

```bash
node index.js
```

The script will then start polling for changes to the `totalSupply` of the configured smart contract and send notifications when a change is detected.

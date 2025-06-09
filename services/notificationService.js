const axios = require("axios");
require("dotenv").config();

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

const sendTelegramNotification = async (message) => {
  if (!telegramBotToken || !telegramChatId) {
    console.error("Telegram bot token or chat ID is not configured.");
    return;
  }
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: telegramChatId,
      text: message,
    });
    console.log("Telegram notification sent successfully.");
  } catch (error) {
    console.error("Error sending Telegram notification:", error.message);
  }
};

module.exports = {
  sendNotification: sendTelegramNotification,
};

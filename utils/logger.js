const getTimestamp = () => new Date().toISOString();

const log = (message) => {
  console.log(`[${getTimestamp()}] ${message}`);
};

const error = (message, err) => {
  console.error(`[${getTimestamp()}] ${message}`, err || "");
};

module.exports = { log, error };

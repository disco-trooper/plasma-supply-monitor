const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

const error = (message, err) => {
  const timestamp = new Date().toISOString();
  if (err) {
    console.error(`[${timestamp}] ${message}`, err);
  } else {
    console.error(`[${timestamp}] ${message}`);
  }
};

module.exports = { log, error };

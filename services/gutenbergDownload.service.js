const axios = require("axios");

const downloadFileBuffer = async (url, options = {}) => {
  const maxAttempts = options.retries || 3;
  const timeout = options.timeout || 120000;
  const maxRedirects = options.maxRedirects || 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout,
        maxRedirects,
      });

      return Buffer.from(response.data);
    } catch (error) {
      const isRetryable =
        attempt < maxAttempts &&
        (error.code === "ECONNABORTED" ||
          error.code === "ETIMEDOUT" ||
          error.code === "ECONNRESET" ||
          error.code === "EAI_AGAIN" ||
          !error.response);

      if (!isRetryable) {
        throw error;
      }

      const delay = 500 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to download file after ${maxAttempts} attempts`);
};

module.exports = {
  downloadFileBuffer,
};
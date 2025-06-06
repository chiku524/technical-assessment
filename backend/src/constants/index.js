const { ERROR_MESSAGES } = require("./error-messages");
const API_HOST = 'api.jsonbin.io/v3';
const API_SUB_URL = 'b';
const SAMPLE_API_KEY = '6a7184d7da38895dfeb6d180';
const API_HEADERS = {
  "x-secret-header": "secret",
};
const API_URL = `https://${API_HOST}/${API_SUB_URL}/${SAMPLE_API_KEY}`;

module.exports = {
    ERROR_MESSAGES,
    SAMPLE_API_KEY,
    API_SUB_URL,
    API_HOST,
    API_HEADERS,
    API_URL,
};
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Initialize the client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    let result;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (error) {
        const retryable = error.status === 429 || (error.status >= 500 && error.status < 600);
        if (!retryable || attempt === MAX_RETRIES) {
          throw error;
        }

        const delayMs = RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 250;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Invalid Gemini response');
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw error;
  }
};

module.exports = {
  callGemini,
};
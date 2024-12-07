const API_KEY = "ct9sq51r01quh43oro60ct9sq51r01quh43oro6g";
const BASE_URL = "https://finnhub.io/api/v1";

export const fetchQuote = async (symbol) => {
    const url = `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch quote");
    }

    return response.json();
};
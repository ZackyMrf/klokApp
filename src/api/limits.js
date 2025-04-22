import fetch from "node-fetch";

export async function getUserLimits(baseUrl, sessionToken) {
  const response = await fetch(`${baseUrl}/rate-limit`, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "x-session-token": sessionToken,
      Origin: "https://klokapp.ai",
      Referer: "https://klokapp.ai/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get rate limits: ${response.status} - ${errorText}`
    );
  }

  const rateLimitData = await response.json();

  return {
    remainingMessages: rateLimitData.remaining || 0,
    totalMessages: rateLimitData.limit || 0,
    isPremium: rateLimitData.limit > 10,
    resetTime: rateLimitData.reset_time || null,
  };
}
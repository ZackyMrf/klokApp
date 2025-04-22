import fetch from "node-fetch";

export async function sendMessage(baseUrl, sessionToken, threadId, message) {
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    body: JSON.stringify({
      id: threadId,
      title: "",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      sources: [],
      model: "llama-3.3-70b-instruct",
      created_at: new Date().toISOString(),
      language: "english",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Send message failed: ${response.status} - ${errorText}`
    );
  }

  const responseText = await response.text();

  try {
    const data = JSON.parse(responseText);

    if (
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message
    ) {
      return data.choices[0].message;
    } else if (data.message) {
      return { content: data.message };
    }
  } catch (e) {
    // If parsing failed but response is OK, return the raw text
  }

  return { content: responseText };
}
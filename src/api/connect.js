import { ethers } from "ethers";
import fetch from "node-fetch";
import chalk from "chalk";

export async function connectWallet(wallet, baseUrl) {
  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.5",
    "cache-control": "no-cache",
    "content-type": "application/json",
    origin: "https://klokapp.ai",
    pragma: "no-cache",
    referer: "https://klokapp.ai/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  };

  console.log(chalk.blue("🔑 Preparing wallet connection..."));
  
  // Build and sign message without recaptcha
  const nonce = ethers.hexlify(ethers.randomBytes(48)).substring(2);
  const messageToSign = [
    `klokapp.ai wants you to sign in with your Ethereum account:`,
    wallet.address,
    ``,
    ``,
    `URI: https://klokapp.ai/`,
    `Version: 1`,
    `Chain ID: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");

  const signature = await wallet.signMessage(messageToSign);
  
  // Try direct verification without recaptcha token
  console.log(chalk.blue("🔐 Attempting direct wallet verification..."));
  
  try {
    // Send verification request without recaptcha token
    const verifyBody = {
      signedMessage: signature,
      message: messageToSign,
      referral_code: null
      // recaptcha_token is omitted
    };

    const verifyResponse = await fetch(`${baseUrl}/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify(verifyBody),
    });

    const responseText = await verifyResponse.text();
    
    if (verifyResponse.ok) {
      let verifyData;
      try {
        verifyData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (verifyData.session_token) {
        console.log(chalk.green("✅ Direct verification successful!"));
        return verifyData.session_token;
      }
    } else {
      console.log(chalk.yellow(`⚠️ Direct verification failed: ${verifyResponse.status}`));
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Direct verification error: ${error.message}`));
  }

  // If direct verification failed, try with a dummy token
  console.log(chalk.blue("🔄 Trying alternative verification method..."));
  
  // Use a dummy recaptcha token (may work if server only checks format not validity)
  const dummyTokens = [
    "03AKH6MRHPV5S6TlaFdK3aGgJVkFELJvLwVcUlbRg0lymXwLWfLQqvZGqWQ8zYM5W2jsH9KKCU",
    "03AKH6MRHsRyFQDmQm8hCEKkJgYFr4WtMSlYfCcw4jOWTuL0h3KpV5vtdCeNaZZdFFFgFesrhFK",
    "03AKH6MRH2YFgm6BZb1NlYpeuBtW85Yif_0yYM1tLwfW88CnNfDwxRNmwQl5QGtYmIZXQ99vIVP"
  ];
  
  for (const dummyToken of dummyTokens) {
    try {
      const verifyBody = {
        signedMessage: signature,
        message: messageToSign,
        referral_code: null,
        recaptcha_token: dummyToken
      };

      const verifyResponse = await fetch(`${baseUrl}/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify(verifyBody),
      });

      const responseText = await verifyResponse.text();
      
      if (verifyResponse.ok) {
        let verifyData;
        try {
          verifyData = JSON.parse(responseText);
        } catch (e) {
          continue;
        }

        if (verifyData.session_token) {
          console.log(chalk.green("✅ Alternative verification successful!"));
          return verifyData.session_token;
        }
      }
    } catch (error) {
      continue;
    }
  }

  // If all attempts failed, try with hCaptcha
  console.log(chalk.blue("🔄 Trying hCaptcha verification..."));
  
  try {
    // Get hCaptcha token
    const hcaptchaResponse = await fetch(`${baseUrl}/hcaptcha`, {
      method: "GET",
      headers
    });
    
    if (hcaptchaResponse.ok) {
      const hcaptchaData = await hcaptchaResponse.json();
      
      if (hcaptchaData.token) {
        // Send verification with hCaptcha token
        const verifyBody = {
          signedMessage: signature,
          message: messageToSign,
          referral_code: null,
          hcaptcha_token: hcaptchaData.token
        };
        
        const verifyResponse = await fetch(`${baseUrl}/verify`, {
          method: "POST",
          headers,
          body: JSON.stringify(verifyBody),
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          if (verifyData.session_token) {
            console.log(chalk.green("✅ hCaptcha verification successful!"));
            return verifyData.session_token;
          }
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️ hCaptcha verification error: ${error.message}`));
  }

  // Final fallback: use turnstile captcha
  console.log(chalk.blue("🔄 Attempting turnstile captcha verification..."));
  
  try {
    const turnstileResponse = await fetch(`${baseUrl}/turnstile`, {
      method: "GET",
      headers
    });
    
    if (turnstileResponse.ok) {
      const turnstileData = await turnstileResponse.json();
      
      if (turnstileData.token) {
        const verifyBody = {
          signedMessage: signature,
          message: messageToSign,
          referral_code: null,
          cf_turnstile_token: turnstileData.token
        };
        
        const verifyResponse = await fetch(`${baseUrl}/verify`, {
          method: "POST",
          headers,
          body: JSON.stringify(verifyBody),
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          if (verifyData.session_token) {
            console.log(chalk.green("✅ Turnstile verification successful!"));
            return verifyData.session_token;
          }
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Turnstile verification error: ${error.message}`));
  }

  // If all methods fail, throw error
  throw new Error("All verification methods failed. The API may have changed.");
}
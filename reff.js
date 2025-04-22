import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";
import { Wallet, ethers } from "ethers";
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCOUNTS_FILE = path.join(__dirname, "accounts.txt");
const PROXY_FILE = path.join(__dirname, "proxy.txt");
const BASE_URL = "https://api1-pp.klokapp.ai/v1";

const args = process.argv.slice(2);
const REFERRAL_CODE = args[0];
const ACCOUNT_COUNT = parseInt(args[1], 10) || 1;

if (!REFERRAL_CODE) {
  console.error("❌ Harap masukkan kode referral!");
  process.exit(1);
}

console.log(`🔗 Menggunakan Referral Code: ${REFERRAL_CODE}`);
console.log(`👥 Jumlah Akun yang Dibuat: ${ACCOUNT_COUNT}`);

function generateWallet() {
  const wallet = Wallet.createRandom();
  const address = wallet.address;
  const privateKey = wallet.privateKey;

  fs.appendFileSync(ACCOUNTS_FILE, `${address} | ${privateKey}\n`);
  console.log(`✅ Wallet Baru: ${address}`);
  return wallet;
}

function createSiweMessage(address) {
  const nonce = ethers.hexlify(ethers.randomBytes(32)).slice(2);
  const timestamp = new Date().toISOString();
  return `klokapp.ai wants you to sign in with your Ethereum account:\n${address}\n\n\n` +
         `URI: https://klokapp.ai/\n` +
         `Version: 1\n` +
         `Chain ID: 1\n` +
         `Nonce: ${nonce}\n` +
         `Issued At: ${timestamp}`;
}

// Fungsi untuk mendapatkan reCAPTCHA token
async function getRecaptchaToken(agent) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Origin": "https://klokapp.ai",
    "Referer": "https://klokapp.ai/",
  };

  // Daftar endpoint yang mungkin untuk mendapatkan token captcha
  const potentialEndpoints = [
    "/recaptcha",
    "/recaptcha-token",
    "/captcha", 
    "/auth/recaptcha",
    "/token"
  ];

  for (const endpoint of potentialEndpoints) {
    try {
      console.log(`🔍 Mencoba mendapatkan token dari ${BASE_URL}${endpoint}...`);
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers,
        httpAgent: agent
      });

      if (response.data && response.data.token) {
        console.log(`✅ Berhasil mendapatkan token dari ${endpoint}`);
        return response.data.token;
      }
    } catch (error) {
      console.log(`⚠️ Endpoint ${endpoint} gagal: ${error.message}`);
    }
  }

  // Jika semua endpoint gagal, gunakan dummy token
  console.log(`⚠️ Gagal mendapatkan token dari semua endpoint, menggunakan dummy token`);
  return "03AKH6MRHYFxkYVZeqJg9HM3ZkRHPl_5EH4Qh_M_OTGKBTSOKbmXXkZFEfdZkH_8E";
}

async function signMessageAndRegister(wallet, agent) {
  const address = wallet.address;
  const message = createSiweMessage(address);
  console.log(`📝 Signing Message for ${address}`);
  const signedMessage = await wallet.signMessage(message);
  
  // Dapatkan reCAPTCHA token
  const recaptchaToken = await getRecaptchaToken(agent);
  
  // Payload lengkap dengan recaptcha_token
  const payload = { 
    signedMessage, 
    message, 
    referral_code: REFERRAL_CODE,
    recaptcha_token: recaptchaToken 
  };

  try {
    const response = await axios.post(`${BASE_URL}/verify`, payload, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Origin": "https://klokapp.ai",
        "Referer": "https://klokapp.ai/",
      },
      httpAgent: agent
    });
    console.log(`✅ Akun ${address} berhasil didaftarkan!`);
    return true;
  } catch (error) {
    // Tampilkan error lengkap untuk debugging
    console.error(`❌ Gagal mendaftar ${address}:`, 
      error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    
    // Jika error "missing field", coba tampilkan info lebih detail
    if (error.response && error.response.data && error.response.data.detail) {
      try {
        const detail = error.response.data.detail[0];
        console.error(`   Field yang hilang: ${detail.loc.join('.')}`);
      } catch (e) {
        // Jika gagal parsing error detail, abaikan
      }
    }
    
    return false;
  }
}

function getProxyAgent() {
  const proxies = fs.readFileSync(PROXY_FILE, 'utf-8').split('\n').filter(Boolean);
  
  // Check if there are any proxies available
  if (proxies.length === 0) {
    console.error("❌ Tidak ada proxy yang ditemukan dalam proxy.txt!");
    process.exit(1);
  }

  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)].trim();
  console.log(`📡 Menggunakan Proxy: ${randomProxy}`);

  // Determine if it's an HTTP/S or SOCKS proxy and create the appropriate agent
  if (randomProxy.startsWith('socks://')) {
    return new SocksProxyAgent(randomProxy);
  } else {
    return new HttpsProxyAgent(randomProxy);
  }
}

async function main() {
  const agent = getProxyAgent(); // Get a random proxy agent first
  let successCount = 0;

  for (let i = 0; i < ACCOUNT_COUNT; i++) {
    const wallet = generateWallet();
    const success = await signMessageAndRegister(wallet, agent);
    if (success) successCount++;
    
    // Tambahkan delay untuk menghindari rate limit
    if (i < ACCOUNT_COUNT - 1) {
      const delay = 3000 + Math.floor(Math.random() * 2000);
      console.log(`⏳ Menunggu ${delay/1000} detik sebelum akun berikutnya...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log(`\n📊 Statistik:`);
  console.log(`🔢 Total akun dibuat: ${ACCOUNT_COUNT}`);
  console.log(`✅ Berhasil: ${successCount}`);
  console.log(`❌ Gagal: ${ACCOUNT_COUNT - successCount}`);
}

main();
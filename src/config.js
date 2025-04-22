import "dotenv/config";

export default {
  baseUrl: "https://api1-pp.klokapp.ai/v1",
  scheduleMode: process.env.SCHEDULE_MODE || 'adaptive',
  persistentThreads: process.env.PERSISTENT_THREADS !== 'false',
  minChatInterval: parseInt(process.env.MIN_CHAT_INTERVAL || '15000'),
  maxChatDelay: parseInt(process.env.MAX_CHAT_DELAY || '1800000'),
  maxThreadAge: 24 * 60 * 60 * 1000, // 24 hours
  referralCode: process.env.REFERRAL_CODE || null
};
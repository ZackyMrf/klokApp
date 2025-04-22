import crypto from "crypto";

// Utility function for delays
export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Generate random UUID for thread IDs
export const generateThreadId = () => crypto.randomUUID();
// Format time in readable format
export function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
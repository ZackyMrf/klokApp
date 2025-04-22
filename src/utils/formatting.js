import chalk from "chalk";

/**
 * Format milliseconds into a readable time string
 * @param {number} ms - Time in milliseconds 
 * @returns {string} Formatted time string (e.g. "1d 2h 3m 4s")
 */
export function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Format ethereum address to a shortened version
 * @param {string} address - Full ethereum address
 * @returns {string} Shortened address (e.g. "0x1234...5678")
 */
export function formatAddress(address) {
  if (!address || address.length < 42) return address;
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}

/**
 * Format chat response for console output
 * @param {string} response - The response text
 * @param {number} maxLength - Maximum length before truncating
 * @returns {string} Formatted response
 */
export function formatResponse(response, maxLength = 100) {
  if (!response) return '';
  
  // Clean up response
  let cleanResponse = response.replace(/\n+/g, ' ').trim();
  
  // Truncate if too long
  if (cleanResponse.length > maxLength) {
    cleanResponse = `${cleanResponse.substring(0, maxLength)}...`;
  }
  
  return cleanResponse;
}

/**
 * Format wallet status with color
 * @param {boolean} isConnected - Whether the wallet is connected
 * @returns {string} Colored status text
 */
export function formatWalletStatus(isConnected) {
  return isConnected ? chalk.green('Connected') : chalk.yellow('Disconnected');
}

/**
 * Format success rate percentage
 * @param {number} successes - Number of successful operations
 * @param {number} total - Total number of operations
 * @returns {string} Formatted percentage
 */
export function formatSuccessRate(successes, total) {
  if (!total) return '0%';
  const rate = Math.round((successes / total) * 100);
  
  if (rate > 90) {
    return chalk.green(`${rate}%`);
  } else if (rate > 75) {
    return chalk.greenBright(`${rate}%`);
  } else if (rate > 50) {
    return chalk.yellow(`${rate}%`);
  } else {
    return chalk.red(`${rate}%`);
  }
}

/**
 * Format message category with color
 * @param {string} category - Message category
 * @returns {string} Colored category name
 */
export function formatCategory(category) {
  const categoryColors = {
    crypto: chalk.cyan,
    tech: chalk.blue,
    philosophical: chalk.magenta,
    personal: chalk.green,
    casual: chalk.yellow,
    default: chalk.white
  };
  
  const colorFn = categoryColors[category] || categoryColors.default;
  return colorFn(category);
}

/**
 * Format numeric values with commas for thousands
 * @param {number} num - Number to format
 * @returns {string} Formatted number with commas
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format date and time
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString();
}
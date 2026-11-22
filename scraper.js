const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const fs = require("fs");

chromium.use(stealth);

const FILE_NAME = "aviation_results.json";
const CONCURRENCY_LIMIT = 5;
const CAPTCHA_PAUSE_MS = 60000;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 5000;
const BROWSER_RELAUNCH_INTERVAL = 200;
const MEMORY_LIMIT_BYTES = 500 * 1024 * 1024;
const MAX_QUERY_RETRIES = 3;
const RETRY_BASE_MS = 5000;
const NETWORK_ERROR_BATCH_THRESHOLD = 3;
const NETWORK_PAUSE_MS = 75000;
const CONNECTIVITY_CHECK_URL = "https://www.google.com";
const CONNECTIVITY_MAX_RETRIES = 5;
const CONNECTIVITY_RETRY_DELAY_MS = 30000;
const FAILED_QUERIES_FILE = "failed_queries.json";

function createBackup() {
  if (fs.existsSync(FILE_NAME)) {
    try {
      const raw = fs.readFileSync(FILE_NAME, "utf8");
      if (!raw || raw.trim().length === 0) throw new Error("Empty file");
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Invalid structure");
      fs.copyFileSync(FILE_NAME, FILE_NAME + ".backup");
      console.log("Backup created.");
    } catch (e) {
      console.log("JSON corrupted or invalid — keeping existing backup.");
    }
  }
}

function createEntryKey(details) {
  const namePart = (details?.name || "noname")
    .toLowerCase()
    .replace(/\s+/g, "");
  const phonePart = (details?.phone || "nophone").replace(/\D/g, "");
  return `${namePart}-${phonePart}`;
}

async function extractDetails(page) {
  return await page.evaluate(() => {
    const getText = (sel) =>
      document.querySelector(sel)?.innerText?.trim() || null;
    const getHref = (sel) =>
      document.querySelector(sel)?.getAttribute("href") || null;

    return {
      name: getText(".DUwDvf"),
      website: getHref('a[data-item-id="authority"]'),
      phone: getText('button[data-item-id^="phone:tel:"]'),
    };
  });
}

function saveData(data) {
  if (!data || typeof data !== "object") {
    console.log("Invalid data \u2014 skipping save");
    return;
  }
  const tempFile = FILE_NAME + ".tmp";
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempFile, FILE_NAME);
  } catch (err) {
    console.log("Save failed:", err.message);
  }
}

function isMemoryHigh() {
  const rss = process.memoryUsage().rss;
  return rss > MEMORY_LIMIT_BYTES;
}

function getMemoryMB() {
  return Math.round(process.memoryUsage().rss / 1024 / 1024);
}

function isNetworkError(err) {
  const msg = err?.message || "";
  return (
    msg.includes("ERR_INTERNET_DISCONNECTED") ||
    msg.includes("ERR_NETWORK_CHANGED") ||
    msg.includes("ERR_NAME_NOT_RESOLVED") ||
    msg.includes("ERR_CONNECTION_RESET") ||
    msg.includes("ERR_TIMED_OUT") ||
    msg.includes("net::")
  );
}

async function checkConnectivity() {
  for (let attempt = 1; attempt <= CONNECTIVITY_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(CONNECTIVITY_CHECK_URL, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        console.log("  [NET] Connectivity OK.");
        return true;
      }
    } catch (e) {
      console.log(
        `  [NET] Connectivity check ${attempt}/${CONNECTIVITY_MAX_RETRIES} failed: ${e.message}`
      );
    }
    if (attempt < CONNECTIVITY_MAX_RETRIES) {
      console.log(
        `  [NET] Waiting ${CONNECTIVITY_RETRY_DELAY_MS / 1000}s before retry...`
      );
      await new Promise((r) => setTimeout(r, CONNECTIVITY_RETRY_DELAY_MS));
    }
  }
  console.log("  [NET] No connectivity after all retries.");
  return false;
}

function loadFailedQueries() {
  if (fs.existsSync(FAILED_QUERIES_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(FAILED_QUERIES_FILE, "utf8"));
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Loaded ${data.length} previously failed queries from ${FAILED_QUERIES_FILE}`);
        return data;
      }
    } catch (e) {
      console.log(`Failed to load ${FAILED_QUERIES_FILE}: ${e.message}`);
    }
  }
  return [];
}

function saveFailedQueries(queries) {
  try {
    const tempFile = FAILED_QUERIES_FILE + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(queries, null, 2), "utf8");
    fs.renameSync(tempFile, FAILED_QUERIES_FILE);
  } catch (e) {
    console.log(`Failed to save ${FAILED_QUERIES_FILE}: ${e.message}`);
  }
}

function clearFailedQueries() {
  try {
    if (fs.existsSync(FAILED_QUERIES_FILE)) fs.unlinkSync(FAILED_QUERIES_FILE);
  } catch (e) {}
}

async function launchNewBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
}

function getRandomUA(userAgents) {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const chunkArray = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

module.exports = {
  FILE_NAME,
  CONCURRENCY_LIMIT,
  CAPTCHA_PAUSE_MS,
  MIN_DELAY_MS,
  MAX_DELAY_MS,
  BROWSER_RELAUNCH_INTERVAL,
  MEMORY_LIMIT_BYTES,
  MAX_QUERY_RETRIES,
  RETRY_BASE_MS,
  NETWORK_ERROR_BATCH_THRESHOLD,
  NETWORK_PAUSE_MS,
  CONNECTIVITY_MAX_RETRIES,
  createBackup,
  createEntryKey,
  extractDetails,
  saveData,
  isMemoryHigh,
  getMemoryMB,
  isNetworkError,
  checkConnectivity,
  loadFailedQueries,
  saveFailedQueries,
  clearFailedQueries,
  launchNewBrowser,
  getRandomUA,
  chunkArray,
};

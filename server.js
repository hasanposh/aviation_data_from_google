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

if (fs.existsSync(FILE_NAME)) {
  try {
    fs.copyFileSync(FILE_NAME, FILE_NAME + ".backup");
    console.log("Backup created.");
  } catch (e) {
    console.log("Backup failed:", e.message);
  }
}

const AIRPORTS = [
  {"name": "Albuquerque International Sunport", "code": "ABQ"},
  {"name": "Lea County Regional Airport", "code": "HOB"},
  {"name": "Roswell Air Center", "code": "ROW"},
  {"name": "Santa Fe Municipal Airport", "code": "SAF"},
  {"name": "Cavern City Air Terminal", "code": "CNM"},
  {"name": "Clovis Regional Airport", "code": "CVN"},
  {"name": "Grant County Airport", "code": "SVC"},
  {"name": "Double Eagle II Airport", "code": "AEG"},
  {"name": "Alamogordo-White Sands Regional Airport", "code": "ALM"},
  {"name": "Angel Fire Airport", "code": "AXX"},
  {"name": "Artesia Municipal Airport", "code": "ATS"},
  {"name": "Aztec Municipal Airport", "code": "N19"},
  {"name": "Belen Regional Airport", "code": "BRG"},
  {"name": "Carrizozo Municipal Airport", "code": "F37"},
  {"name": "Clayton Municipal Airpark", "code": "CAO"},
  {"name": "Conchas Lake Airport", "code": "E89"},
  {"name": "Crownpoint Airport", "code": "0E8"},
  {"name": "Deming Municipal Airport", "code": "DMN"},
  {"name": "Jicarilla Apache Nation Airport", "code": "24N"},
  {"name": "Ohkay Owingeh Airport", "code": "E14"},
  {"name": "Four Corners Regional Airport", "code": "FMN"},
  {"name": "Fort Sumner Municipal Airport", "code": "FSU"},
  {"name": "Gallup Municipal Airport", "code": "GUP"},
  {"name": "Glenwood Airport", "code": "E94"},
  {"name": "Grants-Milan Municipal Airport", "code": "GNT"},
  {"name": "Hatch Municipal Airport", "code": "E05"},
  {"name": "Lea County-Jal Airport", "code": "E26"},
  {"name": "Las Cruces International Airport", "code": "LRU"},
  {"name": "Las Vegas Municipal Airport", "code": "LVS"},
  {"name": "Lordsburg Municipal Airport", "code": "LSB"},
  {"name": "Los Alamos County Airport", "code": "LAM"},
  {"name": "Lea County-Zip Franklin Memorial Airport", "code": "E06"},
  {"name": "Magdalena Airport", "code": "N29"},
  {"name": "Moriarty Municipal Airport", "code": "0E0"},
  {"name": "Navajo Lake Airport", "code": "1V0"},
  {"name": "Portales Municipal Airport", "code": "PRZ"},
  {"name": "Questa Municipal Nr 2 Airport", "code": "N24"},
  {"name": "Raton Municipal Airport (Crews Field)", "code": "RTN"},
  {"name": "Reserve Airport", "code": "T16"},
  {"name": "Sierra Blanca Regional Airport", "code": "SRR"},
  {"name": "Santa Rosa Route 66 Airport", "code": "SXU"},
  {"name": "Doña Ana County International Jetport", "code": "DNA"},
  {"name": "Shiprock Airstrip", "code": "5V5"},
  {"name": "Socorro Municipal Airport", "code": "ONM"},
  {"name": "Springer Municipal Airport", "code": "S42"},
  {"name": "Taos Regional Airport", "code": "SKX"},
  {"name": "Truth or Consequences Municipal Airport", "code": "TCS"},
  {"name": "Tucumcari Municipal Airport", "code": "TCC"},
  {"name": "Vaughn Municipal Airport", "code": "N17"},
  {"name": "Andrew Othole Memorial Airport", "code": "XNI"},
  {"name": "Jewett Mesa Airport", "code": "13Q"},
  {"name": "Conchas Lake Seaplane Base", "code": "E61"},
  {"name": "Sandia Airpark Estates East Airport", "code": "1N1"},
  {"name": "Estancia Municipal Airport", "code": "E92"},
  {"name": "Lindrith Airpark", "code": "E32"},
  {"name": "Mid Valley Airpark", "code": "E98"},
  {"name": "Mountainair Municipal Airport", "code": "M10"},
  {"name": "Whiskey Creek Airport", "code": "94E"},
  {"name": "Tatum Airport", "code": "18T"},
  {"name": "Holloman Air Force Base", "code": "HMN"},
  {"name": "Cannon Air Force Base", "code": "CVS"},
  {"name": "Stallion Army Airfield", "code": "95E"},
  {"name": "Condron Army Airfield", "code": "WSD"},
  {"name": "Columbus Municipal Airport", "code": "0NM0"},
  {"name": "Industrial Airpark", "code": "NM83"},
  {"name": "Spaceport America", "code": "90NM"}
]
const KEYWORDS = [
  // =============================================
  // 1. CORE OPERATORS (Fleet Owners & Charter)
  // =============================================
  "air charter New Mexico",
  "private jet charter New Mexico",
  "executive aviation New Mexico",
  "corporate aviation New Mexico",
  "Part 135 operator New Mexico",
  "air taxi New Mexico",
  "air ambulance New Mexico",
  "medevac New Mexico",
  "cargo airline New Mexico",
  "air freight New Mexico",
  "aircraft management New Mexico",
  "company aircraft New Mexico",
  "on-demand charter New Mexico",

  // Specific Part 135 Operators in New Mexico [3†L4-L52]
  "CSI Aviation Albuquerque", // Worldwide aviation services, Part 135 air carrier since 1979 [3†L4-L8][5†L37-L41]
  "Vertical Limit Aviation Albuquerque", // Part 135 operator, 2 aircraft [3†L9-L13]
  "Ed's Flying Service Alamogordo", // Part 135 operator, 1 aircraft [3†L14-L18]
  "K & D Aviation Clovis", // Part 135 operator, 1 aircraft [3†L19-L23]
  "Blue Sky Enterprises Las Cruces", // Part 135 operator, 2 aircraft [3†L24-L28]
  "South Aero Inc Albuquerque", // Part 135 operator, 14 aircraft [3†L44-L48]
  "Critical Air Response Enterprises Albuquerque", // Part 135 operator, 5 aircraft [3†L38-L43]
  "Aero Charter and Transport Inc", // Part 135 operator [3†L30-L31]
  "Biotech Aviation Rio Rancho", // Part 135 operator, 1 aircraft [3†L33-L37]
  "Corvus LLC Texico", // Part 135 operator, 2 aircraft [3†L49-L52]
  "IlluminaiRe Charter LLC Albuquerque", // Part 135 operator [3†L31-L32]
  "Mountain Aviation Enterprises Albuquerque", // Nonscheduled air transportation since 2008 [5†L23-L27]

  // =============================================
  // 2. MAINTENANCE / MRO (Direct Parts Buyers)
  // =============================================
  "aircraft maintenance New Mexico",
  "aircraft repair station New Mexico",
  "MRO New Mexico",
  "Part 145 repair station New Mexico", // 26 FAA-certificated repair stations in NM [1†L32-L33]
  "FAA certified repair station New Mexico",
  "jet engine overhaul New Mexico",
  "turbine engine repair New Mexico",
  "avionics repair New Mexico",
  "helicopter maintenance New Mexico",
  "airframe maintenance New Mexico",
  "composite repair New Mexico",
  "aircraft painting New Mexico",
  "aircraft interiors New Mexico",
  "propeller repair New Mexico",
  "AOG support New Mexico",
  "line maintenance New Mexico",

  // Specific New Mexico MROs & Repair Stations [1†L4-L54]
  "Roswell Air Center MRO", // Multiple MRO operations, commercial service center [1†L4-L9]
  "Ascent Aviation Services New Mexico", // Major global MRO, 3 facilities in AZ/NM [1†L16-L20]
  "Aero Mechanical Industries Rio Rancho", // Composite & mechanical airframe components MRO, 51-200 employees [1†L21-L24]
  "Bode Aviation Albuquerque", // Veteran-owned, Part 145 repair station [1†L51-L54]
  "10 Tanker Air Carrier LLC Albuquerque", // FAA Part 145 repair station [1†L35-L36]
  "New Mexico Aero Service Moriarty", // Annual/progressive inspections, dynamic prop balancing, Twin Cessna/Beechcraft [1†L25-L30]
  "Mesilla Valley Aircraft Owners Las Cruces", // Full-service MRO, 30+ years experience [1†L37-L43]
  "Cutter Aviation Albuquerque", // Corporate/GA FBO and MRO since 1928 [5†L47-L51]
  "Francis Aviation Las Cruces", // FBO and maintenance services [2†L12-L17]
  "Southwest Aviation", // FBO with 50 years of service in Las Cruces [5†L7-L10]

  // =============================================
  // 3. KEY AIRPORT-BASED TARGETING
  // =============================================
  // Albuquerque International Sunport (ABQ) - Primary Hub [0†L11-L12][0†L25-L26]
  "ABQ FBO",
  "Albuquerque International Sunport FBO",
  "KABQ aviation services",
  "Cutter Aviation Albuquerque", // Corporate/GA gateway FBO since 1928 [5†L47-L51]

  // Santa Fe Regional (SAF) - Secondary Hub [2†L24-L28][2†L39-L44]
  "Santa Fe Regional FBO",
  "Atlantic Aviation Santa Fe", // Acquired Jet Center at Santa Fe, ~50,000 sq ft [2†L24-L30]
  "Jet Center at Santa Fe", // Full-service FBO [2†L4-L7][2†L19-L23]
  "KSAF FBO",

  // Las Cruces International (LRU) - Southern Hub [1†L37-L43]
  "Las Cruces International FBO",
  "Francis Aviation Las Cruces", // Full-service FBO [2†L12-L17]
  "Mesilla Valley Aircraft Owners Las Cruces", // Full-service MRO [1†L37-L43]
  "KLRU FBO",

  // Roswell Air Center (ROW) - MRO Hub [1†L4-L9]
  "Roswell Air Center FBO",
  "KROW aviation services",
  "Roswell MRO", // Multiple MRO operations [1†L4-L9]

  // Farmington / Four Corners (FMN) - Northwestern Hub
  "Four Corners Regional FBO",
  "Atlantic Aviation Farmington", // FBO at KFMN [2†L31-L34]
  "KFMN FBO",

  // Other Key Airports
  "Hobbs Lea County FBO", // KHOB - Primary commercial [0†L26]
  "Alamogordo-White Sands Regional FBO", // KALM - Primary commercial [0†L15]
  "Clovis Municipal FBO", // KCVN - Primary commercial [3†L19-L23]
  "Grants-Milan Municipal FBO", // KGNT - G.M. Aviation FBO [2†L8-L11]
  "Deming Municipal FBO", // KDMN - Desert Aviation FBO [2†L35-L38]
  "Moriarty Municipal FBO", // 0E0 - New Mexico Aero Service [0†L33-L34][1†L25-L30]
  "Santa Teresa Airport FBO", // 5T6 - Francis Aviation location [2†L15-L17]
  "Sandia Airpark Estates East FBO", // 1N1 - Sandia Airpark [2†L45-L48]
  "Carrizozo Air Center FBO", // F37 [2†L49]
  "Crownpoint Airport FBO", // 0E8 [0†L34]
  "Questa Municipal Nr 2 FBO", // N24 [0†L6]
  "Jicarilla Apache Nation Airport FBO", // 24N - Dulce [0†L7]

  // =============================================
  // 4. FBOs & GROUND SERVICES
  // =============================================
  "FBO New Mexico",
  "fixed base operator New Mexico",
  "aircraft fueling New Mexico",
  "jet fuel New Mexico",
  "Avgas New Mexico",
  "hangar rental New Mexico",
  "hangar storage New Mexico",
  "tie-down rental New Mexico",
  "ground handling New Mexico",
  "aircraft parking New Mexico",
  "executive terminal New Mexico",
  "deicing services New Mexico",
  "aircraft detailing New Mexico",
  "Atlantic Aviation New Mexico", // FBO network in NM [2†L24-L30][2†L31-L34]
  "Cutter Aviation New Mexico", // FBO since 1928 [5†L47-L51]
  "Francis Aviation New Mexico", // FBO in Las Cruces and Santa Teresa [2†L12-L17]

  // =============================================
  // 5. HELICOPTER OPERATORS
  // =============================================
  "helicopter tours New Mexico",
  "helicopter charter New Mexico",
  "helicopter maintenance New Mexico",
  "helicopter operator New Mexico",
  "Bell helicopter New Mexico",
  "Robinson helicopter New Mexico",
  "Airbus helicopter New Mexico",
  "helicopter EMS New Mexico",
  "helicopter utility New Mexico", // Utility operations common in remote areas

  // =============================================
  // 6. SPECIAL OPERATIONS
  // =============================================
  "aerial surveying New Mexico",
  "aerial photography New Mexico",
  "aerial mapping New Mexico",
  "search and rescue aviation New Mexico",
  "law enforcement aviation New Mexico",
  "aerial firefighting New Mexico",
  "aerial application New Mexico",
  "agricultural aviation New Mexico",
  "aerial tours New Mexico",
  "Spaceport America aviation", // Commercial spaceport [4†L8]

  // =============================================
  // 7. FLIGHT SCHOOLS & INSTRUCTION
  // =============================================
  "flight school New Mexico",
  "pilot training New Mexico",
  "Part 141 flight school New Mexico",
  "helicopter flight training New Mexico",
  "commercial pilot training New Mexico",
  "aviation college New Mexico",
  "flight instruction New Mexico",

  // =============================================
  // 8. AIRCRAFT TYPE SPECIFIC
  // =============================================
  "King Air operator New Mexico", // Advanced Air operates King Air between Las Cruces and ABQ [5†L5-L6]
  "Citation operator New Mexico",
  "Phenom operator New Mexico",
  "Caravan operator New Mexico",
  "Gulfstream operator New Mexico",
  "Challenger operator New Mexico",
  "Cirrus operator New Mexico",
  "Cessna operator New Mexico",
  "Piper operator New Mexico",
  "Twin Cessna maintenance New Mexico", // New Mexico Aero Service specializes in Twin Cessna [1†L28-L30]
  "Beechcraft Bonanza maintenance New Mexico", // New Mexico Aero Service specializes in Bonanza [1†L29-L30]

  // =============================================
  // 9. CITY-SPECIFIC TARGETING
  // =============================================
  "aviation Albuquerque",
  "aviation Santa Fe",
  "aviation Las Cruces",
  "aviation Roswell",
  "aviation Farmington",
  "aviation Hobbs",
  "aviation Alamogordo",
  "aviation Clovis",
  "aviation Carlsbad",
  "aviation Gallup",
  "aviation Taos",
  "aviation Silver City",
  "aviation Deming",
  "aviation Grants",
  "aviation Moriarty",
  "aviation Rio Rancho", // Aero Mechanical Industries, Biotech Aviation [1†L21-L24][3†L33-L37]
  "aviation Santa Teresa", // Francis Aviation [2†L15-L17]
  "aviation Texico", // Corvus LLC [3†L49-L52]

  // =============================================
  // 10. MILITARY & GOVERNMENT AVIATION
  // =============================================
  "military aviation contractor New Mexico",
  "defense aerospace New Mexico",
  "New Mexico Air National Guard",
  "150th Special Operations Wing Kirtland AFB", // NM ANG unit [6†L36-L38]
  "188th Rescue Squadron Kirtland AFB", // NM ANG rescue squadron [6†L22-L25]
  "512th Rescue Squadron Kirtland AFB", // NM ANG rescue squadron [6†L22-L25]
  "Kirtland Air Force Base", // Major AFB in Albuquerque [4†L8]
  "Kirtland AFB maintenance",
  "Holloman Air Force Base", // Alamogordo [0†L15]
  "Holloman AFB maintenance",
  "Cannon Air Force Base", // Clovis
  "Cannon AFB contractor",
  "White Sands Missile Range aviation",
  "Sandia National Laboratories aviation", // Aerospace/defense research [4†L8]
  "police aviation unit New Mexico",
  "sheriff aviation New Mexico",
  "state police aviation New Mexico",
  "New Mexico Department of Transportation Aviation",

  // =============================================
  // 11. AEROSPACE MANUFACTURING & SUPPLIERS
  // =============================================
  "aerospace manufacturer New Mexico",
  "aviation parts supplier New Mexico",
  "aircraft component supplier New Mexico",
  "OEM support New Mexico",
  "composite manufacturing aviation New Mexico",
  "machining aerospace New Mexico",
  "aviation electronics manufacturer",
  "defense contractor aerospace New Mexico",
  "BlackVe Inc Albuquerque", // Satellite manufacturer, expanding with state backing [4†L4-L10]
  "Castelion Corp Sandoval County", // Hypersonic missile manufacturing [4†L14-L16]
  "AeroVironment Albuquerque", // Defense manufacturing, 400+ employees, $30M+ expansion [4†L35-L41]
  "Eclipse Aerospace Albuquerque", // Aerospace company since 2009 [5†L11-L14]
  "Century Aerospace Corporation Albuquerque", // Produces the Century Jet [5†L14-L16]
  "AIRO Group Albuquerque", // Aerospace company since 2019 [5†L17-L22]
  "Spaceport America", // Commercial spaceport infrastructure [4†L8]
];

const chunkArray = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

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

async function launchNewBrowser(userAgents) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  return browser;
}

function getRandomUA(userAgents) {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

let capturedData = null;

process.on("uncaughtException", (err) => {
  console.error(`\n[CRASH] Uncaught Exception: ${err.message}`);
  if (capturedData) {
    console.log("Saving data before exit...");
    saveData(capturedData);
  }
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(`\n[CRASH] Unhandled Rejection: ${err?.message || err}`);
  if (capturedData) {
    console.log("Saving data before exit...");
    saveData(capturedData);
  }
});

process.on("exit", () => {
  if (capturedData) {
    saveData(capturedData);
  }
});

process.on("SIGINT", () => {
  console.log("\n[INTERRUPT] Saving data before exit...");
  if (capturedData) saveData(capturedData);
  process.exit(0);
});

async function scrapeGoogleMaps() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
  ];

  let browser = await launchNewBrowser(userAgents);
  let totalQueriesSinceRelaunch = 0;
  let totalQueriesRun = 0;
  let totalFound = 0;
  const failedQueries = [];

  let allData = {};
  const seenEntries = new Set();

  if (fs.existsSync(FILE_NAME)) {
    console.log("Loading progress...");
    try {
      const rawData = fs.readFileSync(FILE_NAME, "utf8");
      if (!rawData || rawData.trim().length === 0)
        throw new Error("Empty file");

      const parsed = JSON.parse(rawData);
      if (typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Invalid structure");

      allData = parsed;

      for (const air in allData) {
        for (const keyw in allData[air]) {
          (allData[air][keyw] || []).forEach((e) => {
            if (e) seenEntries.add(createEntryKey(e));
          });
        }
      }
      console.log(`Resuming: ${seenEntries.size} unique leads already found.`);
    } catch (err) {
      console.error("\u274C Main file corrupted. Trying backup...");
      try {
        const backupRaw = fs.readFileSync(FILE_NAME + ".backup", "utf8");
        allData = JSON.parse(backupRaw);
        for (const air in allData) {
          for (const keyw in allData[air]) {
            (allData[air][keyw] || []).forEach((e) => {
              if (e) seenEntries.add(createEntryKey(e));
            });
          }
        }
        console.log("\u2705 Recovery successful from backup.");
      } catch {
        console.log("\u274C No valid backup. Starting fresh.");
        allData = {};
      }
    }
  }

  capturedData = allData;

  const allQueries = [];
  for (const airport of AIRPORTS) {
    if (!allData[airport.name]) allData[airport.name] = {};
    for (const keyword of KEYWORDS) {
      if (!allData[airport.name][keyword]) {
        allQueries.push({ airport: airport.name, keyword });
      }
    }
  }

  const prevFailed = loadFailedQueries();
  for (const fq of prevFailed) {
    if (!allData[fq.airport]?.[fq.keyword]) {
      allQueries.push(fq);
    }
  }

  console.log(`\nFound ${allQueries.length} pending search queries.`);

  console.log("Checking network connectivity...");
  if (!(await checkConnectivity())) {
    console.log("No network. Saving progress and exiting.");
    saveData(allData);
    process.exit(1);
  }

  const queryChunks = chunkArray(allQueries, CONCURRENCY_LIMIT);
  const totalChunks = queryChunks.length;

  for (let ci = 0; ci < totalChunks; ci++) {
    const chunk = queryChunks[ci];
    console.log(
      `\n--- Batch ${ci + 1}/${totalChunks} (${chunk.length} queries) [Mem: ${getMemoryMB()}MB] ---`
    );

    let captchaHitThisBatch = false;
    let networkErrorsThisBatch = 0;

    await Promise.all(
      chunk.map(async ({ airport, keyword }) => {
        let lastErr = null;

        for (let attempt = 1; attempt <= MAX_QUERY_RETRIES; attempt++) {
          let context;
          let page;

          try {
            context = await browser.newContext({
              userAgent: getRandomUA(userAgents),
              viewport: { width: 1366, height: 768 },
            });
            page = await context.newPage();

            await page.route("**/*", (route) => {
              const resourceType = route.request().resourceType();
              if (
                ["image", "stylesheet", "font", "media"].includes(resourceType)
              ) {
                route.abort();
              } else {
                route.continue();
              }
            });

            const fullQuery = `${keyword} ${airport}`;
            const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullQuery)}?hl=en`;

            if (attempt === 1) {
              console.log(`  [SEARCH] ${fullQuery}`);
            } else {
              console.log(`  [RETRY ${attempt}/${MAX_QUERY_RETRIES}] ${fullQuery}`);
            }

            await page.goto(searchUrl, {
              waitUntil: "networkidle",
              timeout: 30000,
            });
            await page.waitForTimeout(2000 + Math.random() * 1000);

            const found = await page
              .waitForSelector(
                '.qBF1Pd, .DUwDvf, iframe[src*="recaptcha"]',
                { timeout: 20000 }
              )
              .catch(() => null);

            if (await page.$('iframe[src*="recaptcha"]')) {
              console.log(`  !!! CAPTCHA on ${fullQuery} — skipping !!!`);
              captchaHitThisBatch = true;
              allData[airport][keyword] = [];
              lastErr = null;
              break;
            }

            if (!found) {
              console.log(`  No results: ${fullQuery}`);
              allData[airport][keyword] = [];
              lastErr = null;
              break;
            }

            const results = [];
            const isSingle = await page.$(".DUwDvf");

            if (isSingle) {
              const details = await extractDetails(page);
              const entryKey = createEntryKey(details);
              if (!seenEntries.has(entryKey)) {
                seenEntries.add(entryKey);
                results.push(details);
              }
            } else {
              const resultSelectors = ".hfpxzc";

              await page.evaluate(() => {
                const menu = document.querySelector('[role="feed"]');
                if (menu) menu.scrollBy(0, 1500);
              });
              await page.waitForTimeout(1500);

              const listings = await page.$$(resultSelectors);
              const limit = Math.min(listings.length, 10);

              for (let j = 0; j < limit; j++) {
                try {
                  const items = await page.$$(resultSelectors);
                  await items[j].click();
                  await page.waitForSelector(".DUwDvf", { timeout: 5000 });

                  const details = await extractDetails(page);
                  const entryKey = createEntryKey(details);

                  if (!seenEntries.has(entryKey)) {
                    seenEntries.add(entryKey);
                    results.push(details);
                  }
                } catch (e) {
                  // Ignore timeouts on bad cards
                }
              }
            }

            allData[airport][keyword] = results;
            totalFound += results.length;
            console.log(
              `  [DONE] ${fullQuery}: ${results.length} leads`
            );
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            const fullQuery = `${keyword} ${airport}`;
            console.error(
              `  [ERROR] ${fullQuery} (attempt ${attempt}/${MAX_QUERY_RETRIES}): ${err.message}`
            );

            if (isNetworkError(err)) {
              networkErrorsThisBatch++;
            }

            if (page) {
              await page.goto("about:blank").catch(() => {});
              await page.close().catch(() => {});
            }
            if (context) {
              await context.close().catch(() => {});
            }

            if (attempt < MAX_QUERY_RETRIES) {
              const backoffMs = RETRY_BASE_MS * Math.pow(3, attempt - 1) + Math.random() * 2000;
              console.log(`  Waiting ${Math.round(backoffMs / 1000)}s before retry...`);
              await new Promise((r) => setTimeout(r, backoffMs));
            }
          } finally {
            if (page) {
              await page.goto("about:blank").catch(() => {});
              await page.close().catch(() => {});
            }
            if (context) {
              await context.close().catch(() => {});
            }
          }
        }

        if (lastErr) {
          const fullQuery = `${keyword} ${airport}`;
          console.error(`  [FAILED] ${fullQuery}: all ${MAX_QUERY_RETRIES} attempts exhausted`);
          failedQueries.push({ airport, keyword });
          allData[airport][keyword] = allData[airport][keyword] || [];
        }
      })
    );

    totalQueriesRun += chunk.length;
    totalQueriesSinceRelaunch += chunk.length;

    saveData(allData);

    if (networkErrorsThisBatch >= NETWORK_ERROR_BATCH_THRESHOLD) {
      console.log(
        `  [NET] ${networkErrorsThisBatch} network errors this batch — pausing ${NETWORK_PAUSE_MS / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, NETWORK_PAUSE_MS));

      console.log("  [NET] Checking connectivity after pause...");
      if (!(await checkConnectivity())) {
        console.log("  [NET] Still offline. Saving and exiting.");
        saveData(allData);
        process.exit(1);
      }

      console.log("  Relaunching browser after network issues...");
      await browser.close().catch(() => {});
      browser = await launchNewBrowser(userAgents);
      totalQueriesSinceRelaunch = 0;
    } else if (captchaHitThisBatch) {
      const pauseMs = CAPTCHA_PAUSE_MS + Math.random() * 30000;
      console.log(
        `  CAPTCHA pause: ${Math.round(pauseMs / 1000)}s before next batch...`
      );
      await new Promise((r) => setTimeout(r, pauseMs));

      console.log("  Relaunching browser after CAPTCHA...");
      await browser.close().catch(() => {});
      browser = await launchNewBrowser(userAgents);
      totalQueriesSinceRelaunch = 0;
    } else if (
      totalQueriesSinceRelaunch >= BROWSER_RELAUNCH_INTERVAL ||
      isMemoryHigh()
    ) {
      const reason =
        totalQueriesSinceRelaunch >= BROWSER_RELAUNCH_INTERVAL
          ? "interval reached"
          : `memory high (${getMemoryMB()}MB)`;
      console.log(`  Relaunching browser (${reason})...`);
      await browser.close().catch(() => {});
      browser = await launchNewBrowser(userAgents);
      totalQueriesSinceRelaunch = 0;

      if (global.gc) global.gc();
    } else {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      await new Promise((r) => setTimeout(r, delay));
    }

    saveFailedQueries(failedQueries);
  }

  if (failedQueries.length > 0) {
    console.log(
      `\n--- Retrying ${failedQueries.length} failed queries with fresh browser ---`
    );
    await browser.close().catch(() => {});
    browser = await launchNewBrowser(userAgents);

    const retryChunks = chunkArray(failedQueries, CONCURRENCY_LIMIT);
    for (let ci = 0; ci < retryChunks.length; ci++) {
      const chunk = retryChunks[ci];
      console.log(
        `\n--- Retry Batch ${ci + 1}/${retryChunks.length} ---`
      );

      let retryNetworkErrors = 0;

      await Promise.all(
        chunk.map(async ({ airport, keyword }) => {
          let lastErr = null;

          for (let attempt = 1; attempt <= MAX_QUERY_RETRIES; attempt++) {
            let context;
            let page;

            try {
              context = await browser.newContext({
                userAgent: getRandomUA(userAgents),
                viewport: { width: 1366, height: 768 },
              });
              page = await context.newPage();

              await page.route("**/*", (route) => {
                const resourceType = route.request().resourceType();
                if (
                  ["image", "stylesheet", "font", "media"].includes(resourceType)
                ) {
                  route.abort();
                } else {
                  route.continue();
                }
              });

              const fullQuery = `${keyword} ${airport}`;
              const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullQuery)}?hl=en`;

              if (attempt === 1) {
                console.log(`  [RETRY] ${fullQuery}`);
              } else {
                console.log(`  [RETRY ${attempt}/${MAX_QUERY_RETRIES}] ${fullQuery}`);
              }

              await page.goto(searchUrl, {
                waitUntil: "networkidle",
                timeout: 30000,
              });
              await page.waitForTimeout(2000 + Math.random() * 1000);

              const found = await page
                .waitForSelector(
                  '.qBF1Pd, .DUwDvf, iframe[src*="recaptcha"]',
                  { timeout: 20000 }
                )
                .catch(() => null);

              if (await page.$('iframe[src*="recaptcha"]')) {
                console.log(`  !!! CAPTCHA on retry ${fullQuery} — skipping !!!`);
                allData[airport][keyword] = allData[airport][keyword] || [];
                lastErr = null;
                break;
              }

              if (!found) {
                allData[airport][keyword] = [];
                lastErr = null;
                break;
              }

              const results = [];
              const isSingle = await page.$(".DUwDvf");

              if (isSingle) {
                const details = await extractDetails(page);
                const entryKey = createEntryKey(details);
                if (!seenEntries.has(entryKey)) {
                  seenEntries.add(entryKey);
                  results.push(details);
                }
              } else {
                const resultSelectors = ".hfpxzc";

                await page.evaluate(() => {
                  const menu = document.querySelector('[role="feed"]');
                  if (menu) menu.scrollBy(0, 1500);
                });
                await page.waitForTimeout(1500);

                const listings = await page.$$(resultSelectors);
                const limit = Math.min(listings.length, 10);

                for (let j = 0; j < limit; j++) {
                  try {
                    const items = await page.$$(resultSelectors);
                    await items[j].click();
                    await page.waitForSelector(".DUwDvf", { timeout: 5000 });

                    const details = await extractDetails(page);
                    const entryKey = createEntryKey(details);

                    if (!seenEntries.has(entryKey)) {
                      seenEntries.add(entryKey);
                      results.push(details);
                    }
                  } catch (e) {}
                }
              }

              allData[airport][keyword] = results;
              totalFound += results.length;
              console.log(`  [RETRY DONE] ${fullQuery}: ${results.length} leads`);
              lastErr = null;
              break;
            } catch (err) {
              lastErr = err;
              const fullQuery = `${keyword} ${airport}`;
              console.error(
                `  [RETRY ERROR] ${fullQuery} (attempt ${attempt}/${MAX_QUERY_RETRIES}): ${err.message}`
              );

              if (isNetworkError(err)) {
                retryNetworkErrors++;
              }

              if (page) {
                await page.goto("about:blank").catch(() => {});
                await page.close().catch(() => {});
              }
              if (context) {
                await context.close().catch(() => {});
              }

              if (attempt < MAX_QUERY_RETRIES) {
                const backoffMs = RETRY_BASE_MS * Math.pow(3, attempt - 1) + Math.random() * 2000;
                console.log(`  Waiting ${Math.round(backoffMs / 1000)}s before retry...`);
                await new Promise((r) => setTimeout(r, backoffMs));
              }
            } finally {
              if (page) {
                await page.goto("about:blank").catch(() => {});
                await page.close().catch(() => {});
              }
              if (context) {
                await context.close().catch(() => {});
              }
            }
          }

          if (lastErr) {
            const fullQuery = `${keyword} ${airport}`;
            console.error(`  [RETRY FAILED] ${fullQuery}: all ${MAX_QUERY_RETRIES} attempts exhausted`);
            allData[airport][keyword] = allData[airport][keyword] || [];
          }
        })
      );

      saveData(allData);

      if (retryNetworkErrors >= NETWORK_ERROR_BATCH_THRESHOLD) {
        console.log(
          `  [NET] ${retryNetworkErrors} network errors in retry batch — pausing ${NETWORK_PAUSE_MS / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, NETWORK_PAUSE_MS));
        if (!(await checkConnectivity())) {
          console.log("  [NET] Still offline. Saving and exiting.");
          saveData(allData);
          process.exit(1);
        }
        await browser.close().catch(() => {});
        browser = await launchNewBrowser(userAgents);
      }

      await new Promise((r) => setTimeout(r, MIN_DELAY_MS + Math.random() * 5000));
    }

    clearFailedQueries();
  }

  capturedData = null;
  await browser.close().catch(() => {});
  console.log(
    `\n\u2705 Scraping complete! ${totalQueriesRun} queries run, ${totalFound} unique leads found.`
  );
}

scrapeGoogleMaps();

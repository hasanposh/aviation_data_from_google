const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const fs = require("fs");

chromium.use(stealth);

const FILE_NAME = "aviation_results.json";

// ===== BACKUP FILE BEFORE ANYTHING =====
if (fs.existsSync(FILE_NAME)) {
  try {
    fs.copyFileSync(FILE_NAME, FILE_NAME + ".backup");
    console.log("Backup created.");
  } catch (e) {
    console.log("Backup failed:", e.message);
  }
}

const AIRPORTS = [
  { name: "Apolo Airport", code: "APB" },
  { name: "Ascención de Guarayos Airport", code: "ASC" },
  { name: "Bermejo Airport", code: "BJO" },
  { name: "Camiri Airport", code: "CAM" },
  { name: "Charaña Airport", code: "" },
  { name: "Cap. Anibal Arab Airport", code: "CIJ" },
  { name: "Jorge Wilstermann International Airport", code: "CBB" },
  { name: "Concepción Airport", code: "CEP" },
  { name: "Copacabana Airport", code: "" },
  { name: "Guayaramerín Airport", code: "GYA" },
  { name: "El Alto International Airport", code: "LPB" },
  { name: "Magdalena Airport", code: "MGD" },
  { name: "Monteagudo Airport", code: "MHW" },
  { name: "Juan Mendoza Airport", code: "ORU" },
  { name: "Cap. Nicolas Rojas Airport", code: "POI" },
  { name: "Puerto Suárez International Airport", code: "PSZ" },
  { name: "Reyes Airport", code: "REY" },
  { name: "Riberalta Airport", code: "RIB" },
  { name: "Roboré Airport", code: "RBO" },
  { name: "Rurrenabaque Airport", code: "RBQ" },
  { name: "Cap. Av. Germán Quiroga Guardia Airport", code: "SRJ" },
  { name: "San Ignacio de Moxos Airport", code: "SNM" },
  { name: "Capitán Av. Juan Cochamanidis Airport", code: "SNG" },
  { name: "San Javier Airport", code: "SJV" },
  { name: "San Joaquín Airport", code: "SJB" },
  { name: "San José de Chiquitos Airport", code: "SJS" },
  { name: "San Matías Airport", code: "MQK" },
  { name: "San Ramón Airport", code: "SRD" },
  { name: "Santa Ana del Yacuma Airport", code: "SBL" },
  { name: "Viru Viru International Airport", code: "VVI" },
  { name: "El Trompillo Airport", code: "SRZ" },
  { name: "Juana Azurduy de Padilla International Airport", code: "SRE" },
  { name: "Alcantari Airport", code: "SRE" },
  { name: "Cap. Oriel Lea Plaza Airport", code: "TJA" },
  { name: "Tte. Av. Jorge Henrich Arauz Airport", code: "TDD" },
  { name: "Rosal Airport", code: "" },
  { name: "Samaipata Airport", code: "" },
  { name: "San Francisco Naciff Airport", code: "" },
  { name: "San Juan Airport", code: "" },
  { name: "San Lorenzo Airport", code: "" },
  { name: "San Miguel South Airport", code: "" },
  { name: "San Pedro Salvatierra Airport", code: "" },
  { name: "San Vicente Airport", code: "" },
  { name: "Santa Ana de Huachi Airport", code: "" },
  { name: "Santa Catalina Airport", code: "" },
  { name: "Santa Rita Airport", code: "" },
  { name: "Santa Rosa Airport", code: "SRB" },
  { name: "Santa Rosa del Sara Airport", code: "" },
  { name: "Santa Teresita Airport", code: "" },
  { name: "Santiago Airport", code: "" },
  { name: "Saahaqui Airport", code: "" },
  { name: "San Miguel de Gaser Airport", code: "" },
  { name: "Saipura Airport", code: "" },
  { name: "Sipuati Airport", code: "" },
  { name: "Taquipirenda Airport", code: "" },
  { name: "Teoponte Airport", code: "" },
  { name: "Tiboy Airport", code: "" },
  { name: "Tiguipa Airport", code: "" },
  { name: "Tupiza Airport", code: "" },
  { name: "Ulla Ulla Airport", code: "" },
  { name: "Uncía Airport", code: "" },
  { name: "Urusi Airport", code: "" },
  { name: "Joya Andina International Airport", code: "UYU" },
];

const KEYWORDS = [
  // CORE OPERATORS (EN)
  "air operator Bolivia",
  "AOC holder Bolivia",
  "charter operator Bolivia",
  "air charter Bolivia",
  "private jet operator Bolivia",
  "business aviation Bolivia",
  "helicopter operator Bolivia",
  "cargo airline Bolivia",
  "regional airline Bolivia",

  // CORE OPERATORS (SPANISH)
  "operador aereo Bolivia",
  "empresa de aviacion Bolivia",
  "linea aerea Bolivia",
  "aviacion ejecutiva Bolivia",
  "charter aereo Bolivia",
  "jet privado Bolivia",
  "helicopteros Bolivia empresa",
  "aviacion corporativa Bolivia",

  // MAINTENANCE / MRO
  "aircraft maintenance Bolivia",
  "MRO Bolivia",
  "aircraft repair station Bolivia",
  "Part 145 Bolivia",
  "aviation maintenance company Bolivia",
  "mantenimiento aeronaves Bolivia",
  "taller aeronautico Bolivia",
  "reparacion de aviones Bolivia",
  "centro MRO Bolivia",

  // GOVERNMENT / DEFENSE
  "Bolivian Air Force",
  "Fuerza Aerea Boliviana mantenimiento",
  "government aircraft Bolivia",
  "police aviation Bolivia",
  "helicopteros gobierno Bolivia",

  // MINING / ENERGY AVIATION (VERY IMPORTANT)
  "mining aviation Bolivia",
  "oil gas aviation Bolivia",
  "air logistics Bolivia mining",
  "remote aviation Bolivia",
  "jungle aviation Bolivia",

  // SPECIAL OPERATORS
  "air ambulance Bolivia",
  "ambulancia aerea Bolivia",
  "medevac Bolivia",
  "aviacion agricola Bolivia",
  "fumigacion aerea Bolivia",
  "aerial survey Bolivia",
  "aerial firefighting Bolivia",

  // TRAINING / SCHOOLS
  "flight school Bolivia",
  "aviation school Bolivia",
  "escuela de aviacion Bolivia",
  "pilot training Bolivia",

  // AIRPORT-BASED TARGETING
  "FBO Bolivia",
  "fixed base operator Bolivia",
  "FBO Santa Cruz Bolivia",
  "FBO La Paz Bolivia",
  "airport services Bolivia",
  "servicios aeroportuarios Bolivia",
  "hangar Bolivia aviation",

  // HELICOPTER NICHE
  "helicopter services Bolivia",
  "helicopter charter Bolivia",
  "servicio helicopteros Bolivia",
  "helicopteros privados Bolivia",

  // BUSINESS / FLEET OWNERS
  "corporate fleet Bolivia aviation",
  "empresas con aviones Bolivia",
  "aviacion empresarial Bolivia",
  "business jet Bolivia",

  // CARGO / INTERIOR AVIATION
  "air cargo Bolivia",
  "cargo aviation Bolivia",
  "amazon aviation Bolivia",
  "andes aviation Bolivia",
  "interior air service Bolivia",
];

async function scrapeGoogleMaps() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();
  let allData = {};
  const seenEntries = new Set();

  // ===== SAFE LOAD =====
  if (fs.existsSync(FILE_NAME)) {
    console.log("Loading progress...");
    try {
      const rawData = fs.readFileSync(FILE_NAME, "utf8");

      if (!rawData || rawData.trim().length === 0) {
        throw new Error("Empty file");
      }

      const parsed = JSON.parse(rawData);

      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid structure");
      }

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
      console.error("❌ Main file corrupted. Trying backup...");

      try {
        const backupRaw = fs.readFileSync(FILE_NAME + ".backup", "utf8");
        allData = JSON.parse(backupRaw);
        console.log("✅ Recovery successful from backup.");
      } catch {
        console.log("❌ No valid backup. Starting fresh.");
        allData = {};
      }
    }
  }

  for (const airport of AIRPORTS) {
    if (!allData[airport.name]) allData[airport.name] = {};

    for (const keyword of KEYWORDS) {
      if (allData[airport.name][keyword]) continue;

      const fullQuery = `${keyword} ${airport.name}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullQuery)}?hl=en`;

      console.log(`\n[SEARCHING]: ${fullQuery}`);
      let results = [];

      try {
        await page.goto("https://www.google.com/maps", {
          waitUntil: "domcontentloaded",
        });
        await page.waitForTimeout(1000 + Math.random() * 1000);
        await page.goto(searchUrl);

        const found = await page
          .waitForSelector('.qBF1Pd, .DUwDvf, iframe[src*="recaptcha"]', {
            timeout: 10000,
          })
          .catch(() => null);

        if (await page.$('iframe[src*="recaptcha"]')) {
          console.log("!!! CAPTCHA DETECTED !!! Solve it manually...");
          await page.waitForSelector(".qBF1Pd, .DUwDvf", { timeout: 600000 });
        }

        if (!found) {
          console.log("No results.");
          allData[airport.name][keyword] = [];
          saveData(allData);
          continue;
        }

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
            if (menu) menu.scrollBy(0, 800);
          });

          await page.waitForTimeout(1000);

          const listings = await page.$$(resultSelectors);
          const limit = Math.min(listings.length, 10);

          for (let i = 0; i < limit; i++) {
            try {
              const items = await page.$$(resultSelectors);
              await items[i].click();
              await page.waitForSelector(".DUwDvf", { timeout: 5000 });

              const details = await extractDetails(page);
              const entryKey = createEntryKey(details);

              if (!seenEntries.has(entryKey)) {
                seenEntries.add(entryKey);
                results.push(details);
                process.stdout.write(`+`);
              } else {
                process.stdout.write(`.`);
              }
            } catch {}
          }
        }

        allData[airport.name][keyword] = results;
        saveData(allData);

        console.log(`\nFinished: Found ${results.length} new leads.`);
      } catch (err) {
        console.error(`\nError: ${err.message}`);
      }

      await page.waitForTimeout(5000 + Math.random() * 5000);
    }
  }

  await browser.close();
}

// ===== SAFE SAVE =====
function saveData(data) {
  if (!data || typeof data !== "object") {
    console.log("❌ Invalid data — skipping save");
    return;
  }

  const tempFile = FILE_NAME + ".tmp";

  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");

    // Validate temp file before replacing
    JSON.parse(fs.readFileSync(tempFile, "utf8"));

    fs.renameSync(tempFile, FILE_NAME);
  } catch (err) {
    console.log("❌ Save failed, file not replaced:", err.message);
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

scrapeGoogleMaps();

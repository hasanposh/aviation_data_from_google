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



----------------------------

slow but correct 

const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const fs = require("fs");

chromium.use(stealth);

const FILE_NAME = "aviation_results.json";
const CONCURRENCY_LIMIT = 3;
const CAPTCHA_PAUSE_MS = 90000;
const MIN_DELAY_MS = 5000;
const MAX_DELAY_MS = 15000;
const BROWSER_RELAUNCH_INTERVAL = 200;
const MEMORY_LIMIT_BYTES = 500 * 1024 * 1024;

if (fs.existsSync(FILE_NAME)) {
  try {
    fs.copyFileSync(FILE_NAME, FILE_NAME + ".backup");
    console.log("Backup created.");
  } catch (e) {
    console.log("Backup failed:", e.message);
  }
}

const AIRPORTS = [
  {"name": "Bemidji Regional Airport", "code": "BJI"},
  {"name": "Brainerd Lakes Regional Airport", "code": "BRD"},
  {"name": "Duluth International Airport", "code": "DLH"},
  {"name": "Range Regional Airport", "code": "HIB"},
  {"name": "Minneapolis\u2013Saint Paul International Airport (Wold-Chamberlain Field)", "code": "MSP"},
  {"name": "Rochester International Airport", "code": "RST"},
  {"name": "St. Cloud Regional Airport", "code": "STC"},
  {"name": "Falls International Airport (Einarson Field)", "code": "INL"},
  {"name": "Thief River Falls Regional Airport", "code": "TVF"},
  {"name": "Anoka County\u2013Blaine Airport (Janes Field)", "code": "ANE"},
  {"name": "Crystal Airport", "code": "MIC"},
  {"name": "Flying Cloud Airport", "code": "FCM"},
  {"name": "Airlake Airport", "code": "LVN"},
  {"name": "St. Paul Downtown Airport (Holman Field)", "code": "STP"},
  {"name": "Lake Elmo Airport", "code": "21D"},
  {"name": "South St. Paul Municipal Airport (Richard E. Fleming Field)", "code": "SGS"},
  {"name": "Aitkin Municipal Airport (Steve Kurtz Field)", "code": "AIT"},
  {"name": "Albert Lea Municipal Airport", "code": "AEL"},
  {"name": "Chandler Field", "code": "AXN"},
  {"name": "Austin Municipal Airport", "code": "AUM"},
  {"name": "Baudette International Airport", "code": "BDE"},
  {"name": "Benson Municipal Airport (Veteran's Field)", "code": "BBB"},
  {"name": "Blue Earth Municipal Airport", "code": "SBU"},
  {"name": "Buffalo Municipal Airport", "code": "CFE"},
  {"name": "Houston County Airport (Caledonia\u2013Houston County Airport)", "code": "CHU"},
  {"name": "Cambridge Municipal Airport", "code": "CBG"},
  {"name": "Myers Field", "code": "CNB"},
  {"name": "Cloquet Carlton County Airport", "code": "COQ"},
  {"name": "Cook Municipal Airport", "code": "CQM"},
  {"name": "Crookston Municipal Airport (Kirkwood Field)", "code": "CKN"},
  {"name": "Detroit Lakes Airport (Wething Field)", "code": "DTL"},
  {"name": "Dodge Center Airport (Dodge Center Municipal)", "code": "TOB"},
  {"name": "Sky Harbor Airport", "code": "DYT"},
  {"name": "Elbow Lake Municipal \u2013 Pride of the Prairie Airport", "code": "Y63"},
  {"name": "Ely Municipal Airport", "code": "ELO"},
  {"name": "Eveleth\u2013Virginia Municipal Airport", "code": "EVM"},
  {"name": "Fairmont Municipal Airport", "code": "FRM"},
  {"name": "Faribault Municipal Airport (Liz Wall Strohfus Field)", "code": "FBL"},
  {"name": "Fergus Falls Municipal Airport (Einar Mickelson Field)", "code": "FFM"},
  {"name": "Fosston Municipal Airport (Anderson Field)", "code": "FSE"},
  {"name": "Glencoe Municipal Airport (Vernon Perschau Field)", "code": "GYL"},
  {"name": "Glenwood Municipal Airport", "code": "GHW"},
  {"name": "Grand Marais/Cook County Airport", "code": "CKC"},
  {"name": "Grand Rapids/Itasca County Airport (Gordon Newstrom Field)", "code": "GPZ"},
  {"name": "Hallock Municipal Airport", "code": "HCO"},
  {"name": "Hawley Municipal Airport", "code": "04Y"},
  {"name": "Hector Municipal Airport", "code": "1D6"},
  {"name": "Hutchinson Municipal Airport (Butler Field)", "code": "HCD"},
  {"name": "Jackson Municipal Airport", "code": "MJQ"},
  {"name": "Le Sueur Municipal Airport", "code": "12Y"},
  {"name": "Litchfield Municipal Airport", "code": "LJF"},
  {"name": "Little Falls/Morrison County Airport (Lindbergh Field)", "code": "LXL"},
  {"name": "Todd Field", "code": "14Y"},
  {"name": "Longville Municipal Airport", "code": "XVG"},
  {"name": "Quentin Aanenson Field", "code": "LYV"},
  {"name": "Lac qui Parle County Airport", "code": "DXX"},
  {"name": "Mahnomen County Airport", "code": "3N8"},
  {"name": "Mankato Regional Airport", "code": "MKT"},
  {"name": "Southwest Minnesota Regional Marshall Airport (Ryan Field)", "code": "MML"},
  {"name": "Montevideo\u2013Chippewa County Airport", "code": "MVE"},
  {"name": "Moorhead Municipal Airport", "code": "JKJ"},
  {"name": "Moose Lake Carlton County Airport", "code": "MZH"},
  {"name": "Mora Municipal Airport", "code": "JMR"},
  {"name": "Morris Municipal Airport (Charlie Schmidt Field)", "code": "MOX"},
  {"name": "New Ulm Municipal Airport", "code": "ULM"},
  {"name": "Orr Regional Airport", "code": "ORB"},
  {"name": "Ortonville Municipal Airport (Martinson Field)", "code": "VVV"},
  {"name": "Owatonna Degner Regional Airport", "code": "OWA"},
  {"name": "Park Rapids Municipal Airport (Konshok Field)", "code": "PKD"},
  {"name": "Paynesville Municipal Airport", "code": "PEX"},
  {"name": "Pine River Regional Airport", "code": "PWC"},
  {"name": "Pipestone Municipal Airport", "code": "PQN"},
  {"name": "Fillmore County Airport", "code": "FKA"},
  {"name": "Princeton Municipal Airport", "code": "PNM"},
  {"name": "Red Wing Regional Airport", "code": "RGK"},
  {"name": "Redwood Falls Municipal Airport", "code": "RWF"},
  {"name": "Roseau Municipal Airport (Rudy Billberg Field)", "code": "ROX"},
  {"name": "Rush City Regional Airport", "code": "ROS"},
  {"name": "Rushford Municipal Airport (Robert W. Bunke Field)", "code": "55Y"},
  {"name": "St. James Municipal Airport", "code": "JYG"},
  {"name": "Sauk Centre Municipal Airport", "code": "D39"},
  {"name": "Silver Bay Municipal Airport", "code": "BFW"},
  {"name": "Springfield Municipal Airport", "code": "D42"},
  {"name": "Staples Municipal Airport", "code": "SAZ"},
  {"name": "Tower Municipal Airport", "code": "12D"},
  {"name": "Tracy Municipal Airport", "code": "TKC"},
  {"name": "Richard B. Helgeson Airport", "code": "TWM"},
  {"name": "Wadena Municipal Airport", "code": "ADC"},
  {"name": "Walker Municipal Airport", "code": "Y49"},
  {"name": "Warroad International Memorial Airport (Swede Carlson Field)", "code": "RRT"},
  {"name": "Waseca Municipal Airport", "code": "ACQ"},
  {"name": "Wheaton Municipal Airport", "code": "ETH"},
  {"name": "Willmar Municipal Airport (John L. Rice Field)", "code": "BDH"},
  {"name": "Windom Municipal Airport", "code": "MWM"},
  {"name": "Winona Municipal Airport (Max Conrad Field)", "code": "ONA"},
  {"name": "Winsted Municipal Airport", "code": "10D"},
  {"name": "Worthington Municipal Airport", "code": "OTG"},
  {"name": "Norman County Ada/Twin Valley Airport", "code": "D00"},
  {"name": "Appleton Municipal Airport", "code": "AQP"},
  {"name": "Backus Municipal Airport", "code": "7Y3"},
  {"name": "Bagley Municipal Airport", "code": "7Y4"},
  {"name": "Moberg Air Base (Seaplane Base)", "code": "96M"},
  {"name": "Big Falls Municipal Airport", "code": "7Y9"},
  {"name": "Bigfork Municipal Airport", "code": "FOZ"},
  {"name": "Bowstring Airport", "code": "9Y0"},
  {"name": "Brooten Municipal Airport (John O. Bohmer Field)", "code": "6D1"},
  {"name": "Clarissa Municipal Airport", "code": "8Y5"},
  {"name": "Leaders Clear Lake Airport", "code": "8Y6"},
  {"name": "Scotts Seaplane Base", "code": "CDD"},
  {"name": "Birch Lake Seaplane Base", "code": "M69"},
  {"name": "North Country Seaplane Base", "code": "SS1"},
  {"name": "East Gull Lake Airport", "code": "9Y2"},
  {"name": "Sky Harbor Seaplane Base", "code": "9Y5"},
  {"name": "Fertile Municipal Airport", "code": "D14"},
  {"name": "Forest Lake Airport", "code": "25D"},
  {"name": "Grand Marais/Cook County Seaplane Base", "code": "0G5"},
  {"name": "Granite Falls Municipal Airport (Lenzen-Roe-Fagan Memorial Field)", "code": "GDB"},
  {"name": "Grygla Municipal Airport (Mel Wilkens Field)", "code": "3G2"},
  {"name": "Henning Municipal Airport", "code": "05Y"},
  {"name": "Herman Municipal Airport", "code": "06Y"},
  {"name": "Hill City/Quadna Mountain Airport", "code": "07Y"},
  {"name": "Field of Dreams Airport", "code": "04W"},
  {"name": "International Falls Seaplane Base", "code": "09I"},
  {"name": "Wipline Seaplane Base", "code": "09Y"},
  {"name": "Karlstad Municipal Airport", "code": "23D"},
  {"name": "Surfside Seaplane Base", "code": "8Y4"},
  {"name": "Littlefork Municipal/Hanover Airport", "code": "13Y"},
  {"name": "Maple Lake Municipal Airport (Bill Mavencamp Sr. Field)", "code": "MGG"},
  {"name": "Isedor Iverson Airport", "code": "HZX"},
  {"name": "Milaca Municipal Airport (Milaca Airport)", "code": "18Y"},
  {"name": "Nary National Airport (Shefland Field)", "code": "5C3"},
  {"name": "Northome Municipal Airport", "code": "43Y"},
  {"name": "Olivia Regional Airport", "code": "OVL"},
  {"name": "Pelican Rapids Municipal Airport (Lyon's Field)", "code": "47Y"},
  {"name": "Perham Municipal Airport", "code": "16D"},
  {"name": "Piney Pinecreek Border Airport", "code": "48Y"},
  {"name": "Red Lake Falls Municipal Airport", "code": "D81"},
  {"name": "Remer Municipal Airport", "code": "52Y"},
  {"name": "Slayton Municipal Airport", "code": "DVP"},
  {"name": "Sleepy Eye Municipal Airport", "code": "Y58"},
  {"name": "Stanton Airfield", "code": "SYN"},
  {"name": "Starbuck Municipal Airport", "code": "D32"},
  {"name": "Stephen Municipal Airport", "code": "D41"},
  {"name": "Tyler Municipal Airport", "code": "63Y"},
  {"name": "Warren Municipal Airport", "code": "D37"},
  {"name": "Waskish Municipal Airport", "code": "VWU"},
  {"name": "Jolly Fisherman Seaplane Base", "code": "M49"},
  {"name": "Wells Municipal Airport", "code": "68Y"},
  {"name": "Ray S. Miller Army Airfield (National Guard)", "code": "RYM"},
  {"name": "Northwest Angle Airport", "code": "58MN"},
  {"name": "Isle Private Airport", "code": "MY72"},
  {"name": "Marty's Tranquility Base (Seaplane Base)", "code": "MN76"}
];
const KEYWORDS = [
  "air charter Minnesota",
  "private jet charter Minnesota",
  "executive aviation Minnesota",
  "corporate aviation Minnesota",
  "Part 135 operator Minnesota",
  "air taxi Minnesota",
  "air ambulance Minnesota",
  "medevac Minnesota",
  "cargo airline Minnesota",
  "air freight Minnesota",
  "aircraft management Minnesota",
  "company aircraft Minnesota",
  "on-demand charter Minnesota",

  "Aviation Charter Inc Eden Prairie",
  "Hummingbird Ventures LLC Eden Prairie",
  "North Central Aviation St. Paul",
  "Northern Air Transport Grand Rapids",
  "Thunderbird Aviation Minnesota",
  "Bemidji Aviation Services",
  "B 2 W Corporation Winona",
  "Weidendorf Investments Hinckley",

  "aircraft maintenance Minnesota",
  "aircraft repair station Minnesota",
  "MRO Minnesota",
  "Part 145 repair station Minnesota",
  "FAA certified repair station Minnesota",
  "jet engine overhaul Minnesota",
  "turbine engine repair Minnesota",
  "avionics repair Minnesota",
  "helicopter maintenance Minnesota",
  "airframe maintenance Minnesota",
  "composite repair Minnesota",
  "aircraft painting Minnesota",
  "aircraft interiors Minnesota",
  "propeller repair Minnesota",
  "AOG support Minnesota",
  "line maintenance Minnesota",

  "Premier Jet Center Minneapolis",
  "Premier Jet Center maintenance",
  "Premier Jet Center avionics",
  "Premier Jet Center interiors",
  "West Star Aviation Minneapolis",
  "Worthington Aviation Eagan",
  "Quality Aviation Faribault",
  "Up North Aero",
  "MSP Jet Center Minneapolis",
  "Twin City Aviation Minneapolis",

  "MSP FBO",
  "Minneapolis-St. Paul International FBO",
  "KMSP aviation services",
  "MSP Jet Center",

  "Flying Cloud Airport FBO",
  "KFCM FBO",
  "Premier Jet Center KFCM",
  "KFCM aircraft maintenance",
  "Inflight Pilot Training KFCM",
  "AV8 Flight School KFCM",

  "St. Paul Downtown Airport FBO",
  "KSTP FBO",
  "St. Paul Flight Center",

  "Anoka County-Blaine Airport FBO",
  "KANE FBO",
  "Cirrus Flight Operations Blaine",

  "Fargo Jet Center KFAR",

  "Duluth International Airport FBO",
  "Bemidji Regional Airport FBO",
  "Brainerd Lakes Regional Airport FBO",
  "Rochester International Airport FBO",
  "St. Cloud Regional Airport FBO",
  "Mankato Regional Airport FBO",
  "Thief River Falls Regional Airport FBO",
  "Grand Rapids Airport FBO",
  "Eden Prairie Airport aviation",
  "Winona Municipal Airport aviation",
  "Hinckley Airport aviation",

  "FBO Minnesota",
  "fixed base operator Minnesota",
  "aircraft fueling Minnesota",
  "jet fuel Minnesota",
  "Avfuel Minnesota",
  "hangar rental Minnesota",
  "hangar storage Minnesota",
  "tie-down rental Minnesota",
  "ground handling Minnesota",
  "aircraft parking Minnesota",
  "executive terminal Minnesota",
  "deicing services Minnesota",
  "aircraft detailing Minnesota",
  "Cirrus Flight Operations FBO",
  "Lynx FBO Network Minnesota",

  "helicopter tours Minnesota",
  "helicopter charter Minnesota",
  "helicopter maintenance Minnesota",
  "helicopter operator Minnesota",
  "Bell helicopter Minnesota",
  "Robinson helicopter Minnesota",
  "Airbus helicopter Minnesota",
  "helicopter EMS Minnesota",
  "AV8 Flight School helicopter",
  "Quality Aviation helicopter",

  "aerial surveying Minnesota",
  "aerial photography Minnesota",
  "aerial mapping Minnesota",
  "search and rescue aviation Minnesota",
  "law enforcement aviation Minnesota",
  "aerial firefighting Minnesota",
  "aerial application Minnesota",
  "agricultural aviation Minnesota",
  "aerial camera packages Minnesota",

  "flight school Minnesota",
  "pilot training Minnesota",
  "Part 141 flight school Minnesota",
  "helicopter flight training Minnesota",
  "commercial pilot training Minnesota",
  "aviation college Minnesota",
  "Inflight Pilot Training",
  "AV8 Flight School",
  "Thunderbird Aviation flight school",

  "King Air operator Minnesota",
  "Citation operator Minnesota",
  "Phenom operator Minnesota",
  "Caravan operator Minnesota",
  "Gulfstream operator Minnesota",
  "Challenger operator Minnesota",
  "Cirrus operator Minnesota",
  "Pilatus operator Minnesota",
  "Kodiak operator Minnesota",
  "Cessna operator Minnesota",
  "Piper operator Minnesota",
  "Bemidji Aviation fleet",
  "small aircraft parts Minnesota",
  "corporate jet parts Minnesota",

  "aviation Minneapolis",
  "aviation St. Paul",
  "aviation Duluth",
  "aviation Rochester",
  "aviation Bloomington",
  "aviation Eden Prairie",
  "aviation Blaine",
  "aviation St. Cloud",
  "aviation Mankato",
  "aviation Bemidji",
  "aviation Brainerd",
  "aviation Grand Rapids",
  "aviation Winona",
  "aviation Hinckley",
  "aviation Faribault",
  "aviation Eagan",
  "aviation Fergus Falls",
  "aviation Thief River Falls",

  "military aviation contractor Minnesota",
  "defense aerospace Minnesota",
  "Minnesota Air National Guard",
  "Minneapolis-St. Paul Air Reserve Station",
  "Duluth Air National Guard Base",
  "Camp Ripley aviation",
  "Minnesota Army National Guard aviation",
  "police aviation unit Minnesota",
  "sheriff aviation Minnesota",
  "state police aviation Minnesota",
  "Metropolitan Airports Commission",
  "MAC general aviation airports",

  "aerospace manufacturer Minnesota",
  "aviation parts supplier Minnesota",
  "aircraft component supplier Minnesota",
  "OEM support Minnesota",
  "composite manufacturing aviation Minnesota",
  "machining aerospace Minnesota",
  "aviation electronics manufacturer",
  "defense contractor aerospace Minnesota",
  "Worthington Aviation parts",
  "Cirrus aircraft parts Minnesota",
  "sustainable aviation fuel Minnesota",
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

  console.log(`\nFound ${allQueries.length} pending search queries.`);

  const queryChunks = chunkArray(allQueries, CONCURRENCY_LIMIT);
  const totalChunks = queryChunks.length;

  for (let ci = 0; ci < totalChunks; ci++) {
    const chunk = queryChunks[ci];
    console.log(
      `\n--- Batch ${ci + 1}/${totalChunks} (${chunk.length} queries) [Mem: ${getMemoryMB()}MB] ---`
    );

    let captchaHitThisBatch = false;

    await Promise.all(
      chunk.map(async ({ airport, keyword }) => {
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

          console.log(`  [SEARCH] ${fullQuery}`);

          await page.goto("https://www.google.com/maps", {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          await page.waitForTimeout(1000 + Math.random() * 1000);
          await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });

          const found = await page
            .waitForSelector(
              '.qBF1Pd, .DUwDvf, iframe[src*="recaptcha"]',
              { timeout: 15000 }
            )
            .catch(() => null);

          if (await page.$('iframe[src*="recaptcha"]')) {
            console.log(`  !!! CAPTCHA on ${fullQuery} — skipping !!!`);
            captchaHitThisBatch = true;
            failedQueries.push({ airport, keyword });
            allData[airport][keyword] = [];
            return;
          }

          if (!found) {
            console.log(`  No results: ${fullQuery}`);
            allData[airport][keyword] = [];
            return;
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
        } catch (err) {
          console.error(`  [ERROR] ${keyword} ${airport}: ${err.message}`);
          failedQueries.push({ airport, keyword });
          allData[airport][keyword] = allData[airport][keyword] || [];
        } finally {
          if (page) {
            await page.goto("about:blank").catch(() => {});
            await page.close().catch(() => {});
          }
          if (context) {
            await context.close().catch(() => {});
          }
        }
      })
    );

    totalQueriesRun += chunk.length;
    totalQueriesSinceRelaunch += chunk.length;

    saveData(allData);

    if (captchaHitThisBatch) {
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

      await Promise.all(
        chunk.map(async ({ airport, keyword }) => {
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

            console.log(`  [RETRY] ${fullQuery}`);

            await page.goto("https://www.google.com/maps", {
              waitUntil: "domcontentloaded",
              timeout: 20000,
            });
            await page.waitForTimeout(1000 + Math.random() * 1000);
            await page.goto(searchUrl, {
              waitUntil: "domcontentloaded",
              timeout: 20000,
            });

            const found = await page
              .waitForSelector(
                '.qBF1Pd, .DUwDvf, iframe[src*="recaptcha"]',
                { timeout: 15000 }
              )
              .catch(() => null);

            if (await page.$('iframe[src*="recaptcha"]')) {
              console.log(`  !!! CAPTCHA on retry ${fullQuery} — skipping !!!`);
              allData[airport][keyword] = allData[airport][keyword] || [];
              return;
            }

            if (!found) {
              allData[airport][keyword] = [];
              return;
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
          } catch (err) {
            console.error(`  [RETRY ERROR] ${keyword} ${airport}: ${err.message}`);
            allData[airport][keyword] = allData[airport][keyword] || [];
          } finally {
            if (page) {
              await page.goto("about:blank").catch(() => {});
              await page.close().catch(() => {});
            }
            if (context) {
              await context.close().catch(() => {});
            }
          }
        })
      );

      saveData(allData);
      await new Promise((r) => setTimeout(r, MIN_DELAY_MS + Math.random() * 5000));
    }
  }

  capturedData = null;
  await browser.close().catch(() => {});
  console.log(
    `\n\u2705 Scraping complete! ${totalQueriesRun} queries run, ${totalFound} unique leads found.`
  );
}

scrapeGoogleMaps();

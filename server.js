const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const fs = require("fs");

chromium.use(stealth);

const FILE_NAME = "aviation_results.json";
const CONCURRENCY_LIMIT = 3; // Number of parallel browsers to run

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
  {"name": "Bemidji Regional Airport", "code": "BJI"},
  {"name": "Brainerd Lakes Regional Airport", "code": "BRD"},
  {"name": "Duluth International Airport", "code": "DLH"},
  {"name": "Range Regional Airport", "code": "HIB"},
  {"name": "Minneapolis–Saint Paul International Airport (Wold-Chamberlain Field)", "code": "MSP"},
  {"name": "Rochester International Airport", "code": "RST"},
  {"name": "St. Cloud Regional Airport", "code": "STC"},
  {"name": "Falls International Airport (Einarson Field)", "code": "INL"},
  {"name": "Thief River Falls Regional Airport", "code": "TVF"},
  {"name": "Anoka County–Blaine Airport (Janes Field)", "code": "ANE"},
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
  {"name": "Houston County Airport (Caledonia–Houston County Airport)", "code": "CHU"},
  {"name": "Cambridge Municipal Airport", "code": "CBG"},
  {"name": "Myers Field", "code": "CNB"},
  {"name": "Cloquet Carlton County Airport", "code": "COQ"},
  {"name": "Cook Municipal Airport", "code": "CQM"},
  {"name": "Crookston Municipal Airport (Kirkwood Field)", "code": "CKN"},
  {"name": "Detroit Lakes Airport (Wething Field)", "code": "DTL"},
  {"name": "Dodge Center Airport (Dodge Center Municipal)", "code": "TOB"},
  {"name": "Sky Harbor Airport", "code": "DYT"},
  {"name": "Elbow Lake Municipal – Pride of the Prairie Airport", "code": "Y63"},
  {"name": "Ely Municipal Airport", "code": "ELO"},
  {"name": "Eveleth–Virginia Municipal Airport", "code": "EVM"},
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
  {"name": "Montevideo–Chippewa County Airport", "code": "MVE"},
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
]
const KEYWORDS = [
  // =============================================
  // 1. CORE OPERATORS (Fleet Owners & Charter)
  // =============================================
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

  // Specific Part 135 Charter Operators [2†L4-L11]
  "Aviation Charter Inc Eden Prairie", // Large Part 135 operator, 260 FTEs, 90 pilots [2†L8-L10]
  "Hummingbird Ventures LLC Eden Prairie", // Part 135 operator [2†L4-L7]
  "North Central Aviation St. Paul", // Part 135 operator, 44 FTEs, 28 pilots [2†L17-L20]
  "Northern Air Transport Grand Rapids", // Part 135 operator [2†L21-L24]
  "Thunderbird Aviation Minnesota", // Largest flight school, Part 135 air carrier [2†L25-L28]
  "Bemidji Aviation Services", // Part 135 cargo operator, 100 employees, 50 aircraft, also FBO & Repair Station [2†L30-L33]
  "B 2 W Corporation Winona", // Part 135 operator [2†L34-L36]
  "Weidendorf Investments Hinckley", // Part 135 operator [2†L37-L40]

  // =============================================
  // 2. MAINTENANCE / MRO (Direct Parts Buyers)
  // =============================================
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

  // Specific Minnesota MROs
  "Premier Jet Center Minneapolis", // FAA Part 145 Repair Station (6EXR899B), Service Center for Pilatus, Cirrus, Kodiak [3†L13-L16][9†L9-L12]
  "Premier Jet Center maintenance", // Full-service MRO at Flying Cloud (KFCM) [1†L6-L8][7†L8-L10]
  "Premier Jet Center avionics", // Avionics services offered [1†L7][3†L38-L40]
  "Premier Jet Center interiors", // Upholstery, paint, interior design [1†L6][3†L39-L40]
  "West Star Aviation Minneapolis", // FAA Certified Repair Station, airframe, avionics, interiors, minor paint [3†L17-L21]
  "Worthington Aviation Eagan", // MRO Center, composite structures, spare parts, repair programs [3†L22-L28]
  "Quality Aviation Faribault", // Helicopter service center, major structural repair, rotor balancing [3†L31-L35]
  "Up North Aero", // FAA-certified Aviation Component Repair Station, accessories, airframe components, avionics, batteries [3†L47-L51]
  "MSP Jet Center Minneapolis", // Full-service maintenance, fueling [3†L42-L46]
  "Twin City Aviation Minneapolis", // Aviation services [3†L52]

  // =============================================
  // 3. KEY AIRPORT-BASED TARGETING
  // =============================================
  // MSP - Minneapolis-Saint Paul International (Primary Hub)
  "MSP FBO",
  "Minneapolis-St. Paul International FBO",
  "KMSP aviation services",
  "MSP Jet Center", // FBO at MSP [3†L42-L46]

  // KFCM - Flying Cloud Airport (Busiest GA Airport in MN) [4†L43-L45]
  "Flying Cloud Airport FBO",
  "KFCM FBO",
  "Premier Jet Center KFCM", // Full-service FBO with 35,000 sq ft hangar [1†L18-L21][7†L5-L8]
  "KFCM aircraft maintenance",
  "Inflight Pilot Training KFCM", // Flight school at KFCM [9†L14-L16]
  "AV8 Flight School KFCM", // Only MN flight school with airplane, helicopter, and light-sport training [9†L18-L20]

  // KSTP - St. Paul Downtown Airport Holman Field
  "St. Paul Downtown Airport FBO",
  "KSTP FBO",
  "St. Paul Flight Center", // Full-service FBO, new terminal, accommodates up to Gulfstream V [1†L48-L51]

  // KANE - Anoka County-Blaine Airport
  "Anoka County-Blaine Airport FBO",
  "KANE FBO",
  "Cirrus Flight Operations Blaine", // FBO, charter, maintenance [8†L5-L9]

  // KFAR - Hector International Airport (Fargo, serves NW MN)
  "Fargo Jet Center KFAR", // Full-service FBO, U.S. Customs on-site 24/7, Avfuel network [1†L41-L46]

  // Other Key Airports
  "Duluth International Airport FBO", // KDLH - $20M new ATC tower announced 2025 [4†L30-L35]
  "Bemidji Regional Airport FBO", // KBJI - Bemidji Aviation Services base
  "Brainerd Lakes Regional Airport FBO", // KBRD
  "Rochester International Airport FBO", // KRST
  "St. Cloud Regional Airport FBO", // KSTC
  "Mankato Regional Airport FBO", // KMKT
  "Thief River Falls Regional Airport FBO", // KTVF
  "Grand Rapids Airport FBO", // KGPZ - Northern Air Transport base
  "Eden Prairie Airport aviation", // - Aviation Charter Inc base
  "Winona Municipal Airport aviation", // - B 2 W Corporation base
  "Hinckley Airport aviation", // - Weidendorf Investments base

  // =============================================
  // 4. FBOs & GROUND SERVICES
  // =============================================
  "FBO Minnesota",
  "fixed base operator Minnesota",
  "aircraft fueling Minnesota",
  "jet fuel Minnesota",
  "Avfuel Minnesota", // Premier Jet Center and Fargo Jet Center are Avfuel branded [1†L9][7†L11]
  "hangar rental Minnesota",
  "hangar storage Minnesota",
  "tie-down rental Minnesota",
  "ground handling Minnesota",
  "aircraft parking Minnesota",
  "executive terminal Minnesota",
  "deicing services Minnesota",
  "aircraft detailing Minnesota",
  "Cirrus Flight Operations FBO", // FBO at Anoka County-Blaine [8†L5-L9]
  "Lynx FBO Network Minnesota", // Acquired Cirrus Flight Operations [8†L43-L44]

  // =============================================
  // 5. HELICOPTER OPERATORS
  // =============================================
  "helicopter tours Minnesota",
  "helicopter charter Minnesota",
  "helicopter maintenance Minnesota",
  "helicopter operator Minnesota",
  "Bell helicopter Minnesota",
  "Robinson helicopter Minnesota",
  "Airbus helicopter Minnesota",
  "helicopter EMS Minnesota",
  "AV8 Flight School helicopter", // Only MN flight school with helicopter training [9†L19-L20]
  "Quality Aviation helicopter", // Complete helicopter service center [3†L31-L35]

  // =============================================
  // 6. SPECIAL OPERATIONS
  // =============================================
  "aerial surveying Minnesota",
  "aerial photography Minnesota",
  "aerial mapping Minnesota",
  "search and rescue aviation Minnesota",
  "law enforcement aviation Minnesota",
  "aerial firefighting Minnesota",
  "aerial application Minnesota",
  "agricultural aviation Minnesota",
  "aerial camera packages Minnesota", // Referenced in MN Session Laws [0†L17]

  // =============================================
  // 7. FLIGHT SCHOOLS & INSTRUCTION
  // =============================================
  "flight school Minnesota",
  "pilot training Minnesota",
  "Part 141 flight school Minnesota",
  "helicopter flight training Minnesota",
  "commercial pilot training Minnesota",
  "aviation college Minnesota",
  "Inflight Pilot Training", // Twin Cities Best Flight School [9†L14-L16]
  "AV8 Flight School", // Only MN school with airplane, helicopter, and light-sport training [9†L18-L20]
  "Thunderbird Aviation flight school", // Largest flight school in MN, FAA 141 approved [2†L26-L28]

  // =============================================
  // 8. AIRCRAFT TYPE SPECIFIC
  // =============================================
  "King Air operator Minnesota",
  "Citation operator Minnesota",
  "Phenom operator Minnesota",
  "Caravan operator Minnesota",
  "Gulfstream operator Minnesota",
  "Challenger operator Minnesota",
  "Cirrus operator Minnesota", // Premier Jet Center is Cirrus Service Center [3†L14]
  "Pilatus operator Minnesota", // Premier Jet Center is Pilatus Service Center [3†L14]
  "Kodiak operator Minnesota", // Premier Jet Center is Kodiak Service Center [3†L14]
  "Cessna operator Minnesota",
  "Piper operator Minnesota",
  "Bemidji Aviation fleet", // ~50 fixed-wing aircraft, mostly freight [2†L31-L32]
  "small aircraft parts Minnesota",
  "corporate jet parts Minnesota",

  // =============================================
  // 9. CITY-SPECIFIC TARGETING
  // =============================================
  "aviation Minneapolis",
  "aviation St. Paul",
  "aviation Duluth",
  "aviation Rochester",
  "aviation Bloomington", // MSP Airport location
  "aviation Eden Prairie", // Aviation Charter Inc, Hummingbird Ventures
  "aviation Blaine", // Cirrus Flight Operations
  "aviation St. Cloud",
  "aviation Mankato",
  "aviation Bemidji",
  "aviation Brainerd",
  "aviation Grand Rapids", // Northern Air Transport
  "aviation Winona", // B 2 W Corporation
  "aviation Hinckley", // Weidendorf Investments
  "aviation Faribault", // Quality Aviation
  "aviation Eagan", // Worthington Aviation
  "aviation Fergus Falls",
  "aviation Thief River Falls",

  // =============================================
  // 10. MILITARY & GOVERNMENT AVIATION
  // =============================================
  "military aviation contractor Minnesota",
  "defense aerospace Minnesota",
  "Minnesota Air National Guard",
  "Minneapolis-St. Paul Air Reserve Station", // ARS
  "Duluth Air National Guard Base", // 148th Fighter Wing
  "Camp Ripley aviation",
  "Minnesota Army National Guard aviation",
  "police aviation unit Minnesota",
  "sheriff aviation Minnesota",
  "state police aviation Minnesota",
  "Metropolitan Airports Commission", // MAC oversees MSP and general aviation airports [4†L19-L20]
  "MAC general aviation airports", // 385,000 operations in 2025, up 3% [4†L42-L44]

  // =============================================
  // 11. AEROSPACE MANUFACTURING & SUPPLIERS
  // =============================================
  "aerospace manufacturer Minnesota",
  "aviation parts supplier Minnesota",
  "aircraft component supplier Minnesota",
  "OEM support Minnesota",
  "composite manufacturing aviation Minnesota",
  "machining aerospace Minnesota",
  "aviation electronics manufacturer",
  "defense contractor aerospace Minnesota",
  "Worthington Aviation parts", // Spare parts, repair programs [3†L22-L28]
  "Cirrus aircraft parts Minnesota", // Cirrus has manufacturing in Duluth and service centers in MN
  "sustainable aviation fuel Minnesota", // SAF specifications in MN Law [0†L18]
];
// Helper to split tasks into parallel chunks
const chunkArray = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size),
  );

async function scrapeGoogleMaps() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  // OPTIMIZATION 1: True Headless Mode Enabled
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  let allData = {};
  const seenEntries = new Set();

  // ===== SAFE LOAD =====
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

  // Flatten queries for parallel execution
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

  // OPTIMIZATION 2: Managed Concurrency (Parallel Workers)
  const queryChunks = chunkArray(allQueries, CONCURRENCY_LIMIT);

  for (let i = 0; i < queryChunks.length; i++) {
    console.log(`\n--- Starting Batch ${i + 1} of ${queryChunks.length} ---`);
    const chunk = queryChunks[i];

    await Promise.all(
      chunk.map(async ({ airport, keyword }) => {
        const context = await browser.newContext({
          userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
          viewport: { width: 1366, height: 768 },
        });

        const page = await context.newPage();

        // OPTIMIZATION 3: Block Unnecessary Resources
        await page.route("**/*", (route) => {
          const resourceType = route.request().resourceType();
          if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });

        const fullQuery = `${keyword} ${airport}`;

        // OPTIMIZATION 4: Fixed String Interpolation Syntax
        const searchUrl = `https://www.google.com/maps/search/$${encodeURIComponent(fullQuery)}?hl=en`;

        console.log(`[SEARCHING]: ${fullQuery}`);
        let results = [];

        try {
          await page.goto("https://www.google.com/maps", {
            waitUntil: "domcontentloaded",
          });
          await page.waitForTimeout(1000 + Math.random() * 1000);
          await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

          const found = await page
            .waitForSelector('.qBF1Pd, .DUwDvf, iframe[src*="recaptcha"]', {
              timeout: 15000,
            })
            .catch(() => null);

          if (await page.$('iframe[src*="recaptcha"]')) {
            console.log(`!!! CAPTCHA DETECTED on ${fullQuery} !!!`);
            // Note: In true headless mode, manual solving isn't possible.
            // You may need to gracefully close this page and try later.
          }

          if (!found) {
            console.log(`No results for: ${fullQuery}`);
            allData[airport][keyword] = [];
          } else {
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
                  }
                } catch (e) {
                  // Ignore timeouts on bad cards
                }
              }
            }

            allData[airport][keyword] = results;
            console.log(
              `Finished [${fullQuery}]: Found ${results.length} new leads.`,
            );
          }
        } catch (err) {
          console.error(`Error on [${fullQuery}]: ${err.message}`);
        }

        await page.close();
        await context.close();
      }),
    );

    // Save data AFTER the parallel chunk finishes to prevent file write collisions
    saveData(allData);
  }

  await browser.close();
  console.log("\n✅ Scraping complete!");
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
    JSON.parse(fs.readFileSync(tempFile, "utf8")); // Validate temp file
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

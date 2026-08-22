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
  {"name": "Akron–Canton Airport", "code": "CAK"},
  {"name": "Cleveland Hopkins International Airport", "code": "CLE"},
  {"name": "John Glenn Columbus International Airport", "code": "CMH"},
  {"name": "Rickenbacker International Airport", "code": "LCK"},
  {"name": "James M. Cox Dayton International Airport", "code": "DAY"},
  {"name": "Eugene F. Kranz Toledo Express Airport", "code": "TOL"},
  {"name": "Cuyahoga County Airport (Robert D. Shea Field)", "code": "CGF"},
  {"name": "Bolton Field", "code": "TZR"},
  {"name": "Ohio State University Airport", "code": "OSU"},
  {"name": "Dayton-Wright Brothers Airport", "code": "MGY"},
  {"name": "Butler County Regional Airport (Hogan Field)", "code": "HAO"},
  {"name": "Lorain County Regional Airport", "code": "LPR"},
  {"name": "Medina Municipal Airport", "code": "1G5"},
  {"name": "Lake County Executive Airport", "code": "LNN"},
  {"name": "Akron Fulton International Airport", "code": "AKR"},
  {"name": "Barber Airport", "code": "2D1"},
  {"name": "Ashland County Airport", "code": "3G4"},
  {"name": "Northeast Ohio Regional Airport", "code": "HZY"},
  {"name": "Ohio University Airport (Snyder Field)", "code": "UNI"},
  {"name": "Barnesville-Bradfield Airport", "code": "6G5"},
  {"name": "Clermont County Airport", "code": "I69"},
  {"name": "Bellefontaine Regional Airport", "code": "EDJ"},
  {"name": "Bluffton Airport", "code": "5G7"},
  {"name": "Wood County Airport", "code": "1G0"},
  {"name": "Williams County Airport", "code": "0G6"},
  {"name": "Port Bucyrus-Crawford County Airport", "code": "17G"},
  {"name": "Harrison County Airport", "code": "8G6"},
  {"name": "Cambridge Municipal Airport", "code": "CDI"},
  {"name": "Carroll County-Tolson Airport", "code": "TSO"},
  {"name": "Lakefield Airport", "code": "CQA"},
  {"name": "Lawrence County Airpark", "code": "HTW"},
  {"name": "Ross County Airport", "code": "RZT"},
  {"name": "Cincinnati Municipal Airport (Lunken Field)", "code": "LUK"},
  {"name": "Pickaway County Memorial Airport", "code": "CYO"},
  {"name": "Burke Lakefront Airport", "code": "BKL"},
  {"name": "Richard Downing Airport", "code": "I40"},
  {"name": "Greene County-Lewis A. Jackson Regional Airport", "code": "I19"},
  {"name": "Defiance Memorial Airport", "code": "DFI"},
  {"name": "Delaware Municipal Airport (Jim Moore Field)", "code": "DLZ"},
  {"name": "Columbiana County Airport", "code": "02G"},
  {"name": "Findlay Airport", "code": "FDY"},
  {"name": "Fostoria Metropolitan Airport", "code": "FZI"},
  {"name": "Sandusky County Regional Airport", "code": "S24"},
  {"name": "Galion Municipal Airport", "code": "GQQ"},
  {"name": "Gallia-Meigs Regional Airport", "code": "GAS"},
  {"name": "Brown County Airport", "code": "GEO"},
  {"name": "Cincinnati West Airport", "code": "I67"},
  {"name": "Highland County Airport", "code": "HOC"},
  {"name": "James A. Rhodes Airport", "code": "I43"},
  {"name": "Kelleys Island Land Field", "code": "89D"},
  {"name": "Kent State University Airport", "code": "1G3"},
  {"name": "Hardin County Airport", "code": "I95"},
  {"name": "Fairfield County Airport", "code": "LHQ"},
  {"name": "Warren County Airport (John Lane Field)", "code": "I68"},
  {"name": "Lima Allen County Airport", "code": "AOH"},
  {"name": "Madison County Airport", "code": "UYF"},
  {"name": "Mansfield Lahm Regional Airport", "code": "MFD"},
  {"name": "Marion Municipal Airport", "code": "MNN"},
  {"name": "Union County Airport", "code": "MRT"},
  {"name": "Vinton County Airport", "code": "22I"},
  {"name": "Middle Bass Island Airport", "code": "3T7"},
  {"name": "Geauga County Airport", "code": "7G8"},
  {"name": "Middletown Regional Airport (Hook Field)", "code": "MWO"},
  {"name": "Holmes County Airport", "code": "10G"},
  {"name": "Morrow County Airport", "code": "4I9"},
  {"name": "Knox County Airport", "code": "4I3"},
  {"name": "Henry County Airport", "code": "7W5"},
  {"name": "Perry County Airport", "code": "I86"},
  {"name": "Harry Clever Field", "code": "PHD"},
  {"name": "Newark-Heath Airport", "code": "VTA"},
  {"name": "North Bass Island Airport", "code": "3X5"},
  {"name": "Norwalk-Huron County Airport", "code": "5A1"},
  {"name": "Putnam County Airport", "code": "OWX"},
  {"name": "Miami University Airport", "code": "OXD"},
  {"name": "Erie-Ottawa International Airport (Carl R. Keller Field)", "code": "PCW"},
  {"name": "Greater Portsmouth Regional Airport", "code": "PMH"},
  {"name": "Put-in-Bay Airport", "code": "3W2"},
  {"name": "Portage County Airport", "code": "POV"},
  {"name": "Sidney Municipal Airport", "code": "SCA"},
  {"name": "Springfield-Beckley Municipal Airport", "code": "SGH"},
  {"name": "Geary A. Bates/Jefferson County Airpark", "code": "2G2"},
  {"name": "Seneca County Airport", "code": "16G"},
  {"name": "Toledo Executive Airport", "code": "TDZ"},
  {"name": "Wyandot County Airport", "code": "56D"},
  {"name": "Grimes Field", "code": "I74"},
  {"name": "Van Wert County Airport", "code": "VNW"},
  {"name": "Darke County Airport", "code": "VES"},
  {"name": "Wadsworth Municipal Airport", "code": "3G3"},
  {"name": "Neil Armstrong Airport", "code": "AXV"},
  {"name": "Warren Airport", "code": "62D"},
  {"name": "Fayette County Airport", "code": "I23"},
  {"name": "Fulton County Airport", "code": "USE"},
  {"name": "Pike County Airport", "code": "EOP"},
  {"name": "Alexander Salamon Airport", "code": "AMT"},
  {"name": "Clinton Field", "code": "I66"},
  {"name": "Monroe County Airport", "code": "4G5"},
  {"name": "Wayne County Airport", "code": "BJJ"},
  {"name": "Youngstown–Warren Regional Airport / Youngstown ARS", "code": "YNG"},
  {"name": "Zanesville Municipal Airport", "code": "ZZV"},
  {"name": "Ada Airport", "code": "0D7"},
  {"name": "Mayfield Airport", "code": "1D4"},
  {"name": "Miller Airport", "code": "4G3"},
  {"name": "Miller Farm Landing Strip", "code": "7B4"},
  {"name": "Beach City Airport", "code": "2D7"},
  {"name": "Bordner Airport", "code": "3D8"},
  {"name": "Noble County Airport", "code": "I10"},
  {"name": "Parsons Airport", "code": "5D6"},
  {"name": "Chapman Memorial Field", "code": "6CM"},
  {"name": "Bandit Field Airdrome", "code": "5D9"},
  {"name": "Columbia Airport", "code": "4G8"},
  {"name": "Moraine Airpark", "code": "I73"},
  {"name": "Dahio Trotwood Airport (Dayton-New Lebanon Airport)", "code": "I44"},
  {"name": "Dayton-Phillipsburg Airport", "code": "3I7"},
  {"name": "Deshler Municipal Landing Strip", "code": "6D7"},
  {"name": "Elyria Airport", "code": "1G1"},
  {"name": "Fremont Airport", "code": "14G"},
  {"name": "Gates Airport", "code": "7D8"},
  {"name": "Germack Airport", "code": "7D9"},
  {"name": "Hinde Airport", "code": "88D"},
  {"name": "Ruhe's Airport", "code": "R47"},
  {"name": "Morgan County Airport", "code": "I71"},
  {"name": "Middle Bass-East Point Airport", "code": "3W9"},
  {"name": "Wynkoop Airport", "code": "6G4"},
  {"name": "Elliot's Landing Airport", "code": "O74"},
  {"name": "Braceville Airport", "code": "41N"},
  {"name": "Concord Airpark", "code": "2G1"},
  {"name": "Piqua Airport (Hartzell Field)", "code": "I17"},
  {"name": "Packer Airport", "code": "5E9"},
  {"name": "Alderman Airport", "code": "2P7"},
  {"name": "Grand Lake St. Marys Seaplane Base", "code": "O12"},
  {"name": "Salem Airpark", "code": "38D"},
  {"name": "Koons Airport", "code": "8G8"},
  {"name": "Tri-City Airport", "code": "3G6"},
  {"name": "Shelby Community Airport", "code": "12G"},
  {"name": "Eddie Dew Memorial Airpark", "code": "1G8"},
  {"name": "Mad River Airpark", "code": "I54"},
  {"name": "Waco Field", "code": "1WF"},
  {"name": "Weller Airport", "code": "38I"},
  {"name": "Weltzien Skypark", "code": "15G"},
  {"name": "Ortner Airport (formerly Wakeman Airport)", "code": "I64"},
  {"name": "Red Stewart Airfield", "code": "40I"},
  {"name": "Tri-City Airport", "code": "80G"},
  {"name": "Willard Municipal Airport", "code": "8G1"},
  {"name": "Wilmington Air Park", "code": "ILN"},
  {"name": "Hollister Field", "code": "2B6"},
  {"name": "Youngstown Elser Metro Airport", "code": "4G4"},
  {"name": "Lansdowne Airport", "code": "04G"},
  {"name": "Parr Airport", "code": "42I"},
  {"name": "Wright-Patterson Air Force Base", "code": "FFO"},
  {"name": "Darby Dan Airport", "code": "75OA"},
  {"name": "Far View Airport", "code": "OI41"},
  {"name": "Troy Skypark", "code": "OH71"}
]
const KEYWORDS = [
  // =============================================
  // 1. CORE OPERATORS (Fleet Owners & Charter)
  // =============================================
  "air charter Ohio",
  "private jet charter Ohio",
  "executive aviation Ohio",
  "corporate aviation Ohio",
  "Part 135 operator Ohio",
  "air taxi Ohio",
  "air ambulance Ohio",
  "medevac Ohio",
  "cargo airline Ohio",
  "air freight Ohio",
  "aircraft management Ohio",
  "company aircraft Ohio",
  "on-demand charter Ohio",

  // Specific Part 135 Operators in Ohio [0†L4-L8][0†L41-L44][0†L9-L14][0†L15-L19][0†L20-L24][0†L25-L29][0†L30-L34][0†L35-L40]
  "Grand Aire Inc Swanton", // FAR Part 135 and Part 121, Top 5 Air Charter providers in North America [0†L25-L29]
  "Aitheras Aviation Group Cleveland", // Part 135 at Burke Lakefront Airport [0†L9-L14]
  "Sky Quest LLC Cleveland", // Part 135, aircraft management, sales, acquisitions [0†L15-L19]
  "Castle Aviation Inc Akron", // Part 135 at Akron-Canton Airport (CAK) [0†L20-L24]
  "Priority Air Charter LLC Apple Creek", // Part 135 operator [0†L7][0†L43]
  "Western Air Charter Inc", // Part 135 operator [0†L8]
  "Blue Ash Charters LLC Miamisburg", // Part 135, fleet of 2 aircraft [0†L6][0†L45-L49]
  "East West Helicopter LLC Harrison", // Part 135 helicopter operator, fleet of 4 aircraft [0†L30-L34]
  "Southeastern Ohio Air Service Zanesville", // Part 135, fleet of 3 aircraft [0†L35-L40]
  "AIRNET II LLC", // Part 135 operator [0†L5]
  "AMERICAN WINDS INC.", // Part 135 operator [0†L6]
  "Castle Aviation Inc North Canton", // Part 135 operator [0†L22-L24]

  // =============================================
  // 2. MAINTENANCE / MRO (Direct Parts Buyers)
  // =============================================
  "aircraft maintenance Ohio",
  "aircraft repair station Ohio",
  "MRO Ohio",
  "Part 145 repair station Ohio", // 131 FAA-certificated repair stations in Ohio [1†L36-L37]
  "FAA certified repair station Ohio",
  "FAA Part 145 Ohio", // Airborne MRO, Lane Aviation, Toledo Jet Center, Ohio University [1†L9-L11][1†L13-L18][1†L19-L24][1†L31-L34]
  "jet engine overhaul Ohio",
  "turbine engine repair Ohio",
  "avionics repair Ohio",
  "helicopter maintenance Ohio",
  "airframe maintenance Ohio",
  "composite repair Ohio",
  "aircraft painting Ohio",
  "aircraft interiors Ohio",
  "propeller repair Ohio",
  "AOG support Ohio",
  "line maintenance Ohio",

  // Specific Ohio MROs & Repair Stations [1†L4-L11][1†L12-L18][1†L19-L24][1†L25-L30][1†L31-L34][1†L40-L43]
  "Airborne Maintenance & Engineering Services Wilmington", // Part 145, 315,000 sq ft hangar, 100,000 sq ft component facility [1†L4-L11]
  "Airborne MRO Wilmington", // FAA/EASA certified Part 145, Airbus to Boeing platforms [1†L46-L49]
  "Lane Aviation Columbus", // FAA Part 145 Repair Station, third-generation FBO since 1935 [1†L12-L18][2†L12-L16]
  "Toledo Jet Center Toledo", // FAA/EASA Part 145, former Citation Service Center at KTOL [1†L19-L24]
  "RTS Cincinnati", // FAA Part 145 repair station (authorized May 2026) [1†L25-L30]
  "Ohio University Aircraft Services", // FAA Part 145 Certified Repair Station at Ohio University Airport [1†L31-L34]
  "Ohio State University Airport Part 145", // FAA Part 145 Repair Station in Columbus [1†L40-L43]
  "Achievement Aviation LLC Sidney", // FAA Part 145 repair station [1†L39]
  "Great Lakes Turbines", // Component MRO specialist (acquired by Atlantic Jet Partners) [1†L50]

  // =============================================
  // 3. KEY AIRPORT-BASED TARGETING
  // =============================================
  // Cleveland Hopkins International (CLE) - Primary Hub [4†L6][4†L12-L13]
  "CLE FBO",
  "Cleveland Hopkins International FBO",
  "KCLE aviation services",
  "Aitheras Aviation Cleveland", // Part 135 at Burke Lakefront [0†L9-L14]

  // John Glenn Columbus International (CMH) - Primary Hub [4†L7][4†L13]
  "CMH FBO",
  "John Glenn Columbus International FBO",
  "Lane Aviation Columbus", // Third-generation FBO at KCMH [2†L12-L16]
  "KCMH aviation services",

  // Dayton International (DAY) - Primary Hub [4†L14]
  "DAY FBO",
  "Dayton International FBO",
  "PremierFBO Dayton", // Full-service FBO at KDAY [2†L4-L10]
  "Wright Bros. Aero Dayton", // Full-service FBO at KDAY since 1978 [2†L28-L33]
  "KDAY aviation services",

  // Akron-Canton Regional (CAK) - Primary Hub [4†L26][4†L32]
  "CAK FBO",
  "Akron-Canton Regional FBO",
  "Castle Aviation CAK", // FBO and Part 135 at CAK [2†L35-L38][0†L20-L24]
  "KCAK aviation services",

  // Toledo Express (TOL) - Primary Hub [4†L8]
  "TOL FBO",
  "Toledo Express FBO",
  "Toledo Jet Center TOL", // MRO at KTOL, former Citation Service Center [1†L19-L24]
  "KTOL aviation services",

  // Rickenbacker International (LCK) - Primary Hub [4†L8][5†L11]
  "LCK FBO",
  "Rickenbacker International FBO",
  "Rickenbacker Aviation LCK", // NATA-certified FBO, 14th largest U.S. cargo airport [2†L45-L49]
  "121st Air Refueling Wing LCK", // Ohio Air National Guard base [5†L11]
  "KLCK aviation services",

  // Other Key Airports [4†L11]
  "Springfield-Beckley Municipal FBO", // KSGH - Electra Aero manufacturing site [3†L7-L8]
  "Wilmington Air Park FBO", // KILN - Airborne MRO, Ohio ANG exercise site [1†L4-L8][5†L7]
  "Youngstown-Warren Regional FBO", // KYNG - Commercial service [4†L19]
  "Cincinnati/Northern Kentucky International FBO", // KCVG - Serves Cincinnati area [4†L45]
  "Cincinnati Municipal Lunken FBO", // KLUK - Reliever airport
  "Burke Lakefront Airport FBO", // KBKL - Cleveland, Aitheras Aviation base [0†L13-L14]
  "Dayton-Wright Brothers Airport FBO", // KMGY - First Flight Aviation FBO [2†L18-L23]
  "Zanesville Municipal FBO", // KZZV - Zanesville Aviation, SEO Air Service [2†L40-L44]
  "Middletown Regional FBO", // KMWO - B&B Aero Services [2†L25-L28]

  // =============================================
  // 4. FBOs & GROUND SERVICES
  // =============================================
  "FBO Ohio",
  "fixed base operator Ohio",
  "aircraft fueling Ohio",
  "jet fuel Ohio",
  "Avfuel Ohio", // Lane Aviation joined Avfuel network [2†L12-L14]
  "hangar rental Ohio",
  "hangar storage Ohio",
  "tie-down rental Ohio",
  "ground handling Ohio",
  "aircraft parking Ohio",
  "executive terminal Ohio",
  "deicing services Ohio",
  "aircraft detailing Ohio",
  "PremierFBO Ohio", // FBO at Dayton [2†L4-L10]
  "Lane Aviation Ohio", // FBO at Columbus since 1935 [2†L12-L16]
  "Wright Bros. Aero Ohio", // FBO at Dayton since 1978 [2†L28-L33]
  "Castle Aviation FBO", // FBO at Akron-Canton [2†L35-L38]
  "First Flight Aviation Ohio", // FBO at Dayton-Wright Brothers [2†L18-L23]

  // =============================================
  // 5. HELICOPTER OPERATORS
  // =============================================
  "helicopter tours Ohio",
  "helicopter charter Ohio",
  "helicopter maintenance Ohio",
  "helicopter operator Ohio",
  "Bell helicopter Ohio",
  "Robinson helicopter Ohio",
  "Airbus helicopter Ohio",
  "helicopter EMS Ohio",
  "East West Helicopter LLC Harrison", // Part 135 helicopter operator, fleet of 4 [0†L30-L34]

  // =============================================
  // 6. SPECIAL OPERATIONS
  // =============================================
  "aerial surveying Ohio",
  "aerial photography Ohio",
  "aerial mapping Ohio",
  "search and rescue aviation Ohio",
  "law enforcement aviation Ohio",
  "aerial firefighting Ohio",
  "aerial application Ohio",
  "agricultural aviation Ohio",
  "aerial tours Ohio",

  // =============================================
  // 7. FLIGHT SCHOOLS & INSTRUCTION
  // =============================================
  "flight school Ohio",
  "pilot training Ohio",
  "Part 141 flight school Ohio",
  "helicopter flight training Ohio",
  "commercial pilot training Ohio",
  "aviation college Ohio",
  "Ohio State University flight school", // OSU Airport [1†L40-L43]
  "Ohio University flight school", // Ohio University Airport [1†L31-L34]
  "flight instruction Ohio",

  // =============================================
  // 8. AIRCRAFT TYPE SPECIFIC
  // =============================================
  "King Air operator Ohio",
  "Citation operator Ohio",
  "Phenom operator Ohio",
  "Caravan operator Ohio",
  "Gulfstream operator Ohio",
  "Challenger operator Ohio",
  "Cirrus operator Ohio",
  "Cessna operator Ohio",
  "Piper operator Ohio",
  "Beechcraft operator Ohio", // Toledo Jet Center was Citation Service Center [1†L23]
  "Embraer maintenance Ohio", // RTS Cincinnati authorized for Embraer [1†L26-L27]
  "Airbus maintenance Ohio", // Airborne MRO services Airbus [1†L49]
  "Boeing maintenance Ohio", // Airborne MRO services Boeing [1†L49]
  "F-16 maintenance Ohio", // Ohio ANG 180th Fighter Wing operates F-16s [5†L29]
  "KC-135 maintenance Ohio", // 121st Air Refueling Wing operates KC-135s [5†L25]
  "C-130 maintenance Ohio", // Ohio ANG operates C-130s [5†L25]

  // =============================================
  // 9. CITY-SPECIFIC TARGETING
  // =============================================
  "aviation Cleveland",
  "aviation Columbus",
  "aviation Cincinnati",
  "aviation Dayton",
  "aviation Akron",
  "aviation Canton",
  "aviation Toledo",
  "aviation Youngstown",
  "aviation Springfield", // Electra Aero manufacturing [3†L7-L8]
  "aviation Wilmington", // Airborne MRO, Ohio ANG [1†L4-L8]
  "aviation Mansfield", // Ohio ANG 179th Airlift Wing [5†L31]
  "aviation Zanesville", // Southeastern Ohio Air Service [0†L35-L40]
  "aviation Miamisburg", // Blue Ash Charters, First Flight Aviation [0†L46-L47]
  "aviation Swanton", // Grand Aire Inc HQ [0†L25-L29]
  "aviation North Canton", // Castle Aviation [0†L22-L24]
  "aviation Apple Creek", // Priority Air Charter [0†L43]
  "aviation Harrison", // East West Helicopter [0†L30-L34]
  "aviation Sidney", // Achievement Aviation [1†L39]

  // =============================================
  // 10. MILITARY & GOVERNMENT AVIATION
  // =============================================
  "military aviation contractor Ohio",
  "defense aerospace Ohio",
  "Ohio Air National Guard", // Second largest Air National Guard [5†L35]
  "121st Air Refueling Wing Rickenbacker", // KC-135 Stratotanker [5†L11-L12]
  "180th Fighter Wing Toledo", // F-16 Fighting Falcon [5†L29][5†L33]
  "178th Wing Springfield", // Ohio ANG unit [5†L18]
  "179th Airlift Wing Mansfield", // Ohio ANG unit [5†L31]
  "Rickenbacker Air National Guard Base", // Columbus [5†L11]
  "Toledo Express Air National Guard Base", // F-16 operations [5†L33-L34]
  "Wilmington Air Park", // Ohio ANG exercise site [5†L7]
  "Wright-Patterson Air Force Base", // Dayton, major Air Force research & development
  "Wright-Patterson AFB maintenance",
  "Naval Air Station Joint Reserve Base Toledo",
  "police aviation unit Ohio",
  "sheriff aviation Ohio",
  "state police aviation Ohio",
  "Ohio Department of Transportation Aviation", // ODOT Aviation [1†L39-L40]

  // =============================================
  // 11. AEROSPACE MANUFACTURING & SUPPLIERS
  // =============================================
  "aerospace manufacturer Ohio",
  "aviation parts supplier Ohio",
  "aircraft component supplier Ohio",
  "OEM support Ohio",
  "composite manufacturing aviation Ohio",
  "machining aerospace Ohio",
  "aviation electronics manufacturer",
  "defense contractor aerospace Ohio",

  // Specific Aerospace Manufacturers in Ohio [3†L4-L10][3†L22-L23]
  "Electra Aero Springfield", // $850M investment, 1,975 jobs, EL9 Ultra Short hybrid-electric aircraft [3†L7-L8][3†L27-L29]
  "Electra aircraft production Ohio", // Initial capacity 400 aircraft/year, expanding to 800 [3†L8-L9][3†L13-L14]
  "GE Aerospace Ohio", // Major aerospace presence [3†L22]
  "CTL Aerospace West Chester", // Aerospace manufacturing [3†L22]
  "Beehive Ohio", // $70M investment, 200+ jobs in southwest Ohio [3†L9-L10]
  "Airpark Ohio Springfield", // Electra facility location [3†L47]
  "Wright-Patterson AFB aerospace", // Major research & development hub
  "defense aerospace supply chain Ohio", // Southwest Ohio epicenter [3†L19-L20]
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

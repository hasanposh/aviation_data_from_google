const fs = require("fs");
const path = require("path");

// Path to your JSON file
// const inputPath = path.join(__dirname, "../aviation_results.json");
const inputPath = path.join(__dirname, "../../../Clients/Aviation company - roger-vasquez/Aviation company/USA/Florida.json");
// const inputPath = path.join(__dirname, "./cleaned_aviation_results.json");
const outputPath = path.join(__dirname, "./cleaned_aviation_results.json");

// Read JSON
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function cleanString(str) {
  if (!str) return "";

  return String(str)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeWebsite(url) {
  return cleanString(url)
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function normalizePhone(phone) {
  return cleanString(phone).replace(/\D/g, "");
}

function getCompanyKey(company) {
  const name = cleanString(company.name);
  const website = normalizeWebsite(company.website);
  const phone = normalizePhone(company.phone);

  // Prefer name + website
  if (name && website) {
    return `${name}|${website}`;
  }

  // Otherwise use name + phone
  if (name && phone) {
    return `${name}|${phone}`;
  }

  // Otherwise just name
  return name;
}

// Stores every company seen in the ENTIRE file
const globalSeen = new Set();

const cleanedData = {};

for (const [airportName, airportData] of Object.entries(data)) {
  const cleanedAirport = {};

  for (const [category, companies] of Object.entries(airportData)) {
    if (!Array.isArray(companies)) continue;

    const uniqueCompanies = [];

    for (const company of companies) {
      const key = getCompanyKey(company);

      // Skip invalid companies
      if (!key) continue;

      // Already exists somewhere else in the file
      if (globalSeen.has(key)) {
        console.log(
          `Removed duplicate: ${company.name} (${airportName} -> ${category})`
        );
        continue;
      }

      globalSeen.add(key);
      uniqueCompanies.push(company);
    }

    // Keep only non-empty categories
    if (uniqueCompanies.length > 0) {
      cleanedAirport[category] = uniqueCompanies;
    }
  }

  // Keep only non-empty airports
  if (Object.keys(cleanedAirport).length > 0) {
    cleanedData[airportName] = cleanedAirport;
  }
}

// Save JSON
fs.writeFileSync(
  outputPath,
  JSON.stringify(cleanedData, null, 2),
  "utf8"
);

console.log("✅ Cleaned JSON saved to:", outputPath);
console.log(`✅ Unique companies: ${globalSeen.size}`);
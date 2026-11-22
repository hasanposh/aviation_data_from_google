require("dotenv").config();
const mysql = require("mysql2/promise");

let dbPool = null;

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  waitForConnections: true,
  connectionLimit: 5,
};

const DB_NAME = process.env.DB_NAME || "aviation_scraper";

async function initDatabase() {
  const conn = await mysql.createConnection(DB_CONFIG);
  await conn.query("CREATE DATABASE IF NOT EXISTS `" + DB_NAME + "`");
  await conn.query("USE `" + DB_NAME + "`");
  await conn.query(
    "CREATE TABLE IF NOT EXISTS aviation_leads (" +
      "id INT AUTO_INCREMENT PRIMARY KEY," +
      "region VARCHAR(255) NOT NULL," +
      "airport VARCHAR(255) NOT NULL," +
      "keyword VARCHAR(500) NOT NULL," +
      "name VARCHAR(255)," +
      "phone VARCHAR(50)," +
      "website VARCHAR(500)," +
      "entry_key VARCHAR(500) UNIQUE," +
      "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
      "INDEX idx_airport (airport)," +
      "INDEX idx_region (region)" +
    ")"
  );
  await conn.end();

  dbPool = mysql.createPool({ ...DB_CONFIG, database: DB_NAME });
  console.log("[DB] Database and table ready.");
}

async function insertLeads(region, leads, airport, keyword, createEntryKey) {
  if (!leads || leads.length === 0) return;
  try {
    var sql = "INSERT IGNORE INTO aviation_leads (region, airport, keyword, name, phone, website, entry_key) VALUES (?, ?, ?, ?, ?, ?, ?)";
    for (var i = 0; i < leads.length; i++) {
      var lead = leads[i];
      var key = createEntryKey(lead);
      await dbPool.execute(sql, [
        region,
        airport,
        keyword,
        lead.name || null,
        lead.phone || null,
        lead.website || null,
        key,
      ]);
    }
  } catch (err) {
    console.log("[DB] Insert error: " + err.message);
  }
}

async function loadSeenKeys() {
  var keys = new Set();
  try {
    var rows = await dbPool.query("SELECT entry_key FROM aviation_leads");
    var rowList = rows[0];
    for (var i = 0; i < rowList.length; i++) {
      if (rowList[i].entry_key) keys.add(rowList[i].entry_key);
    }
    if (keys.size > 0) {
      console.log("[DB] Loaded " + keys.size + " existing leads from database.");
    }
  } catch (err) {
    console.log("[DB] Load error: " + err.message);
  }
  return keys;
}

async function closePool() {
  if (dbPool) await dbPool.end().catch(function() {});
}

module.exports = { initDatabase, insertLeads, loadSeenKeys, closePool };

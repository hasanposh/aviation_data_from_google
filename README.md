# Aviation Company Scraper

A Node.js command-line tool that collects aviation-company leads (name, phone, website) from **Google Maps** using a headless Chromium browser, stores them in a JSON file and a MySQL database, and includes a separate utility for globally deduplicating JSON results.

---

## Table of Contents

1. [Quick start](#quick-start)
2. [Requirements](#requirements)
3. [Installation and setup](#installation-and-setup)
4. [Configuration](#configuration)
5. [Running the scraper](#running-the-scraper)
6. [How the scraper works](#how-the-scraper-works)
7. [Output files](#output-files)
8. [Database schema](#database-schema)
9. [Deduplication / filtering utility](#deduplication--filtering-utility)
10. [File-by-file guide](#file-by-file-guide)
11. [Resume, backup and crash recovery](#resume-backup-and-crash-recovery)
12. [Anti-bot and resilience behavior](#anti-bot-and-resilience-behavior)
13. [Troubleshooting](#troubleshooting)
14. [Known issues and caveats](#known-issues-and-caveats)
15. [Command reference](#command-reference)

---

## Quick start

From the project root (`D:\Freelancer\aviation company scraper`):

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
# (optional) edit .env with your MySQL credentials
node server.js
```

That is it: `node server.js` is the main entry point. Everything else is optional or internal.

> The scraper queries Google Maps hundreds of times, so a full run can take **many hours** (longer if CAPTCHAs or network problems occur). You can stop it at any time with `Ctrl+C`; progress is saved.

---

## Requirements

| Requirement | Details |
| --- | --- |
| Node.js | v18+ (developed on v22.11.0). Uses `fetch` and `AbortSignal.timeout`. |
| npm | v10+ (developed on 10.9.0) |
| Chromium for Playwright | Installed once with `npx playwright install chromium` |
| MySQL / MariaDB | A running server (default `localhost:3306`). The configured user must be allowed to create a database. |
| Internet | Stable connection; Google Maps must be reachable. |

No API keys are needed — Google Maps is scraped through the browser, not through the Maps API.

---

## Installation and setup

### 1. Install Node dependencies

```powershell
npm install
```

Dependencies (from `package.json`):

| Package | Purpose |
| --- | --- |
| `playwright`, `playwright-extra` | Headless Chromium automation |
| `puppeteer-extra-plugin-stealth` | Hides common automation signals from Google |
| `mysql2` | MySQL connection pool (promise API) |
| `dotenv` | Loads `.env` database settings |

### 2. Install the Chromium browser binary

Playwright needs its own browser build:

```powershell
npx playwright install chromium
```

This is only needed once (or after upgrading Playwright). A browser cache already exists on this machine.

### 3. Configure the database

An `.env` file is already present and `.env.example` shows the defaults:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=aviation_scraper
```

- `DB_HOST` — MySQL host (default `localhost`)
- `DB_USER` — MySQL user (default `root`)
- `DB_PASS` — password (empty by default)
- `DB_NAME` — database to create/use (default `aviation_scraper`)

The `.env` file is gitignored. To recreate it on another machine:

```powershell
Copy-Item .env.example .env
```

On startup the scraper automatically creates the database and the `aviation_leads` table if they do not exist.

### 4. Choose what to scrape

Edit `data.js` (see [Configuration](#configuration)). The current configuration searches Albanian airports with ~129 aviation keywords (645 queries total).

---

## Configuration

### Search targets — `data.js`

```js
const REGION = "Wyoming, USA";

const AIRPORTS = [
  { name: "Tirana International Airport Nënë Tereza", code: "TIA" },
  // ...
];

const KEYWORDS = [
  "air charter Albania",
  // ...
];
```

- `REGION` — label stored in MySQL for every lead produced in this run.
- `AIRPORTS` — list of `{ name, code }` objects. `name` is appended to every keyword in the Google Maps search URL.
- `KEYWORDS` — search terms, organized by commented categories (charters, helicopters, seaplanes, flight schools, MRO/FBO, Albanian-language terms, etc.).

Every combination is searched: `keyword + " " + airport`. With 5 airports and 129 keywords, that is **645 queries**.

To search a different region, change all three values and re-run. Keywords already present in `aviation_results.json` are skipped on resume.

### Tuning constants — `scraper.js` (lines 7–21)

These are hard-coded; edit the file to change them:

| Constant | Default | Meaning |
| --- | --- | --- |
| `FILE_NAME` | `aviation_results.json` | Main results file (relative to the current directory) |
| `CONCURRENCY_LIMIT` | `5` | Parallel searches per batch |
| `MIN_DELAY_MS` / `MAX_DELAY_MS` | `2000` / `5000` | Random pause between batches |
| `MAX_QUERY_RETRIES` | `3` | Attempts per query before giving up |
| `RETRY_BASE_MS` | `5000` | Retry backoff base: 5s, 15s, 45s + jitter |
| `CAPTCHA_PAUSE_MS` | `60000` | Pause when a CAPTCHA appears (+ up to 30s random) |
| `NETWORK_ERROR_BATCH_THRESHOLD` | `3` | Network errors in a batch that trigger a long pause |
| `NETWORK_PAUSE_MS` | `75000` | Pause after repeated network errors |
| `CONNECTIVITY_MAX_RETRIES` | `5` | Connectivity checks before exiting |
| `CONNECTIVITY_RETRY_DELAY_MS` | `30000` | Delay between connectivity checks |
| `BROWSER_RELAUNCH_INTERVAL` | `200` | Restart Chromium every 200 queries |
| `MEMORY_LIMIT_BYTES` | 500 MB | Restart Chromium above this RSS memory |
| `FAILED_QUERIES_FILE` | `failed_queries.json` | Persisted list of failed queries |

User agents are randomly rotated from the `USER_AGENTS` array in `server.js` (lines 31–39).

---

## Running the scraper

Always run from the project root, because output paths are relative to the current working directory:

```powershell
node server.js
```

The console shows the stages:

```
Backup created.
[DB] Database and table ready.
Resuming: N unique leads already found.
[DB] Loaded N existing leads from database.
Syncing existing JSON leads to database...
Found N pending search queries.
Checking network connectivity...
  [NET] Connectivity OK.
--- Batch 1/129 (5 queries) [Mem: 180MB] ---
  [SEARCH] air charter Albania Tirana International Airport Nënë Tereza
  [DONE] air charter Albania ...: 3 leads
  ...
✅ Scraping complete! X queries run, Y unique leads found.
```

Stop gracefully with `Ctrl+C` — a `SIGINT` handler saves progress before exiting.

---

## How the scraper works

`server.js` orchestrates the full pipeline (`scrapeGoogleMaps()` at line 72):

1. **Backup** — copies `aviation_results.json` to `aviation_results.json.backup` if the JSON is valid.
2. **Database init** — creates the database/table and a connection pool (`db.js`).
3. **Load progress** — parses `aviation_results.json`; if corrupt, falls back to the backup; if both fail, starts fresh.
4. **Load dedupe keys** — builds a `Set` of existing keys from the JSON **and** the database.
5. **Sync** — inserts any existing JSON leads into MySQL using `INSERT IGNORE`.
6. **Build query list** — every airport × keyword pair that is not already in the JSON, plus any previously failed queries from `failed_queries.json`.
7. **Connectivity check** — exits early (after saving) if Google is unreachable.
8. **Batch loop** — splits queries into groups of 5, runs them in parallel. For each query:
   - new browser context with a random user agent and 1366×768 viewport;
   - blocks image/stylesheet/font/media requests to speed up loading;
   - opens `https://www.google.com/maps/search/<encoded "keyword airport">?hl=en`;
   - detects CAPTCHA iframes and skips the query;
   - extracts details from the Google Maps DOM:
     - name → `.DUwDvf`
     - website → `a[data-item-id="authority"]` (`href`)
     - phone → `button[data-item-id^="phone:tel:"]`
   - handles both single-result pages and multi-result lists (`.hfpxzc` cards, up to 10 per query);
   - skips leads whose dedupe key was already seen.
9. **Save after every batch** — JSON is written atomically (`.tmp` then rename) and new leads are inserted into MySQL.
10. **Adaptive pauses** — CAPTCHA, repeated network errors, browser restart interval/memory threshold, or a random 2–5s delay.
11. **Failed-query retry** — all failures are retried once more with a fresh browser; on success `failed_queries.json` is deleted.
12. **Shutdown** — closes the browser and DB pool, prints totals.

Deduplication key (`createEntryKey`): lowercase name with whitespace removed + digits-only phone, e.g. `acmeaviation-35541234567`. A missing name becomes `noname`, a missing phone becomes `nophone`.

---

## Output files

| File | Format | Description |
| --- | --- | --- |
| `aviation_results.json` | JSON | Main dataset: `{ airport: { keyword: [ { name, website, phone }, ... ] } }` |
| `aviation_results.json.backup` | JSON | Snapshot of the previous run's data, used for recovery |
| `failed_queries.json` | JSON | `[{ "airport": "...", "keyword": "..." }, ...]`; normally `[]` or absent after a clean run |
| `data_filter/cleaned_aviation_results.json` | JSON | Deduplicated dataset produced by `filter.js` |

Example record:

```json
{
  "Tirana International Airport Nënë Tereza": {
    "air charter Albania": [
      {
        "name": "Example Aviation",
        "website": "https://example.com/",
        "phone": "+355 4 123 4567"
      }
    ]
  }
}
```

Empty arrays mean the query ran but returned nothing (or hit a CAPTCHA). Because an entry exists for that airport/keyword, it will **not** be retried in later runs unless it was recorded as a failure.

---

## Database schema

`db.js` creates this table on first run:

```sql
CREATE TABLE IF NOT EXISTS aviation_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(255) NOT NULL,
  airport VARCHAR(255) NOT NULL,
  keyword VARCHAR(500) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(500),
  entry_key VARCHAR(500) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_airport (airport),
  INDEX idx_region (region)
);
```

- `INSERT IGNORE` plus the UNIQUE `entry_key` prevents duplicate leads in MySQL.
- On startup, all `entry_key` values are loaded into memory so already-scraped leads are skipped.

Useful queries:

```sql
USE aviation_scraper;
SELECT COUNT(*) FROM aviation_leads;
SELECT airport, COUNT(*) AS leads FROM aviation_leads GROUP BY airport;
SELECT name, phone, website FROM aviation_leads WHERE keyword LIKE '%helicopter%';
```

---

## Deduplication / filtering utility

`data_filter/filter.js` is a **standalone** script (not part of the scraper). It removes companies that appear more than once anywhere in the input file, keeps only non-empty airports/categories, and writes a cleaned JSON.

```powershell
node data_filter/filter.js
```

**Important:** the input path is hard-coded at line 6 to a client file outside this repository:

```js
const inputPath = path.join(__dirname, "../../../Clients/Aviation company - roger-vasquez/Aviation company/USA/California.json");
```

On this machine that resolves to `D:\Clients\Aviation company - roger-vasquez\Aviation company\USA\California.json`. To process your own results, edit line 6, for example:

```js
const inputPath = path.join(__dirname, "../aviation_results.json");
```

Output always goes to `data_filter/cleaned_aviation_results.json`.

Dedupe key: normalized `name|website`, falling back to `name|phone`, then just `name` (lowercase, collapsed whitespace; website stripped of `http(s)://`, `www.` and trailing slash; phone reduced to digits).

---

## File-by-file guide

| File | Role |
| --- | --- |
| `server.js` | **Main entry point.** Orchestration, browser pages, search loops, retries, signal handlers |
| `scraper.js` | Shared helpers/constants: backup, dedupe key, DOM extraction, saves, network checks, browser launcher |
| `data.js` | Search configuration: `REGION`, `AIRPORTS`, `KEYWORDS` |
| `db.js` | MySQL setup, insert, load keys, close pool |
| `package.json` / `package-lock.json` | Dependencies and lockfile (no npm scripts defined) |
| `.env` / `.env.example` | Database credentials |
| `data_filter/filter.js` | Standalone dedupe utility |
| `prompt.txt` | Historical notes / previous version of the code pasted as a prompt — **not runnable** |
| `backupCode.js` | Archived older scripts concatenated with plain-text separators — **not runnable** (syntax errors) |
| `email-correction.txt` | Plain-text email lists, data only |
| `aviation_results.json` | Current output dataset (~15 MB) |
| `aviation_results.json.backup` | Previous dataset snapshot |
| `failed_queries.json` | Retry queue |

---

## Resume, backup and crash recovery

- **Normal resume:** on every start the JSON is loaded and every airport/keyword that already has a key is skipped. Failed queries are re-queued.
- **Backup:** a valid JSON is copied to `.backup` at startup. If the main file becomes corrupt, the backup is loaded instead.
- **Atomic saves:** writes go to a `.tmp` file and are renamed into place, reducing the risk of a half-written file.
- **Crash handling:** `uncaughtException`, `unhandledRejection`, `exit` and `SIGINT` handlers call `saveData()` with the in-memory data.
- **Database as second source of truth:** existing `entry_key` values from MySQL are also loaded, so leads are not duplicated even if the JSON is reset.

To start completely fresh: delete/rename `aviation_results.json`, its backup, `failed_queries.json`, and truncate the DB table if desired:

```sql
TRUNCATE TABLE aviation_leads;
```

---

## Anti-bot and resilience behavior

- Headless Chromium launched via `playwright-extra` with the stealth plugin.
- `--disable-blink-features=AutomationControlled` and other Chromium flags.
- Random user agents per query, viewport variation fixed at 1366×768.
- Image/CSS/font/media requests blocked for speed.
- Random 2–5s pauses between batches; exponential backoff on failures.
- CAPTCHA detection → 60–90s pause and browser restart.
- Network error detection (`ERR_*`, `net::`) → 75s pause, connectivity check with up to 5 retries × 30s, browser restart.
- Browser restarted every 200 queries or when memory usage exceeds 500 MB.
- Blocked resources and unstable Google Maps CSS selectors mean results can change if Google updates its markup.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot find module ...` | Run `npm install` in the project root |
| Browser launch error / "Executable doesn't exist" | Run `npx playwright install chromium` |
| `[DB] Insert error: ECONNREFUSED` | Start MySQL, check `DB_HOST` / `DB_USER` / `DB_PASS` in `.env` |
| `[DB] ... Access denied` | Grant the user privileges (including `CREATE DATABASE`) or create the database manually |
| `Main file corrupted. Trying backup...` | Inspect `aviation_results.json`; the app falls back to `.backup` automatically. Remove duplicate case-variant keys if using a strict JSON parser |
| Many `[ERROR] ... net::` messages | Check internet/DNS; the script pauses and exits if connectivity stays down |
| Lots of `!!! CAPTCHA !!!` | Wait for the automatic pause, reduce `CONCURRENCY_LIMIT`, or run later from a different network |
| Zero leads but pages load | Google may have changed its CSS selectors — update selectors in `server.js` / `scraper.js` `extractDetails()` |
| Filter script fails with `ENOENT` | Fix the hard-coded `inputPath` in `data_filter/filter.js` (line 6) |
| Script appears stuck | It may be in a 75s network pause, a 60–90s CAPTCHA pause, or connectivity retries (up to ~2.5 min). Check console output |
| Too slow | Lower `MAX_QUERY_RETRIES`, raise `CONCURRENCY_LIMIT` cautiously, or reduce the keyword list in `data.js` |

---

## Known issues and caveats

1. **Config mismatch:** `data.js` sets `REGION = "Wyoming, USA"` while `AIRPORTS` contains Albanian airports. Leads found now will be labeled `Wyoming, USA` in MySQL. Change `REGION` before running if that is wrong.
2. **Old data present:** `aviation_results.json` currently contains US airport data from earlier runs; new Albanian results are appended alongside it and skipped only for exact airport/keyword matches.
3. **Case-variant duplicate JSON keys** (e.g. `Bell helicopter Tennessee` and `Bell Helicopter Tennessee`) exist in the data files. Node's `JSON.parse` accepts them (last one wins), but strict parsers like PowerShell's `ConvertFrom-Json` fail.
4. **`filter.js` depends on a path outside the repo** and will fail on a fresh clone until edited.
5. **`backupCode.js` and `prompt.txt` are not executable** — they are archived material.
6. **No tests, lint or typecheck** are configured. A syntax check can be done with `node --check server.js` (and the same for `scraper.js`, `db.js`, `data.js`, `data_filter/filter.js`).
7. **Google Maps scraping is fragile and may violate terms of service** in some contexts. Use responsibly, keep concurrency low, and respect rate limits.
8. DB pool is only closed on the normal completion path; on forced exits MySQL will close idle connections itself.

---

## Command reference

```powershell
# From D:\Freelancer\aviation company scraper

npm install                      # install Node dependencies (once)
npx playwright install chromium  # install browser binary (once)
Copy-Item .env.example .env      # create DB config (once, if missing)

node server.js                   # run the scraper (main command)
node data_filter/filter.js       # deduplicate a JSON dataset (edit input path first)

node --check server.js           # syntax checks (no test suite exists)
node --check scraper.js
node --check db.js
node --check data.js
node --check data_filter/filter.js
```

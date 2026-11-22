const fs = require("fs");
const { REGION, AIRPORTS, KEYWORDS } = require("./data");
const { initDatabase, insertLeads, loadSeenKeys, closePool } = require("./db");
const {
  FILE_NAME,
  CONCURRENCY_LIMIT,
  CAPTCHA_PAUSE_MS,
  MIN_DELAY_MS,
  MAX_DELAY_MS,
  BROWSER_RELAUNCH_INTERVAL,
  MAX_QUERY_RETRIES,
  RETRY_BASE_MS,
  NETWORK_ERROR_BATCH_THRESHOLD,
  NETWORK_PAUSE_MS,
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
} = require("./scraper");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
];

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
  createBackup();
  await initDatabase();

  let browser = await launchNewBrowser();
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

  const dbKeys = await loadSeenKeys();
  for (const k of dbKeys) seenEntries.add(k);
  console.log(`Total unique leads (JSON + DB): ${seenEntries.size}`);

  console.log("Syncing existing JSON leads to database...");
  for (const air in allData) {
    for (const keyw in allData[air]) {
      if (allData[air][keyw] && allData[air][keyw].length > 0) {
        await insertLeads(REGION, allData[air][keyw], air, keyw, createEntryKey);
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
              userAgent: getRandomUA(USER_AGENTS),
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

    for (const { airport, keyword } of chunk) {
      await insertLeads(REGION, allData[airport]?.[keyword], airport, keyword, createEntryKey);
    }

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
      browser = await launchNewBrowser();
      totalQueriesSinceRelaunch = 0;
    } else if (captchaHitThisBatch) {
      const pauseMs = CAPTCHA_PAUSE_MS + Math.random() * 30000;
      console.log(
        `  CAPTCHA pause: ${Math.round(pauseMs / 1000)}s before next batch...`
      );
      await new Promise((r) => setTimeout(r, pauseMs));

      console.log("  Relaunching browser after CAPTCHA...");
      await browser.close().catch(() => {});
      browser = await launchNewBrowser();
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
      browser = await launchNewBrowser();
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
    browser = await launchNewBrowser();

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
                userAgent: getRandomUA(USER_AGENTS),
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

      for (const { airport, keyword } of chunk) {
        await insertLeads(REGION, allData[airport]?.[keyword], airport, keyword, createEntryKey);
      }

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
        browser = await launchNewBrowser();
      }

      await new Promise((r) => setTimeout(r, MIN_DELAY_MS + Math.random() * 5000));
    }

    clearFailedQueries();
  }

  capturedData = null;
  await browser.close().catch(() => {});
  await closePool();
  console.log(
    `\n\u2705 Scraping complete! ${totalQueriesRun} queries run, ${totalFound} unique leads found.`
  );
}

scrapeGoogleMaps();

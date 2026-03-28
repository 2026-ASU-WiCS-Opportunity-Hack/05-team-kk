#!/usr/bin/env node

/**
 * Page weight monitoring script.
 * Run after `astro build` to check that pages meet the low-bandwidth targets:
 *   - HTML + CSS < 50KB per page
 *   - Total (HTML + CSS + images) < 300KB per page
 *
 * Usage: node scripts/check-page-weight.mjs
 */

import { readdir, stat, readFile } from "node:fs/promises";
import { join, extname, relative } from "node:path";

const DIST_DIR = join(import.meta.dirname, "..", "dist");
const HTML_CSS_LIMIT = 50 * 1024; // 50KB
const TOTAL_LIMIT = 300 * 1024; // 300KB

async function getFilesRecursive(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  let allFiles;
  try {
    allFiles = await getFilesRecursive(DIST_DIR);
  } catch {
    console.log("No dist/ directory found. Run `astro build` first.");
    process.exit(0);
  }

  // Group files by their HTML page
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));
  const cssFiles = allFiles.filter((f) => f.endsWith(".css"));
  const imageExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]);
  const imageFiles = allFiles.filter((f) => imageExts.has(extname(f).toLowerCase()));

  // Calculate total CSS size (shared across all pages)
  let totalCssSize = 0;
  for (const f of cssFiles) {
    const s = await stat(f);
    totalCssSize += s.size;
  }

  // Calculate total image size
  let totalImageSize = 0;
  for (const f of imageFiles) {
    const s = await stat(f);
    totalImageSize += s.size;
  }

  const warnings = [];
  const results = [];

  for (const htmlFile of htmlFiles) {
    const htmlStat = await stat(htmlFile);
    const htmlSize = htmlStat.size;
    const htmlCssSize = htmlSize + totalCssSize;
    const totalSize = htmlCssSize + totalImageSize;
    const pagePath = relative(DIST_DIR, htmlFile);

    const htmlCssOk = htmlCssSize <= HTML_CSS_LIMIT;
    const totalOk = totalSize <= TOTAL_LIMIT;

    results.push({
      page: pagePath,
      html: formatSize(htmlSize),
      css: formatSize(totalCssSize),
      htmlCss: formatSize(htmlCssSize),
      total: formatSize(totalSize),
      htmlCssOk,
      totalOk,
    });

    if (!htmlCssOk) {
      warnings.push(
        `WARNING: ${pagePath} HTML+CSS is ${formatSize(htmlCssSize)} (limit: ${formatSize(HTML_CSS_LIMIT)})`
      );
    }
    if (!totalOk) {
      warnings.push(
        `WARNING: ${pagePath} total is ${formatSize(totalSize)} (limit: ${formatSize(TOTAL_LIMIT)})`
      );
    }
  }

  // Print results table
  console.log("\n--- Page Weight Report ---\n");
  console.log(
    "Page".padEnd(50) +
    "HTML".padStart(10) +
    "CSS".padStart(10) +
    "H+C".padStart(10) +
    "Total".padStart(10) +
    "  Status"
  );
  console.log("-".repeat(105));

  for (const r of results) {
    const status = r.htmlCssOk && r.totalOk ? "OK" : "WARN";
    console.log(
      r.page.padEnd(50) +
      r.html.padStart(10) +
      r.css.padStart(10) +
      r.htmlCss.padStart(10) +
      r.total.padStart(10) +
      `  ${status}`
    );
  }

  console.log(`\nImages: ${imageFiles.length} files, ${formatSize(totalImageSize)} total`);
  console.log(`CSS: ${cssFiles.length} files, ${formatSize(totalCssSize)} total`);
  console.log(`HTML pages: ${htmlFiles.length}\n`);

  if (warnings.length > 0) {
    console.log("--- Warnings ---");
    for (const w of warnings) {
      console.log(w);
    }
    console.log("");
  } else {
    console.log("All pages within weight budget.\n");
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

main().catch(console.error);

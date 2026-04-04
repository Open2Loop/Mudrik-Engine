#!/usr/bin/env node
/**
 * Mudrik — SAIP complete source disclosure bundle generator
 *
 * Does:
 *  1. Full project directory tree (excludes node_modules, .git, .env*, .next, etc.)
 *  2. Concatenates source under app/, components/, lib/, utils/, tests/, supabase/, scripts/
 *  3. Includes root configs (package.json, tailwind, next, tsconfig, middleware, …)
 *  4. Writes Mudrik_Final_SourceCode_For_SAIP.txt with `### File: \`path\`` before each block
 *
 * Usage (from project root):
 *   node scripts/export-saip-source-bundle.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "Mudrik_Final_SourceCode_For_SAIP.txt");

/** Directory names skipped everywhere (tree + file collection). */
const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cursor",
]);

/**
 * Skip root-only artifact folders. Do not exclude route segments like
 * `app/api/proposal/build` (Next.js dynamic/static route folder name).
 */
function isRootOnlyArtifactDir(name, fullRelUnix) {
  if (name === "build" && fullRelUnix === "build") return true;
  if (name === "dist" && fullRelUnix === "dist") return true;
  return false;
}

/** Skip any path segment matching (e.g. .env, .env.local). */
function isExcludedEnvSegment(name) {
  return name === ".env" || name.startsWith(".env.");
}

function shouldSkipDirEntry(name, fullRelUnix) {
  if (EXCLUDED_DIR_NAMES.has(name)) return true;
  if (isRootOnlyArtifactDir(name, fullRelUnix)) return true;
  if (isExcludedEnvSegment(name)) return true;
  return false;
}

const COLLECT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
  ".sql",
]);

/** Top-level dirs to recurse for source (relative to ROOT). */
const SOURCE_ROOT_DIRS = [
  "app",
  "components",
  "lib",
  "utils",
  "tests",
  "supabase",
  "scripts",
];

function shouldSkipJunkFileName(name) {
  return name === ".DS_Store" || name === "Thumbs.db";
}

/** Root-level files to always include if present (relative to ROOT). */
const ROOT_FILES = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.mjs",
  "next.config.js",
  "next.config.ts",
  "tailwind.config.ts",
  "tailwind.config.js",
  "postcss.config.mjs",
  "postcss.config.js",
  "postcss.config.cjs",
  "middleware.ts",
  "vitest.config.ts",
  "next-env.d.ts",
  ".eslintrc.json",
];

function isSafeFile(p) {
  const base = path.basename(p);
  if (base === ".env" || base.startsWith(".env.")) return false;
  return true;
}

function collectFilesUnder(rootAbs, outSet, relPrefix) {
  if (!fs.existsSync(rootAbs)) return;
  const entries = fs.readdirSync(rootAbs, { withFileTypes: true });
  for (const ent of entries) {
    const rel = path.join(relPrefix, ent.name).split(path.sep).join("/");
    if (shouldSkipDirEntry(ent.name, rel)) continue;
    if (shouldSkipJunkFileName(ent.name)) continue;
    const abs = path.join(rootAbs, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) {
      collectFilesUnder(abs, outSet, rel);
    } else if (ent.isFile()) {
      if (!isSafeFile(abs)) continue;
      const ext = path.extname(ent.name);
      if (!COLLECT_EXTENSIONS.has(ext)) continue;
      outSet.add(rel);
    }
  }
}

function fenceLang(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".css": "css",
    ".json": "json",
    ".sql": "sql",
  };
  return map[ext] || "text";
}

function buildDirectoryTreeLines() {
  const lines = [];

  function walk(dirAbs, relDir, depth, prefixes) {
    if (!fs.existsSync(dirAbs)) return;
    let entries = fs.readdirSync(dirAbs, { withFileTypes: true });
    entries = entries.filter((e) => {
      const childRel = relDir ? `${relDir}/${e.name}` : e.name;
      return (
        !shouldSkipDirEntry(e.name, childRel) && !shouldSkipJunkFileName(e.name)
      );
    });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    entries.forEach((ent, i) => {
      const isLast = i === entries.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const nextPrefix = isLast ? "    " : "│   ";
      const name = ent.name;
      const abs = path.join(dirAbs, name);
      const rel = relDir ? `${relDir}/${name}` : name;

      if (ent.isSymbolicLink()) {
        lines.push(prefixes + branch + name + "/ (symlink skipped)");
        return;
      }

      if (ent.isDirectory()) {
        lines.push(prefixes + branch + name + "/");
        walk(abs, rel, depth + 1, prefixes + nextPrefix);
      } else {
        lines.push(prefixes + branch + name);
      }
    });
  }

  const rootName = path.basename(ROOT);
  lines.push(`${rootName}/`);
  walk(ROOT, "", 0, "");
  return lines;
}

function main() {
  const generatedAt = new Date().toISOString();

  const treeLines = buildDirectoryTreeLines();
  const treeBlock = treeLines.join("\n");

  const filePaths = new Set();

  for (const dir of SOURCE_ROOT_DIRS) {
    const abs = path.join(ROOT, dir);
    collectFilesUnder(abs, filePaths, dir);
  }

  for (const rf of ROOT_FILES) {
    const abs = path.join(ROOT, rf);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile() && isSafeFile(abs)) {
      filePaths.add(rf.split(path.sep).join("/"));
    }
  }

  const sortedPaths = [...filePaths].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );

  const sections = [];

  sections.push(`# Mudrik Platform — Complete Source Disclosure Bundle`);
  sections.push(``);
  sections.push(`**Generated (UTC):** ${generatedAt}`);
  sections.push(``);
  sections.push(
    `**Purpose:** Submission support document listing the project structure and full contents of application source and configuration files.`
  );
  sections.push(``);
  sections.push(`**Excluded from this bundle (by design):**`);
  sections.push(
    `- **Required exclusions:** \`node_modules/\`, \`.git/\`, and any \`.env\` / \`.env.*\` files (secrets)`
  );
  sections.push(
    `- **Non-source / cache:** \`.next/\`, \`.turbo/\`, \`.vercel/\`, \`.cursor/\`, and root-only \`build/\` / \`dist/\` (not \`app/api/.../build/\` route folders)`
  );
  sections.push(`- **Junk:** \`.DS_Store\`, \`Thumbs.db\``);
  sections.push(``);
  sections.push(
    `**Included:** \`app/\`, \`components/\`, \`lib/\`, \`utils/\` (if present), \`tests/\`, \`supabase/\`, \`scripts/\`, plus root configuration files listed in the script.`
  );
  sections.push(``);
  sections.push(`---`);
  sections.push(``);
  sections.push(`## 1. Project directory tree`);
  sections.push(``);
  sections.push(`\`\`\`text`);
  sections.push(treeBlock);
  sections.push(`\`\`\``);
  sections.push(``);
  sections.push(`---`);
  sections.push(``);
  sections.push(`## 2. File contents`);
  sections.push(``);
  sections.push(`Each subsection is one file. Paths are relative to the project root.`);
  sections.push(``);

  for (const rel of sortedPaths) {
    const abs = path.join(ROOT, ...rel.split("/"));
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch (e) {
      content = `<< Error reading file: ${e.message} >>`;
    }
    const lang = fenceLang(rel);
    sections.push(`### File: \`${rel}\``);
    sections.push(``);
    sections.push(`\`\`\`${lang}`);
    sections.push(content.replace(/\r\n/g, "\n"));
    sections.push(`\`\`\``);
    sections.push(``);
  }

  const out = sections.join("\n").replace(/\n+$/, "\n");
  fs.writeFileSync(OUTPUT_FILE, out, "utf8");

  console.log(`Wrote ${sortedPaths.length} source files + tree to:`);
  console.log(OUTPUT_FILE);
}

main();

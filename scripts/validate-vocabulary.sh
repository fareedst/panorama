#!/usr/bin/env bash
set -euo pipefail

# [PROC-VOCABULARY_INDEX] [REQ-TIED_SETUP]
# How: validate the client glossary structure and token naming bridges used by
# the TIED pre-read and pre-commit vocabulary touchpoints.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_ROOT="$PROJECT_ROOT" node <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const root = process.env.PROJECT_ROOT;
const vocabRoot = path.join(root, "tied", "vocab");
const glossaryFiles = fs.readdirSync(vocabRoot)
  .filter((file) => file.endsWith(".md"))
  .filter((file) => !["routing.md", "domain-references.md"].includes(file))
  .sort();
const requiredSections = [
  "## Scope",
  "## Traceability",
  "## See also",
  "## Alphabetical index",
];
const indexFiles = [
  path.join(vocabRoot, "routing.md"),
  path.join(vocabRoot, "domain-references.md"),
];
const indexText = indexFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const errors = [];

for (const file of glossaryFiles) {
  const filePath = path.join(vocabRoot, file);
  const text = fs.readFileSync(filePath, "utf8");
  for (const section of requiredSections) {
    if (!text.includes(section)) errors.push(`${file} is missing ${section}`);
  }
  if (!indexText.includes(`(${file})`)) {
    errors.push(`${file} is not registered in the client vocabulary indexes`);
  }

  for (const [, prefix, suffix] of text.matchAll(/\[(REQ|ARCH|IMPL)-([A-Z0-9_]+)\]/g)) {
    const token = `${prefix}-${suffix}`;
    const tokenPath = path.join(root, "tied", {
      req: "requirements",
      arch: "architecture-decisions",
      impl: "implementation-decisions",
    }[prefix.toLowerCase()], `${token}.yaml`);
    if (!fs.existsSync(tokenPath)) errors.push(`${file} references missing ${token}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Vocabulary index validation passed (${glossaryFiles.length} client glossaries).`);
NODE

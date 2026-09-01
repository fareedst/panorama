// [IMPL-ARCHIVE_DIRECTORY_PANES] Test fixture helpers for archive domain tests

import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "node:child_process";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import tar from "tar-stream";

export interface FixturePaths {
  root: string;
  sampleZip: string;
  sampleTar: string;
  sampleTarGz: string;
  unsupported7z: string;
  unsupportedRar: string;
  unsupportedTarBz2: string;
}

async function writeTar(
  filePath: string,
  entries: Array<{ name: string; content?: string; type?: "file" | "directory" | "symlink" }>,
  gzip: boolean,
): Promise<void> {
  const pack = tar.pack();

  for (const entry of entries) {
    if (entry.type === "directory") {
      pack.entry({ name: entry.name.endsWith("/") ? entry.name : `${entry.name}/`, type: "directory" }, () => {});
      continue;
    }
    if (entry.type === "symlink") {
      pack.entry({ name: entry.name, type: "symlink", linkname: entry.content ?? "target" }, () => {});
      continue;
    }
    const body = Buffer.from(entry.content ?? "", "utf8");
    pack.entry({ name: entry.name, size: body.length }, body);
  }

  pack.finalize();

  if (gzip) {
    await pipeline(pack, createGzip(), fs.createWriteStream(filePath));
  } else {
    await pipeline(pack, fs.createWriteStream(filePath));
  }
}

async function writeZip(filePath: string, entries: Array<{ name: string; content: string }>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const root = path.dirname(filePath);
    const staging = path.join(root, "zip-staging");
    fs.mkdirSync(staging, { recursive: true });
    for (const entry of entries) {
      const full = path.join(staging, entry.name);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, entry.content);
    }
    execFile("zip", ["-q", "-r", filePath, "."], { cwd: staging }, (err) => {
      fs.rmSync(staging, { recursive: true, force: true });
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function createArchiveFixtures(): Promise<FixturePaths> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "panorama-archive-fixtures-"));

  const sampleZip = path.join(root, "sample.zip");
  const sampleTar = path.join(root, "sample.tar");
  const sampleTarGz = path.join(root, "sample.tar.gz");
  const unsupported7z = path.join(root, "stub.7z");
  const unsupportedRar = path.join(root, "stub.rar");
  const unsupportedTarBz2 = path.join(root, "stub.tar.bz2");

  await writeZip(sampleZip, [
    { name: "readme.txt", content: "hello zip" },
    { name: "docs/guide.txt", content: "nested" },
    { name: "nested.zip", content: "opaque nested archive bytes" },
  ]);

  await writeTar(
    sampleTar,
    [
      { name: "alpha.txt", content: "tar file" },
      { name: "subdir", type: "directory" },
      { name: "subdir/beta.txt", content: "nested tar" },
      { name: "link", type: "symlink", content: "alpha.txt" },
    ],
    false,
  );

  await writeTar(
    sampleTarGz,
    [
      { name: "gzip.txt", content: "tar gz content" },
      { name: "folder", type: "directory" },
    ],
    true,
  );

  fs.writeFileSync(unsupported7z, "7z stub");
  fs.writeFileSync(unsupportedRar, "rar stub");
  fs.writeFileSync(unsupportedTarBz2, "bz2 stub");

  return {
    root,
    sampleZip,
    sampleTar,
    sampleTarGz,
    unsupported7z,
    unsupportedRar,
    unsupportedTarBz2,
  };
}

export function cleanupArchiveFixtures(fixtures: FixturePaths): void {
  fs.rmSync(fixtures.root, { recursive: true, force: true });
}

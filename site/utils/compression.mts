import * as fs from "node:fs";
import * as path from "node:path";
import { sh } from "./sh.mts";

export async function tarGz(folder: string, dest: string): Promise<void> {
  console.log(`[compress:tar.gz] ${dest}`)
  await sh("tar", ["-czf", dest, `.`], {
    stdio: "inherit",
    cwd: folder,
  });
}

export async function untarGz(
  archive: string,
  dest: string,
  stripComponents?: number,
): Promise<void> {
  console.log(`[extract] ${archive}`)
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  await sh(
    "tar",
    [
      ...(stripComponents ? ["--strip-components", `${stripComponents}`] : []),
      ...["-xzf", archive],
      ...["-C", dest],
    ],
    {
      stdio: "inherit",
    },
  );
}

export async function tarXz(folder: string, dest: string): Promise<void> {
  console.log(`[compress:tar.xz] ${dest}`)
  await sh("tar", ["-cJf", dest, `.`], {
    stdio: "inherit",
    cwd: folder,
  });
}

export async function untarXz(
  archive: string,
  dest: string,
  stripComponents?: number,
): Promise<void> {
  console.log(`[extract] ${archive}`)
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  await sh(
    "tar",
    [
      ...(stripComponents ? ["--strip-components", `${stripComponents}`] : []),
      ...["-xJf", archive],
      ...["-C", dest],
    ],
    {
      stdio: "inherit",
    },
  );
}

export async function zip(folder: string, dest: string): Promise<void> {
  console.log(`[compress:zip] ${dest}`)
  await sh("zip", ["-q", "-r", dest, `.`], {
    stdio: "inherit",
    cwd: folder,
  });
}

export async function unzip(
  archive: string,
  dest: string,
  stripComponents?: number,
): Promise<void> {
  console.log(`[extract] ${archive}`)
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  await sh("unzip", ["-q", archive], {
    stdio: "inherit",
    cwd: dest,
  });
  if (stripComponents) {
    for (const entry of await fs.promises.readdir(dest)) {
      for (const inner of await fs.promises.readdir(path.join(dest, entry))) {
        await fs.promises.rename(
          path.join(dest, entry, inner),
          path.join(dest, inner),
        );
      }
      await fs.promises.rm(path.join(dest, entry), { recursive: true });
    }
  }
}

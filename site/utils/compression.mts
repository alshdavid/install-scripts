import * as fs from "node:fs";
import * as child_process from "node:child_process";
import * as zlib from "node:zlib";
import { sh } from "./sh.mts";

export async function tarGz(folder: string, dest: string): Promise<void> {
  await sh("tar", ["-czf", `"${dest}"`, `.`], {
    stdio: "inherit",
    cwd: folder,
  });
}

export async function untarGz(archive: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  await sh("tar", ["-xzf", `"${archive}"`, "-C", `"${dest}"`], {
    shell: true,
    stdio: "inherit",
  });
}

export async function tarXz(folder: string, dest: string): Promise<void> {
  await sh("tar", ["-cJf", `"${dest}"`, `.`], {
    stdio: "inherit",
    cwd: folder,
  });
}

export async function untarXz(archive: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  await sh("tar", ["-xzf", `"${archive}"`, "-C", `"${dest}"`], {
    shell: true,
    stdio: "inherit",
  });
}

export async function zip(folder: string, dest: string): Promise<void> {
   await sh("zip", ["-r", `"${dest}"`, `.`], {
    stdio: "inherit",
    cwd: folder,
  });
}

export async function unzip(archive: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  await sh("unzip", [`"${archive}"`, "-d", `"${dest}"`], {
    shell: true,
    stdio: "inherit",
  });
}

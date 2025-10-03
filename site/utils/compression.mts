import * as fs from "node:fs";
import * as child_process from "node:child_process";
import * as zlib from "node:zlib";

export async function tarGz() {}

export async function untarGz(archive: string, dest: string) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest);
  const child = child_process.spawn(
    "tar",
    ["-xzf", `"${archive}"`, "-C", `"${dest}"`],
    {
      shell: true,
      stdio: "inherit",
    }
  );

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

export async function tarXz(folder: string, dest: string) {
  const child = child_process.spawn("tar", ["-cJf", `"${dest}"`, `.`], {
    shell: true,
    stdio: "inherit",
    cwd: folder,
  });

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

export async function untarXz() {}

export async function unzip() {}

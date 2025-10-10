import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as ejs from "ejs";
import * as prettier from "prettier";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);
const dist = path.join(root, "dist");

export async function main() {
  for (const file of await fs.promises.readdir(path.join(root, "sh"))) {
    await fs.promises.cp(path.join(root, "sh", file), path.join(dist, file));
  }

  for (const file of await fs.promises.readdir(path.join(root, "ps1"))) {
    await fs.promises.cp(path.join(root, "ps1", file), path.join(dist, file));
  }

  await fs.promises.cp(path.join(root, "assets"), path.join(dist, "assets"), {
    recursive: true,
  });
}

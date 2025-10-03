import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as githubApi from "./utils/github.mts";
import * as nodejsApi from "./utils/nodejs.mts";
import { wget } from "./utils/wget.mts";
import { tarXz, untarGz } from "./utils/compression.mts";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);
const mirror = path.join(root, "dist", "mirror");
const tmpRoot = path.join(root, "tmp");

const index: Record<string, string> = {};

export async function main() {
  if (fs.existsSync(tmpRoot)) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpRoot);

  if (!fs.existsSync(mirror)) {
    fs.mkdirSync(mirror, { recursive: true });
  }

  await Promise.all([just()]);

  // Generate index
  await fs.promises.writeFile(
    path.join(mirror, "index.json"),
    JSON.stringify(index, null, 2),
    "utf8"
  );

  let index_html = ``;
  for (const [key, value] of Object.entries(index)) {
    index_html += `<a style="display:block" href="${value}">${key}</a>\n`;
  }

  await fs.promises.writeFile(
    path.join(mirror, "index.html"),
    index_html,
    "utf8"
  );
}

export async function just() {
  const project = "just";
  const resp = await githubApi.getRelease("casey/just");
  const version = resp.tag_name;
  // const downloads = {
  //   ['linux-amd64']:    `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-unknown-linux-musl.tar.gz`,
  //   ['linux-arm64']:    `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-unknown-linux-musl.tar.gz`,
  //   ['macos-amd64']:    `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-apple-darwin.tar.gz`,
  //   ['macos-arm64']:    `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-apple-darwin.tar.gz`,
  //   ['windows-amd64']:  `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-pc-windows-msvc.zip`,
  //   ['windows-arm64']:  `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-pc-windows-msvc.zip`,
  // }

  index[`${project}-latest-linux-amd64.tar.gz`] =
    `${project}-latest-linux-amd64.tar.gz`;

  index[`${project}-latest-linux-amd64.tar.xz`] =
    `${project}-latest-linux-amd64.tar.xz`;

  await wget(
    `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-unknown-linux-musl.tar.gz`,
    path.join(mirror, `${project}-latest-linux-amd64.tar.gz`)
  );

  await untarGz(
    path.join(mirror, `${project}-latest-linux-amd64.tar.gz`),
    path.join(tmpRoot, `${project}-latest-linux-amd64`)
  );

  await tarXz(
    path.join(tmpRoot, `${project}-latest-linux-amd64`),
    path.join(mirror, `${project}-latest-linux-amd64.tar.xz`)
  );

  await fs.promises.rm(path.join(tmpRoot, `${project}-latest-linux-amd64`), { recursive: true , force: true })

  console.log(`${project}: ${version}`);
}

import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as githubApi from "./utils/github.mts";
import { wget } from "./utils/wget.mts";
import {
  tarGz,
  tarXz,
  untarGz,
  untarXz,
  unzip,
  zip,
} from "./utils/compression.mts";
import type { ArchiveFormat, OsArch } from "./utils/types.mts";

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

  const downloads: Array<[OsArch, ArchiveFormat, string]> = [
    [
      "linux-amd64",
      "tar.gz",
      `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-unknown-linux-musl.tar.gz`,
    ],
    [
      "linux-arm64",
      "tar.gz",
      `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-unknown-linux-musl.tar.gz`,
    ],
    [
      "macos-amd64",
      "tar.gz",
      `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-apple-darwin.tar.gz`,
    ],
    [
      "macos-arm64",
      "tar.gz",
      `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-apple-darwin.tar.gz`,
    ],
    [
      "windows-amd64",
      "zip",
      `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-pc-windows-msvc.zip`,
    ],
    [
      "windows-arm64",
      "zip",
      `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-pc-windows-msvc.zip`,
    ],
  ];

  for (const [os_arch, format, url] of downloads) {
    await recompress(url, format, project, os_arch, "latest");
  }

  console.log(`${project}: ${version}`);
}

async function recompress(
  url: string,
  format: ArchiveFormat,
  project: string,
  os_arch: OsArch,
  version: string
): Promise<void> {
  const inputName = `${project}-${version}-${os_arch}`;
  const inputArchive = `${project}-${version}-${os_arch}.${format}`;
  await wget(url, path.join(mirror, inputArchive));

  switch (format) {
    case "tar.gz":
      await untarGz(
        path.join(mirror, inputArchive),
        path.join(tmpRoot, inputName)
      );
      break;
    case "tar.xz":
      await untarXz(
        path.join(mirror, inputArchive),
        path.join(tmpRoot, inputName)
      );
      break;
    case "zip":
      await unzip(
        path.join(mirror, inputArchive),
        path.join(tmpRoot, inputName)
      );
    case "bin":
      await fs.promises.mkdir(path.join(tmpRoot, inputName), {
        recursive: true,
      });
      await fs.promises.cp(
        path.join(mirror, inputArchive),
        path.join(tmpRoot, inputName, inputName)
      );
      break;
    default:
      throw new Error(`ArchiveFormat not supported: ${format}`);
  }

  index[`${inputName}.tar.xz`] = `${inputName}.tar.xz`;
  await tarXz(
    path.join(tmpRoot, inputName),
    path.join(mirror, `${inputName}.tar.xz`)
  );

  index[`${inputName}.tar.gz`] = `${inputName}.tar.gz`;
  await tarGz(
    path.join(tmpRoot, inputName),
    path.join(mirror, `${inputName}.tar.gz`)
  );

  index[`${inputName}.zip`] = `${inputName}.zip`;
  await zip(
    path.join(tmpRoot, inputName),
    path.join(mirror, `${inputName}.zip`)
  );
}

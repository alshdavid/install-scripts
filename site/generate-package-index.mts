import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as githubApi from "./utils/github.mts";
import * as nodejsApi from "./utils/nodejs.mts";

import { getReleases, type GithubReleasesResponse } from "./utils/github.mts";
import type { Arch, ArchiveFormat, Os, ReleaseMeta } from "./utils/types.mts";
import { sortEntries } from "./repackage-versions/infer-format.mts";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);
const dir_versions = path.join(root, "dist", "versions");

type VersionIndex = Record<
  string,
  Record<
    string,
    {
      package: string;
      version: string;

      linux_amd64_tar_gz?: string;
      linux_amd64_tar_xz?: string;
      linux_amd64_zip?: string;

      linux_arm64_tar_gz?: string;
      linux_arm64_tar_xz?: string;
      linux_arm64_zip?: string;

      macos_amd64_tar_gz?: string;
      macos_amd64_tar_xz?: string;
      macos_amd64_zip?: string;

      macos_arm64_tar_gz?: string;
      macos_arm64_tar_xz?: string;
      macos_arm64_zip?: string;

      windows_amd64_tar_gz?: string;
      windows_amd64_tar_xz?: string;
      windows_amd64_zip?: string;

      windows_arm64_tar_gz?: string;
      windows_arm64_tar_xz?: string;
      windows_arm64_zip?: string;
    }
  >
>;

function findDownload(
  release: GithubReleasesResponse[0],
  os: Os,
  arch: Arch,
  kind: ArchiveFormat,
): string | undefined {
  for (const asset of release.assets) {
    if (
      asset.browser_download_url.includes(os) &&
      asset.browser_download_url.includes(arch) &&
      asset.browser_download_url.endsWith(kind)
    ) {
      return asset.browser_download_url;
    }
  }
}

export async function main() {
  if (fs.existsSync(dir_versions)) {
    fs.rmSync(dir_versions, { recursive: true, force: true });
  }
  fs.mkdirSync(dir_versions);

  const index: VersionIndex = {};

  const releases = await getReleases("alshdavid/install-scripts");

  for (const release of releases) {
    if (!release.body) {
      continue;
    }

    const meta: ReleaseMeta = JSON.parse(release.body);
    index[meta.package] = index[meta.package] || {};

    index[meta.package][meta.version] = {
      package: meta.package,
      version: meta.version,

      linux_amd64_tar_gz: findDownload(release, "linux", "amd64", "tar.gz"),
      linux_amd64_tar_xz: findDownload(release, "linux", "amd64", "tar.xz"),
      linux_amd64_zip: findDownload(release, "linux", "amd64", "zip"),

      linux_arm64_tar_gz: findDownload(release, "linux", "arm64", "tar.gz"),
      linux_arm64_tar_xz: findDownload(release, "linux", "arm64", "tar.xz"),
      linux_arm64_zip: findDownload(release, "linux", "arm64", "zip"),

      macos_amd64_tar_gz: findDownload(release, "macos", "amd64", "tar.gz"),
      macos_amd64_tar_xz: findDownload(release, "macos", "amd64", "tar.xz"),
      macos_amd64_zip: findDownload(release, "macos", "amd64", "zip"),

      macos_arm64_tar_gz: findDownload(release, "macos", "arm64", "tar.gz"),
      macos_arm64_tar_xz: findDownload(release, "macos", "arm64", "tar.xz"),
      macos_arm64_zip: findDownload(release, "macos", "arm64", "zip"),

      windows_amd64_tar_gz: findDownload(release, "windows", "amd64", "tar.gz"),
      windows_amd64_tar_xz: findDownload(release, "windows", "amd64", "tar.xz"),
      windows_amd64_zip: findDownload(release, "windows", "amd64", "zip"),

      windows_arm64_tar_gz: findDownload(release, "windows", "arm64", "tar.gz"),
      windows_arm64_tar_xz: findDownload(release, "windows", "arm64", "tar.xz"),
      windows_arm64_zip: findDownload(release, "windows", "arm64", "zip"),
    };
  }

  const sorted = sortObject(index);
  for (const key in sorted) {
    sorted[key] = sortObject(sorted[key], true);
  }

  await fs.promises.writeFile(
    path.join(dir_versions, "index.json"),
    JSON.stringify(sorted, null, 2),
    "utf8",
  );

  for (const [packageName, versions] of Object.entries(sorted)) {
    if (!fs.existsSync(path.join(dir_versions, packageName))) {
      await fs.promises.writeFile(
        path.join(dir_versions, `${packageName}.json`),
        JSON.stringify(versions, null, 2),
        "utf8",
      );

      for (const version of Object.values(versions)) {
        await fs.promises.writeFile(
          path.join(dir_versions, `${version.package}-${version.version}.json`),
          JSON.stringify(version, null, 2),
          "utf8",
        );
      }
    }
  }
}

function sortObject<T extends Object>(input: T, reverse: boolean = false): T {
  const keys = Object.keys(input).sort(sortEntries);

  if (reverse) {
    keys.reverse();
  }

  return keys.reduce((acc, key) => {
    acc[key as keyof T] = input[key as keyof T];
    return acc;
  }, {} as T);
}

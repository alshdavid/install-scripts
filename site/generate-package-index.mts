import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as githubApi from "./utils/github.mts";
import * as nodejsApi from "./utils/nodejs.mts";

import { getReleases, type GithubReleasesResponse } from "./utils/github.mts";
import type { Arch, ArchiveFormat, Os, ReleaseMeta } from "./utils/types.mts";
import {
  sortEntries,
  tryParseSemver,
} from "./repackage-versions/infer-format.mts";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);
const dir_versions = path.join(root, "dist", "packages");

type VersionEntry = {
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
};

type VersionIndex = Record<string, Record<string, VersionEntry>>;

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

  // Sort packages alphabetically
  const sorted = sortObject(index);
  // Sort versions by semver or alphabetically, newest semver version at [0]
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
    }
  }

  // Semver Majors
  for (const versions of Object.values(sorted)) {
    for (const version of Object.values(versions)) {
      const sv = tryParseSemver(version.version);
      if (!sv) {
        break;
      }
      await fs.promises.mkdir(path.join(dir_versions, version.package), {
        recursive: true,
      });

      await fs.promises.writeFile(
        path.join(dir_versions, version.package, `${version.version}.json`),
        JSON.stringify(version, null, 2),
        "utf8",
      );

      await createVersionTexts(version);

      if (
        !fs.existsSync(
          path.join(dir_versions, version.package, `${sv.major}.json`),
        )
      ) {
        await fs.promises.writeFile(
          path.join(dir_versions, version.package, `${sv.major}.json`),
          JSON.stringify(version, null, 2),
          "utf8",
        );
        await createVersionTexts(version, `${sv.major}`);
      }

      if (
        !fs.existsSync(path.join(dir_versions, version.package, `latest.json`))
      ) {
        await fs.promises.writeFile(
          path.join(dir_versions, version.package, `latest.json`),
          JSON.stringify(version, null, 2),
          "utf8",
        );
        await createVersionTexts(version, `latest`);
      }
    }
  }

  // Semver Minors
  for (const versions of Object.values(sorted)) {
    for (const version of Object.values(versions)) {
      const sv = tryParseSemver(version.version);
      if (!sv) {
        break;
      }
      if (
        !fs.existsSync(
          path.join(
            dir_versions,
            version.package,
            `${sv.major}.${sv.minor}.json`,
          ),
        )
      ) {
        await fs.promises.writeFile(
          path.join(
            dir_versions,
            version.package,
            `${sv.major}.${sv.minor}.json`,
          ),
          JSON.stringify(version, null, 2),
          "utf8",
        );
        await createVersionTexts(version, `${sv.major}.${sv.minor}`);
      }
    }
  }

  // Non Semver
  for (const versions of Object.values(sorted)) {
    for (const version of Object.values(versions)) {
      if (tryParseSemver(version.version)) {
        break;
      }
      await fs.promises.mkdir(path.join(dir_versions, version.package), {
        recursive: true,
      });

      await fs.promises.writeFile(
        path.join(dir_versions, version.package, `${version.version}.json`),
        JSON.stringify(version, null, 2),
        "utf8",
      );
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

async function createVersionTexts(version: VersionEntry, name?: string) {
  for (const [key, value] of Object.entries(version)) {
    if ((!key.includes("_tar") && !key.includes("_zip")) || !value) {
      continue;
    }
    await fs.promises.writeFile(
      path.join(
        dir_versions,
        version.package,
        `${name || version.version}_${key}`,
      ),
      version[key],
      "utf8",
    );
    await fs.promises.writeFile(
      path.join(
        dir_versions,
        version.package,
        `${name || version.version}_${key}.txt`,
      ),
      version[key],
      "utf8",
    );
  }
}

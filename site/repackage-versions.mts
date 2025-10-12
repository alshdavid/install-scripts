/*
  The objective of this script is to generate normalized distributable
  archives of known packages (node, python, etc) and upload them 
  as Github Releases to act as mirrors for the originals.
  
  This is done by;
  - Looking up the latest versions of a project
  - Temporarily downloading & recompress a project to tar.gz, tar.xz and zip
  - Uploading it to a Github Release with the tag being the "$PROJECT_NAME-$PROJECT_VERSION"

*/
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as githubApi from "./utils/github.mts";
import type { Arch, ArchiveFormat, Os } from "./utils/types.mts";
import { releaseExists } from "./repackage-versions/release-exists.mts";
import * as nodejsApi from "./utils/nodejs.mts";
import { recompress } from "./repackage-versions/recompress.mts";
import {
  githubReleaseCreate,
  githubReleaseDelete,
  githubReleaseEdit,
  githubReleaseUpload,
} from "./utils/github-releases.mts";
import {
  inferArchiveFormat,
  sortEntries,
} from "./repackage-versions/infer-format.mts";
import { renderEjs } from "./utils/render-ejs.mts";

const REPO = "alshdavid/install-scripts";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);
const tmpRoot = path.join(root, "tmp");
const tmpDownloads = path.join(root, "tmp", "downloads");

type DownloadManifestEntry = {
  project: string;
  version: string;
  format?: ArchiveFormat;
  url: string;
  os: Os;
  arch: Arch;
  stripComponents?: number;
};

type DownloadManifest = Record<string, Array<DownloadManifestEntry>>;

export async function main() {
  if (fs.existsSync(tmpRoot)) {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
  }
  await fs.promises.mkdir(tmpDownloads, { recursive: true });

  const downloadManifest: DownloadManifest = {};

  await Promise.all([
    deno(downloadManifest),
    just(downloadManifest),
    terraform(downloadManifest),
    go(downloadManifest),
    nodejs(downloadManifest),
    python(downloadManifest),
    vultrCli(downloadManifest),

    // alshdavid projects
    http_server_rs(downloadManifest),
    rrm(downloadManifest),
    flatDir(downloadManifest),
  ]);

  const downloadManifestEntries = Object.entries(downloadManifest);
  downloadManifestEntries.sort((a, b) => sortEntries(a[0], b[0]));

  const doneShellScripts = new Set<string>();

  for (const [releaseName, downloads] of downloadManifestEntries) {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
    await fs.promises.mkdir(tmpDownloads, { recursive: true });

    if (!downloads.length) {
      console.log(`[${releaseName}] SKIP: No downloads`);
      continue
    }

    const packageName = downloads[0]?.project;
    const packageVersion = downloads[0]?.version;


    if (!doneShellScripts.has(packageName)) {
      doneShellScripts.add(packageName);
      await renderEjs({
        inputFile: path.join(dirname, "templates", "install.sh"),
        outputFile: path.join(root, "dist", `${packageName}.sh`),
        packageName,
        PACKAGE_NAME: packageName.toUpperCase().replaceAll('-', '_'),
        package_name: packageName.replaceAll('-', '_'),
      });
    }

    if (await releaseExists(REPO, releaseName)) {
      console.log(`[${releaseName}] SKIP: Release Exists`);
      continue;
    }

    console.log(`\n[${releaseName}] START`);


    const files: Array<{
      project: string
      version: string
      os: string
      arch: string
      tar_gz: string
      tar_xz: string
      zip: string
    }> = []

    for (const {
      project,
      version,
      os,
      arch,
      format,
      url,
      stripComponents,
    } of downloads) {
      const success = await recompress(
        tmpRoot,
        tmpDownloads,
        url,
        format || inferArchiveFormat(url),
        project,
        `${os}-${arch}`,
        version,
        stripComponents,
      );
      if (!success) {
        console.log(`[${releaseName}] SKIP_DOWNLOAD: ${url}`);
        continue;
      }

      files.push({
        project,
        version,
        os,
        arch,
        tar_gz: path.join(tmpRoot, `${project}-${version}-${os}-${arch}.tar.gz`),
        tar_xz: path.join(tmpRoot, `${project}-${version}-${os}-${arch}.tar.xz`),
        zip: path.join(tmpRoot, `${project}-${version}-${os}-${arch}.zip`),
      })
    }

    if (!files.length) {
      console.log(`[${releaseName}] SKIP_RELEASE: No files`)
      continue
    }

    try {
      console.log(`[${releaseName}] CREATE_RELEASE`);
      await githubReleaseCreate({
        repo: REPO,
        title: releaseName,
        tag: releaseName,
        draft: true,
        notes: JSON.stringify({
          package: packageName,
          version: packageVersion,
        }),
      });

      for (const {
        project,
        version,
        os,
        arch,
        tar_gz,
        tar_xz,
        zip,
      } of files) {
        console.log(
          `[${releaseName}] UPLOAD_RELEASE: ${project}-${version}-${os}-${arch}.tar.gz`,
        );
        await githubReleaseUpload({
          repo: REPO,
          tag: releaseName,
          file: tar_gz
        });

        console.log(
          `[${releaseName}] UPLOAD_RELEASE: ${project}-${version}-${os}-${arch}.tar.xz`,
        );
        await githubReleaseUpload({
          repo: REPO,
          tag: releaseName,
          file: tar_xz
        });

        console.log(
          `[${releaseName}] UPLOAD_RELEASE: ${project}-${version}-${os}-${arch}.zip`,
        );
        await githubReleaseUpload({
          repo: REPO,
          tag: releaseName,
          file: zip
        });
      }

      console.log(`[${releaseName}] PUBLISH_RELEASE`);
      await githubReleaseEdit({
        repo: REPO,
        tag: releaseName,
        draft: false,
      });
      console.log(`[${releaseName}] DONE`);
    } catch (error) {
      console.log(`[${releaseName}] ===== FAILED =====`);
      console.log({ error });
      await githubReleaseDelete({
        repo: REPO,
        tag: releaseName,
      });
      process.exit(1)
    }
  }
}

async function deno(manifest: DownloadManifest): Promise<void> {
  const project = "deno";
  const resp = await githubApi.getRelease("denoland/deno");
  const version = resp.tag_name.replace("v", "");

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64',   url: `https://github.com/denoland/deno/releases/download/v${version}/deno-x86_64-unknown-linux-gnu.zip`   },
    { project, version, os: 'linux',    arch:  'arm64',   url: `https://github.com/denoland/deno/releases/download/v${version}/deno-aarch64-unknown-linux-gnu.zip`  },
    { project, version, os: 'macos',    arch:  'amd64',   url: `https://github.com/denoland/deno/releases/download/v${version}/deno-x86_64-apple-darwin.zip`        },
    { project, version, os: 'macos',    arch:  'arm64',   url: `https://github.com/denoland/deno/releases/download/v${version}/deno-aarch64-apple-darwin.zip`       },
    { project, version, os: 'windows',  arch:  'amd64',   url: `https://github.com/denoland/deno/releases/download/v${version}/deno-x86_64-pc-windows-msvc.zip`     },
  ]
}

async function just(manifest: DownloadManifest): Promise<void> {
  const project = "just";
  const resp = await githubApi.getRelease("casey/just");
  const version = resp.tag_name;

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64',    url: `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-unknown-linux-musl.tar.gz`  },
    { project, version, os: 'linux',    arch:  'arm64',    url: `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-unknown-linux-musl.tar.gz` },
    { project, version, os: 'macos',    arch:  'amd64',    url: `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-apple-darwin.tar.gz`        },
    { project, version, os: 'macos',    arch:  'arm64',    url: `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-apple-darwin.tar.gz`       },
    { project, version, os: 'windows',  arch:  'amd64',       url: `https://github.com/casey/just/releases/download/${version}/just-${version}-x86_64-pc-windows-msvc.zip`        },
    { project, version, os: 'windows',  arch:  'arm64',       url: `https://github.com/casey/just/releases/download/${version}/just-${version}-aarch64-pc-windows-msvc.zip`       },
  ]
}

async function terraform(manifest: DownloadManifest): Promise<void> {
  const project = "terraform";
  const resp = await githubApi.getRelease("hashicorp/terraform");
  const version = resp.tag_name.replace("v", "");

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64',    url: `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_linux_amd64.zip`   },
    { project, version, os: 'linux',    arch:  'arm64',    url: `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_linux_arm64.zip`   },
    { project, version, os: 'macos',    arch:  'amd64',    url: `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_darwin_amd64.zip`  },
    { project, version, os: 'macos',    arch:  'arm64',    url: `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_darwin_arm64.zip`  },
    { project, version, os: 'windows',  arch:  'amd64',       url: `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_windows_amd64.zip` },
  ]
}

async function go(manifest: DownloadManifest): Promise<void> {
  const project = "go";
  const resp = await globalThis.fetch("https://go.dev/dl/?mode=json");
  const body = await resp.json();
  const version = body[0].version.replace("go", "");

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64', url: `https://go.dev/dl/go${version}.linux-amd64.tar.gz`,   stripComponents: 1  },
    { project, version, os: 'linux',    arch:  'arm64', url: `https://go.dev/dl/go${version}.linux-arm64.tar.gz`,   stripComponents: 1  },
    { project, version, os: 'macos',    arch:  'amd64', url: `https://go.dev/dl/go${version}.darwin-amd64.tar.gz`,  stripComponents: 1  },
    { project, version, os: 'macos',    arch:  'arm64', url: `https://go.dev/dl/go${version}.darwin-arm64.tar.gz`,  stripComponents: 1  },
    { project, version, os: 'windows',  arch:  'amd64', url: `https://go.dev/dl/go${version}.windows-amd64.zip`,    stripComponents: 1  },
    { project, version, os: 'windows',  arch:  'arm64', url: `https://go.dev/dl/go${version}.windows-arm64.zip`,    stripComponents: 1  },
  ]
}

async function nodejs(manifest: DownloadManifest): Promise<void> {
  const project = "nodejs";
  const resp = await nodejsApi.getReleases();

  const allVersions: Record<string, Array<string>> = {};

  // // Get all versions of Nodejs
  // for (const release of resp) {
  //   const version = release.version.replace("v", "");
  //   const [major, minor, patch] = version.split('.')
  //   const majorInt = parseInt(major, 10)
  //   if (majorInt < 18) continue
    
  //   // prettier-ignore
  //   manifest[`${project}-${version}`] = [
  //     { project, version, os: 'linux',    arch:  'amd64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-linux-x64.tar.gz`,     stripComponents: 1 },
  //     { project, version, os: 'linux',    arch:  'arm64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-linux-arm64.tar.gz`,   stripComponents: 1 },
  //     { project, version, os: 'macos',    arch:  'amd64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-darwin-x64.tar.gz`,    stripComponents: 1 },
  //     { project, version, os: 'macos',    arch:  'arm64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-darwin-arm64.tar.gz`,  stripComponents: 1 },
  //     { project, version, os: 'windows',  arch:  'amd64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-win-x64.zip`,          stripComponents: 1 },
  //     { project, version, os: 'windows',  arch:  'arm64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-win-arm64.zip`,        stripComponents: 1 },
  //   ]
  // }

  // Get the latest release of the last 7 major releases
  for (const release of resp) {
    const version = release.version.replace("v", "");
    const [major, minor] = version.split(".");
    const key = `${major}`;
    allVersions[key] = allVersions[key] || [];
    if (allVersions[key].length >= 1) {
      continue;
    }
    allVersions[key].push(version);
  }

  const allVersionsEntries = Object.entries(allVersions);
  allVersionsEntries.sort((a, b) => sortEntries(`${a[0]}.0.0`, `${b[0]}.0.0`));
  const versions = [
    allVersionsEntries.pop(),
    allVersionsEntries.pop(),
    allVersionsEntries.pop(),
    allVersionsEntries.pop(),
    allVersionsEntries.pop(),
    allVersionsEntries.pop(),
    allVersionsEntries.pop(),
  ];

  for (const [_, minorVersions] of versions) {
    for (const version of minorVersions) {
      // prettier-ignore
      manifest[`${project}-${version}`] = [
        { project, version, os: 'linux',    arch:  'amd64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-linux-x64.tar.gz`,     stripComponents: 1 },
        { project, version, os: 'linux',    arch:  'arm64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-linux-arm64.tar.gz`,   stripComponents: 1 },
        { project, version, os: 'macos',    arch:  'amd64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-darwin-x64.tar.gz`,    stripComponents: 1 },
        { project, version, os: 'macos',    arch:  'arm64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-darwin-arm64.tar.gz`,  stripComponents: 1 },
        { project, version, os: 'windows',  arch:  'amd64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-win-x64.zip`,          stripComponents: 1 },
        { project, version, os: 'windows',  arch:  'arm64', url: `https://nodejs.org/download/release/v${version}/node-v${version}-win-arm64.zip`,        stripComponents: 1 },
      ]
    }
  }
}

async function http_server_rs(manifest: DownloadManifest): Promise<void> {
  const project = "http-server-rs";
  const resp = await githubApi.getRelease(`alshdavid/${project}`);
  const version = resp.tag_name;

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-linux-amd64.tar.gz`   },
    { project, version, os: 'linux',    arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-linux-arm64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-macos-amd64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-macos-arm64.tar.gz`   },
    { project, version, os: 'windows',  arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-windows-amd64.tar.gz` },
    { project, version, os: 'windows',  arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-windows-arm64.tar.gz` },
  ]
}

async function rrm(manifest: DownloadManifest): Promise<void> {
  const project = "rrm";
  const resp = await githubApi.getRelease(`alshdavid/${project}`);
  const version = resp.tag_name;

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-linux-amd64.tar.gz`   },
    { project, version, os: 'linux',    arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-linux-arm64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-macos-amd64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-macos-arm64.tar.gz`   },
    { project, version, os: 'windows',  arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-windows-amd64.tar.gz` },
    { project, version, os: 'windows',  arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-windows-arm64.tar.gz` },
  ]
}

async function flatDir(manifest: DownloadManifest): Promise<void> {
  const project = "flatdir";
  const resp = await githubApi.getRelease(`alshdavid/${project}`);
  const version = resp.tag_name;

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-linux-amd64.tar.gz`   },
    { project, version, os: 'linux',    arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-linux-arm64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-macos-amd64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-macos-arm64.tar.gz`   },
    { project, version, os: 'windows',  arch:  'amd64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-windows-amd64.tar.gz` },
    { project, version, os: 'windows',  arch:  'arm64', url: `https://github.com/alshdavid/${project}/releases/download/${version}/${project}-windows-arm64.tar.gz` },
  ]
}

async function vultrCli(manifest: DownloadManifest): Promise<void> {
  const project = "vultr-cli";
  const resp = await githubApi.getRelease("vultr/vultr-cli");
  const version = resp.tag_name.replace("v", "");

  // prettier-ignore
  manifest[`${project}-${version}`] = [
    { project, version, os: 'linux',    arch:  'amd64', url: `https://github.com/vultr/vultr-cli/releases/download/v${version}/vultr-cli_v${version}_linux_amd64.tar.gz`   },
    { project, version, os: 'linux',    arch:  'arm64', url: `https://github.com/vultr/vultr-cli/releases/download/v${version}/vultr-cli_v${version}_linux_arm64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'amd64', url: `https://github.com/vultr/vultr-cli/releases/download/v${version}/vultr-cli_v${version}_macOs_amd64.tar.gz`   },
    { project, version, os: 'macos',    arch:  'arm64', url: `https://github.com/vultr/vultr-cli/releases/download/v${version}/vultr-cli_v${version}_macOs_arm64.tar.gz`   },
    { project, version, os: 'windows',  arch:  'amd64', url: `https://github.com/vultr/vultr-cli/releases/download/v${version}/vultr-cli_v${version}_windows_amd64.zip`    },
    { project, version, os: 'windows',  arch:  'arm64', url: `https://github.com/vultr/vultr-cli/releases/download/v${version}/vultr-cli_v${version}_windows_arm64.zip`    },
  ]
}

async function python(manifest: DownloadManifest): Promise<void> {
  const project = "python";
  const resp = await githubApi.getRelease("astral-sh/python-build-standalone");

  for (const asset of resp.assets) {
    if (!asset.name.includes("x86_64-") && !asset.name.includes("aarch64")) {
      continue;
    }
    if (
      !asset.name.includes("linux-gnu-install_only_stripped") &&
      !asset.name.includes("windows-msvc-install_only_stripped") &&
      !asset.name.includes("darwin-install_only_stripped")
    ) {
      continue;
    }

    const segs = asset.name.split("-");
    const [major, minor, patch] = segs[1].split("+")[0].split(".");
    const arch = (
      {
        x86_64: "amd64",
        aarch64: "arm64",
      } as Record<string, Arch>
    )[segs[2]];
    const os = (
      {
        darwin: "macos",
        windows: "windows",
        linux: "linux",
      } as Record<string, Os>
    )[segs[4]];
    if (!arch || !os) {
      continue;
    }

    const key = `${project}-${major}.${minor}.${patch}`;
    const version = `${major}.${minor}.${patch}`;

    manifest[key] = manifest[key] || [];
    manifest[key].push({
      project,
      version,
      os,
      arch,
      url: asset.browser_download_url,
      stripComponents: 1,
    });
  }
}

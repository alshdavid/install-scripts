import * as fs from "node:fs";
import * as path from "node:path";
import { wget } from "../utils/wget.mts";
import {
  tarGz,
  tarXz,
  untarGz,
  untarXz,
  unzip,
  zip,
} from "../utils/compression.mts";
import type { ArchiveFormat, OsArch } from "../utils/types.mts";

export async function recompress(
  tmpRoot: string,
  tmpDownloads: string,
  url: string,
  format: ArchiveFormat,
  project: string,
  os_arch: OsArch,
  version: string,
  stripComponents?: number,
): Promise<boolean> {
  const inputName = `${project}-${version}-${os_arch}`;
  const inputArchive = `${project}-${version}-${os_arch}.${format}`;

  if (
    fs.existsSync(path.join(tmpRoot, `${inputName}.tar.xz`)) &&
    fs.existsSync(path.join(tmpRoot, `${inputName}.tar.gz`)) &&
    fs.existsSync(path.join(tmpRoot, `${inputName}.zip`))
  ) {
    console.log(
      `[${project}-${version}-${os_arch}] Already Downloaded, skipping`,
    );
    return;
  }

  if (!(await checkUrlExists(url))) {
    return false;
  }

  await wget(url, path.join(tmpDownloads, inputArchive));

  switch (format) {
    case "tar.gz":
      await untarGz(
        path.join(tmpDownloads, inputArchive),
        path.join(tmpDownloads, inputName),
        stripComponents,
      );
      break;
    case "tar.xz":
      await untarXz(
        path.join(tmpDownloads, inputArchive),
        path.join(tmpDownloads, inputName),
        stripComponents,
      );
      break;
    case "zip":
      await unzip(
        path.join(tmpDownloads, inputArchive),
        path.join(tmpDownloads, inputName),
        stripComponents,
      );
      break;
    case "bin":
      await fs.promises.mkdir(path.join(tmpDownloads, inputName), {
        recursive: true,
      });
      await fs.promises.cp(
        path.join(tmpDownloads, inputArchive),
        path.join(tmpDownloads, inputName, inputName),
      );
      break;
    default:
      throw new Error(`ArchiveFormat not supported: ${format}`);
  }

  await tarXz(
    path.join(tmpDownloads, inputName),
    path.join(tmpRoot, `${inputName}.tar.xz`),
  );

  await tarGz(
    path.join(tmpDownloads, inputName),
    path.join(tmpRoot, `${inputName}.tar.gz`),
  );

  await zip(
    path.join(tmpDownloads, inputName),
    path.join(tmpRoot, `${inputName}.zip`),
  );

  // await fs.promises.rm(
  //   path.join(tmpDownloads, inputName),
  //   { recursive: true, force: true }
  // )

  // await fs.promises.rm(
  //   path.join(tmpDownloads, inputArchive),
  //   { recursive: true, force: true }
  // )

  return true;
}

async function checkUrlExists(url: string) {
  try {
    const response = await globalThis.fetch(url, { method: "HEAD" });
    if (response.ok) {
      return true;
    } else {
      console.log(`URL ${url} returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

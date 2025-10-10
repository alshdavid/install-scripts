import semver from "semver";
import type { ArchiveFormat } from "../utils/types.mts";

export function inferArchiveFormat(url: string): ArchiveFormat {
  if (url.endsWith(".tar.gz")) {
    return "tar.gz";
  }
  if (url.endsWith(".tar.xz")) {
    return "tar.xz";
  }
  if (url.endsWith(".zip")) {
    return "zip";
  }
  throw new Error(`Cannot infer archive type from url: ${url}`);
}

export function sortEntries(a: string, b: string) {
  try {
    const semverA = tryParseSemver(a);
    const semverB = tryParseSemver(b);

    if (semverA && semverB) {
      return semver.compare(semverA, semverB);
    } else if (semverA) {
      return -1;
    } else if (semverB) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  } catch (e) {
    return a.localeCompare(b);
  }
}

export function tryParseSemver(str: string): semver.SemVer {
  try {
    return semver.parse(str);
  } catch (error) {}
  const [, version] = str.split("-");
  return semver.parse(version);
}

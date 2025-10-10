export type Os = "linux" | "macos" | "windows";
export type Arch = "amd64" | "arm64";
export type OsArch =
  | "linux-amd64"
  | "linux-arm64"
  | "macos-amd64"
  | "macos-arm64"
  | "macos-amd64"
  | "windows-amd64"
  | "windows-arm64";
export type ArchiveFormat = "tar.gz" | "tar.xz" | "zip" | "bin";

export type ReleaseMeta = {
  package: string;
  version: string;
};

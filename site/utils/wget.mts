import * as fs from 'node:fs'
import { sh } from './sh.mts'

export async function wget(url: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    return
  }

  await sh(
    "wget",
    [
      "--progress=bar:force:noscroll",
      "--trust-server-names",
      "-O",
      dest,
      `"${url}"`,
    ]
  );
}

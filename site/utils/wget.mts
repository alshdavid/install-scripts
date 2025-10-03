import * as fs from 'node:fs'
import * as child_process from "node:child_process";

export function wget(url: string, dest: string) {
  if (fs.existsSync(dest)) {
    return
  }

  const child = child_process.spawn(
    "wget",
    [
      "--progress=bar:force:noscroll",
      "--trust-server-names",
      "-O",
      dest,
      `"${url}"`,
    ],
    {
      shell: true,
      stdio: "inherit",
    }
  );

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

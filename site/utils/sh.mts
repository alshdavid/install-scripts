import * as child_process from "node:child_process";

export function sh(
  command: string,
  args: Array<string> = [],
  options: child_process.SpawnOptions = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const child = child_process.spawn(command, args, {
    shell: false,
    stdio: ["ignore", "inherit", "inherit"],
    env: process.env,
    ...options,
  });

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += `${chunk}`;
    });

    child.stderr?.on("data", (chunk) => {
      stdout += `${chunk}`;
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({
          code,
          stdout,
          stderr,
        });
      } else {
        reject(
          new Error(
            `Command "${command} ${args.join(" ")}" failed with exit code ${code}`,
          ),
        );
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

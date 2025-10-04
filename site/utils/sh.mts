import * as child_process from "node:child_process";

export function sh(command: string, args: Array<string> = [], options: child_process.SpawnOptions = {}): Promise<void> {
    const child = child_process.spawn(
      command,
      args,
      {
        ...options,
        shell: false,
        stdio: "inherit",
      }
    );
  
    return new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
  
      child.on("error", (err) => {
        reject(err);
      });
    });
}
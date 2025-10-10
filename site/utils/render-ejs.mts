import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as ejs from "ejs";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);

export type RenderEjsOptions = {
  inputFile: string;
  outputFile: string;
};

export async function renderEjs({
  inputFile,
  outputFile,
  ...extendCtx
}: RenderEjsOptions & Record<string, any>) {
  const template = await fs.promises.readFile(inputFile, {
    encoding: "utf-8",
  });

  const ctx = {
    get root() {
      return root;
    },
    get filename() {
      return inputFile;
    },
    get dirname() {
      return path.dirname(inputFile);
    },
    get path() {
      return path;
    },
    get fs() {
      return {
        get exists() {
          return fs.existsSync;
        },
        ...fs.promises,
      };
    },
    get ctx() {
      return ctx;
    },
    ...extendCtx,
  };

  const result = await ejs.render(template, ctx, {
    async: true,
    cache: false,
    filename: inputFile,
  });

  if (fs.existsSync(outputFile)) await fs.promises.rm(outputFile);
  await fs.promises.writeFile(outputFile, result, { encoding: "utf-8" });
}

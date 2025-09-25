import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as ejs from "ejs";
import * as prettier from "prettier";

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);

export async function main() {
  const template = await fs.promises.readFile(path.join(dirname, "index.ejs"), {
    encoding: "utf-8",
  });
  const outfile = path.join(root, "index.html");

  const ctx = {
    get root() {
      return root
    },
    get filename() {
      return filename
    },
    get dirname() {
      return dirname
    },
    get path() {
      return path
    },
    get fs() {
      return {
        get exists() {
          return fs.existsSync
        },
        ...fs.promises
      }
    },
    get ctx() {
      return ctx;
    },
  };

  const result = await ejs.render(template, ctx, {
    async: true,
    cache: false,
    filename: template,
  });

  const formatted = await prettier.format(result, {
    parser: 'html'
  })

  if (fs.existsSync(outfile)) await fs.promises.rm(outfile)
  await fs.promises.writeFile(outfile, formatted, { encoding: 'utf-8' })
}

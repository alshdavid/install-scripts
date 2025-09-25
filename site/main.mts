import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as buildHtml from './build-html.mts'
import * as generateVersions from './generate-versions.mts'
import * as copyFiles from './copy-files.mts'

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.dirname(dirname);

void async function main() {
  if (fs.existsSync(path.join(root, 'dist'))) {
    fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true })
  }
  fs.mkdirSync(path.join(root, 'dist'))

  await generateVersions.main()
  await buildHtml.main()
  await copyFiles.main()
}()
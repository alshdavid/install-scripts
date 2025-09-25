import * as buildHtml from './build-html.mts'
import * as generateVersions from './generate-versions.mts'

void async function main() {
  await generateVersions.main()
  await buildHtml.main()
}()
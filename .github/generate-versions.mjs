import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const root = path.dirname(dirname)
const versions = path.join(root, 'versions')

if (fs.existsSync(versions)) {
  fs.rmSync(versions, { recursive: true, force: true })
}
fs.mkdirSync(versions)

void async function go() {
  const project = "go"
  const resp = await globalThis.fetch('https://go.dev/dl/?mode=json')
  const body = await resp.json()
  const version = body[0].version.replace("go", "")

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')

  console.log(`${project}: ${version}`)
}()

void async function just() {
  const project = "just"
  const resp = await globalThis.fetch('https://api.github.com/repos/casey/just/releases/latest')
  const body = await resp.json()
  const version = body.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}()

void async function nodejs() {
  const project = "nodejs"
  const resp = await globalThis.fetch('https://nodejs.org/download/release/index.json')
  const body = await resp.json()

  let current = body[0].version.replace("v", "")
  let lts = null
  for (const release of body) {
    if (release.lts) {
      lts = release.version.replace("v", "")
      break
    }
  }

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), current, 'utf8')
  await fs.promises.writeFile(path.join(versions, project, 'current'), current, 'utf8')
  await fs.promises.writeFile(path.join(versions, project, 'lts'), lts, 'utf8')

  console.log(`${project} current: ${current}`)
  console.log(`${project} lts: ${lts}`)
}()

void async function procmon() {
  const project = "procmon"
  const resp = await globalThis.fetch('https://api.github.com/repos/alshdavid/procmon/releases/latest')
  const body = await resp.json()
  const version = body.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}()

void async function rrm() {
  const project = "rrm"
  const resp = await globalThis.fetch('https://api.github.com/repos/alshdavid/rrm/releases/latest')
  const body = await resp.json()
  const version = body.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}()

void async function uutils() {
  const project = "uutils"
  const resp = await globalThis.fetch('https://api.github.com/repos/uutils/coreutils/releases/latest')
  const body = await resp.json()
  const version = body.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}()

void async function terraform() {
  const project = "terraform"
  const resp = await globalThis.fetch('https://api.github.com/repos/hashicorp/terraform/releases/latest')
  const body = await resp.json()
  const version = body.tag_name.replace("v", "")

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}()

void async function python() {
  const project = "python"
  await fs.promises.mkdir(path.join(versions, project))

  const resp = await globalThis.fetch('https://api.github.com/repos/astral-sh/python-build-standalone/releases/latest')
  const body = await resp.json()

  for (const asset of body.assets) {
    if (!asset.name.includes("x86_64-") && !asset.name.includes("aarch64")) continue
    if (!asset.name.includes("linux-gnu-install_only_stripped") && !asset.name.includes("windows-msvc-install_only_stripped") && !asset.name.includes("darwin-install_only_stripped")) continue
    
    const segs = asset.name.split('-')

    const [major, minor, _patch] = segs[1].split('+')[0].split('.')
    const arch = {
      'x86_64': 'amd64',
      'aarch64': 'arm64'
    }[segs[2]]
    const os = segs[4]

    const version = `${os}-${arch}-${major}.${minor}`

    await fs.promises.writeFile(path.join(versions, project, version), asset.browser_download_url, 'utf8')
    console.log(`${project}: ${version}`)
  }
}()
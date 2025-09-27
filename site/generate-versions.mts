import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import * as githubApi from './utils/github.mts'
import * as nodejsApi from './utils/nodejs.mts'

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const root = path.dirname(dirname)
const versions = path.join(root, 'dist', 'versions')

export async function main() {
  if (fs.existsSync(versions)) {
    fs.rmSync(versions, { recursive: true, force: true })
  }
  fs.mkdirSync(versions)

  await Promise.all([
    go(),
    just(),
    nodejs(),
    procmon(),
    rrm(),
    uutils(),
    terraform(),
    python(),
    vultrCli()
  ])

  // Add .txt for correct mime type
  for (const dir of await fs.promises.readdir(path.join(versions))) {
    for (const file of await fs.promises.readdir(path.join(versions, dir))) {
      await fs.promises.cp(path.join(versions, dir, file), path.join(versions, dir, file + '.txt'))
    }
  }
}

export async function go() {
  const project = "go"
  const resp = await globalThis.fetch('https://go.dev/dl/?mode=json')
  const body = await resp.json()
  const version = body[0].version.replace("go", "")

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')

  console.log(`${project}: ${version}`)
}

export async function just() {
  const project = "just"
  const resp = await githubApi.getRelease('casey/just')
  const version = resp.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}

export async function nodejs() {
  const project = "nodejs"
  const resp = await nodejsApi.getReleases()

  let current = resp[0].version.replace("v", "")
  let lts = null
  for (const release of resp) {
    if (release.lts) {
      lts = release.version.replace("v", "")
      break
    }
  }

  const manifest: Record<string, string> = {}

  for (const release of resp) {
    const version = release.version.replace("v", "")
    const [major, minor] = version.split('.')
    if (!manifest[major]) manifest[major] = version
    if (!manifest[`${major}.${minor}`]) manifest[`${major}.${minor}`] = version
  }
  
  await fs.promises.mkdir(path.join(versions, project))
  
  for (const [specifier, version] of Object.entries(manifest)) {
    await fs.promises.writeFile(path.join(versions, project, specifier), version, 'utf8')
  }
  await fs.promises.writeFile(path.join(versions, project, 'latest'), current, 'utf8')
  await fs.promises.writeFile(path.join(versions, project, 'current'), current, 'utf8')
  await fs.promises.writeFile(path.join(versions, project, 'lts'), lts, 'utf8')

  console.log(`${project} current: ${current}`)
  console.log(`${project} lts: ${lts}`)
}

export async function procmon() {
  const project = "procmon"
  const resp = await githubApi.getRelease('alshdavid/procmon')
  const version = resp.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}

export async function rrm() {
  const project = "rrm"
  const resp = await githubApi.getRelease('alshdavid/rrm')
  const version = resp.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}

export async function uutils() {
  const project = "uutils"
  const resp = await githubApi.getRelease('uutils/coreutils')
  const version = resp.tag_name

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}

export async function terraform() {
  const project = "terraform"
  const resp = await githubApi.getRelease('hashicorp/terraform')
  const version = resp.tag_name.replace("v", "")

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}

export async function python() {
  const project = "python"
  await fs.promises.mkdir(path.join(versions, project))

  const resp = await githubApi.getRelease('astral-sh/python-build-standalone')

  for (const asset of resp.assets) {
    if (!asset.name.includes("x86_64-") && !asset.name.includes("aarch64")) continue
    if (!asset.name.includes("linux-gnu-install_only_stripped") && !asset.name.includes("windows-msvc-install_only_stripped") && !asset.name.includes("darwin-install_only_stripped")) continue
    
    const segs = asset.name.split('-')

    const [major, minor, _patch] = segs[1].split('+')[0].split('.')
    const arch = {
      'x86_64': 'amd64',
      'aarch64': 'arm64'
    }[segs[2]]
    const os = {
      'darwin': 'macos',
      'windows': 'windows',
      'linux': 'linux',
    }[segs[4]]

    const version = `${os}-${arch}-${major}.${minor}`

    await fs.promises.writeFile(path.join(versions, project, version), asset.browser_download_url, 'utf8')
    console.log(`${project}: ${version}`)
  }
}

export async function vultrCli() {
  const project = "vultr-cli"
  const resp = await githubApi.getRelease('vultr/vultr-cli')
  const version = resp.tag_name.replace("v", "")

  await fs.promises.mkdir(path.join(versions, project))
  await fs.promises.writeFile(path.join(versions, project, 'latest'), version, 'utf8')
  console.log(`${project}: ${version}`)
}
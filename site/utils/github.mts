export type GithubReleasesResponse = {
  tag_name: string
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

export async function getRelease(repo: string, tag: string = 'latest'): Promise<GithubReleasesResponse> {
  const resp = await globalThis.fetch(`https://api.github.com/repos/${repo}/releases/${tag}`)
  if (!resp.ok) {
    throw new Error(`Unable to fetch release for ${repo}/${tag}`)
  }
  const body = await resp.json()
  return body as GithubReleasesResponse
}
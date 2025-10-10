export type GithubReleaseResponse = {
  tag_name: string;
  body?: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
};

export async function getRelease(
  repo: string,
  tag?: string,
): Promise<GithubReleaseResponse> {
  const url = `https://api.github.com/repos/${repo}/releases/${tag ? `tags/${tag}` : "latest"}`;
  const resp = await globalThis.fetch(url);
  if (!resp.ok) {
    throw new Error(`Unable to fetch release for ${repo}/${tag}`);
  }
  const body = await resp.json();
  return body as GithubReleaseResponse;
}

export type GithubReleasesResponse = Array<{
  tag_name: string;
  body?: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}>;

export async function getReleases(
  repo: string,
): Promise<GithubReleasesResponse> {
  const resp = await globalThis.fetch(
    `https://api.github.com/repos/${repo}/releases`,
  );
  if (!resp.ok) {
    throw new Error(`Unable to fetch release for ${repo}`);
  }
  const body = await resp.json();
  return body as GithubReleasesResponse;
}

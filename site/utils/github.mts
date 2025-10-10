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
  let endpoint = "latest";
  if (tag) {
    endpoint = `tags/${tag}`;
  }
  const url = `https://api.github.com/repos/${repo}/releases/${endpoint}`;
  let init: RequestInit | undefined = undefined;
  if (process.env.GITHUB_TOKEN) {
    init = {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    };
  }
  const resp = await globalThis.fetch(url, init);
  if (!resp.ok) {
    console.log(resp.statusText);
    throw new Error(`Unable to fetch release for ${url}`);
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
  const url = `https://api.github.com/repos/${repo}/releases`;
  let init: RequestInit | undefined = undefined;
  if (process.env.GITHUB_TOKEN) {
    init = {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    };
  }
  const resp = await globalThis.fetch(url, init);
  if (!resp.ok) {
    console.log(resp.statusText);
    throw new Error(`Unable to fetch release for ${url}`);
  }
  const body = await resp.json();
  return body as GithubReleasesResponse;
}

import { githubReleaseView } from "../utils/github-releases.mts";

export async function releaseExists(
  repo: string,
  tag: string,
): Promise<boolean> {
  return !!(await githubReleaseView({
    repo,
    tag,
  }));
}

import {
  githubReleaseCreate,
  githubReleaseEdit,
  githubReleaseUpload,
} from "../utils/github-releases.mts";

export async function uploadRelease(
  repo: string,
  project: string,
  version: string,
  files: string[],
): Promise<void> {
  console.log(`[${project}-${version}] Creating Release`);
  await githubReleaseCreate({
    repo,
    title: `${project}-${version}`,
    tag: `${project}-${version}`,
    draft: true,
  });

  for (const file of files) {
    console.log(`[${project}-${version}] Uploading: ${file}`);
    await githubReleaseUpload({
      repo,
      tag: `${project}-${version}`,
      file,
    });
  }

  console.log(`[${project}-${version}] Undrafting Release`);
  await githubReleaseEdit({
    repo,
    tag: `${project}-${version}`,
    draft: false,
  });
}

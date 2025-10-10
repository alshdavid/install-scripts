import { sh } from "./sh.mts";

export type GithubReleaseCreateOptions = {
  repo: string;
  tag: string;
  title: string;
  draft?: boolean;
  notes?: string;
};

export async function githubReleaseCreate({
  repo,
  tag,
  title,
  draft,
  notes,
}: GithubReleaseCreateOptions): Promise<void> {
  await sh("gh", [
    "release",
    "create",
    tag,
    ...["--repo", repo],
    ...["--title", title],
    ...[`--draft=${draft}`],
    ...(notes ? ["--notes", notes] : []),
  ]);
}

export type GithubReleaseEditOptions = {
  repo: string;
  tag: string;
  title?: string;
  draft?: boolean;
  notes?: string;
};

export async function githubReleaseEdit({
  repo,
  tag,
  title,
  draft,
  notes,
}: GithubReleaseEditOptions): Promise<void> {
  await sh("gh", [
    "release",
    "edit",
    tag,
    ...["--repo", repo],
    ...[`--draft=${draft}`],
    ...(title ? ["--title", title] : []),
    ...(notes ? ["--notes", notes] : []),
  ]);
}

export async function githubReleaseDelete({
  repo,
  tag,
}: GithubReleaseEditOptions): Promise<void> {
  await sh("gh", [
    "release",
    "delete",
    tag,
    ...["--repo", repo],
    ...[`--yes`],
    ...[`--cleanup-tag`],
  ]);
}

export type GithubReleaseUploadOptions = {
  repo: string;
  tag: string;
  file: string;
};

export async function githubReleaseUpload({
  repo,
  tag,
  file,
}: GithubReleaseUploadOptions): Promise<void> {
  await sh("gh", ["release", "upload", tag, file, ...["--repo", repo]]);
}

export type GithubReleaseListOptions = {
  repo: string;
};

export async function githubReleaseList({
  repo,
}: GithubReleaseListOptions): Promise<void> {
  const result = await sh(
    "gh",
    [
      "release",
      "list",
      ...["--repo", repo],
      ...["--json", "id"],
      ...["--json", "name"],
      ...["--json", "tagName"],
    ],
    { stdio: "pipe" },
  );
  if (result.code === 0) {
    console.log(JSON.parse(result.stdout));
  } else {
    throw new Error("Command failed");
  }
}

export type GithubReleaseViewOptions = {
  repo: string;
  tag: string;
};

export async function githubReleaseView({
  repo,
  tag,
}: GithubReleaseViewOptions): Promise<
  Array<{
    id: string;
    name: string;
    tagName: string;
  }>
> {
  try {
    const result = await sh(
      "gh",
      [
        "release",
        "view",
        tag,
        ...["--repo", repo],
        ...["--json", "id"],
        ...["--json", "name"],
        ...["--json", "tagName"],
      ],
      { stdio: "pipe" },
    );
    return JSON.parse(result.stdout);
  } catch (error) {
    return undefined;
  }
}

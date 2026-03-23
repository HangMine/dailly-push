import { createGitHubHeaders, fetchWithRetry } from './http';
import type { RepoMetadata } from './types';

interface RepoResponse {
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
}

export async function fetchGitHubMetadata(owner: string, repoName: string): Promise<RepoMetadata | null> {
  const url = `https://api.github.com/repos/${owner}/${repoName}`;
  const response = await fetchWithRetry(
    url,
    {
      headers: createGitHubHeaders(),
      signal: AbortSignal.timeout(30_000),
    },
    { label: `GitHub API ${owner}/${repoName}`, retries: 3, retryDelayMs: 1500 },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub API 请求失败: ${owner}/${repoName} (${response.status})`);
  }

  const data = (await response.json()) as RepoResponse;
  return {
    description: data.description ?? undefined,
    homepage: data.homepage ?? undefined,
    language: data.language ?? undefined,
    starsTotal: data.stargazers_count ?? undefined,
    topics: data.topics ?? [],
  };
}

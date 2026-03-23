const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: string,
  init: RequestInit,
  options?: { label?: string; retries?: number; retryDelayMs?: number },
): Promise<Response> {
  const retries = options?.retries ?? 3;
  const retryDelayMs = options?.retryDelayMs ?? 1500;
  const label = options?.label ?? input;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok) {
        return response;
      }

      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`${label} HTTP ${response.status}`);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await sleep(retryDelayMs * attempt);
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} fetch failed after ${retries} attempts: ${detail}`);
}

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetchWithRetry(
    url,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(30_000),
    },
    { label: `HTML ${url}`, retries: 3, retryDelayMs: 1500 },
  );

  if (!response.ok) {
    throw new Error(`请求 HTML 失败: ${url} (${response.status})`);
  }

  return response.text();
}

export function createGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

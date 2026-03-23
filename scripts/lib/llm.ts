import { z } from 'zod';
import { getLlmConfig } from './llm-config';
import { fetchWithRetry } from './http';
import type { RepoEnrichment, RepoMetadata, ScrapedRepo } from './types';
import { extractFirstJsonObject, stripMarkdownFences } from './utils';

const enrichmentSchema = z.object({
  category: z.string().min(1),
  summaryZh: z.string().min(1),
  reasons: z.array(z.string().min(1)).length(3),
});

export async function enrichRepo(
  repo: ScrapedRepo,
  metadata: RepoMetadata | null,
): Promise<RepoEnrichment> {
  const { apiKey, baseUrl, model } = await getLlmConfig();

  const payload = {
    repository: `${repo.owner}/${repo.repoName}`,
    language: metadata?.language || repo.language,
    description_en: metadata?.description || repo.descriptionEn,
    homepage: metadata?.homepage || '',
    topics: metadata?.topics || [],
    tags: repo.tags,
    stars_today: repo.starsToday,
    stars_total: metadata?.starsTotal ?? repo.starsTotal,
    source_url: repo.sourceUrl,
  };

  const llmUrl = `${baseUrl}/chat/completions`;
  const response = await fetchWithRetry(
    llmUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              '你是中文科技编辑。请根据给定仓库公开信息返回严格 JSON，对象字段只有 category、summaryZh、reasons。summaryZh 必须是中文，不要照搬英文。reasons 必须恰好 3 条，每条是完整中文句子，不要编号、不要加符号、不要输出 Markdown。信息不足时允许克制推断，但禁止编造具体版本号、发布日期、融资、下载量等无法确认的事实。',
          },
          {
            role: 'user',
            content: JSON.stringify(payload, null, 2),
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    },
    {
      label: `LLM ${repo.owner}/${repo.repoName}`,
      retries: 3,
      retryDelayMs: 2000,
    },
  );

  if (!response.ok) {
    throw new Error(`LLM request failed: ${repo.owner}/${repo.repoName} (${response.status})`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map((item) => item.text || '').join('')
        : '';

  if (!text) {
    throw new Error(`LLM returned empty content: ${repo.owner}/${repo.repoName}`);
  }

  const parsed = JSON.parse(extractFirstJsonObject(stripMarkdownFences(text)));
  const result = enrichmentSchema.parse(parsed);

  return {
    category: result.category.trim(),
    summaryZh: result.summaryZh.trim(),
    reasons: result.reasons.map((item) => item.trim()) as [string, string, string],
  };
}

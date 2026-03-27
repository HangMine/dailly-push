import type { DailyIssue } from './schema';
import { REASON_PREFIX, SECTION_CONFIG } from './constants';

export function formatIssueTitle(date: string): string {
  return `📊 GitHub & Skills 天榜速递（${date}）`;
}

export function formatDisplayDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00+08:00`);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatQqMessage(issue: Pick<DailyIssue, 'date' | 'sections' | 'sources'>): string {
  const lines: string[] = [formatIssueTitle(issue.date), ''];

  for (const config of SECTION_CONFIG) {
    const section = issue.sections.find((item) => item.id === config.id);
    if (!section) {
      continue;
    }

    lines.push('━━━━━━━━━━');
    lines.push(`【${section.title}】`);
    lines.push('');

    for (const item of section.items) {
      const isSkillsTrending = section.id === 'skills-trending';
      const isSkillsHot = section.id === 'skills-hot';
      const isMcp = section.id === 'mcp';
      const titleLine = item.owner === 'skills' || item.owner === 'mcp' ? `${item.rank}. ${item.repoName}｜${item.language}` : `${item.rank}. ${item.owner}/${item.repoName}（${item.language}）`;
      lines.push(titleLine);
      lines.push(`▸ 类别：${item.category}`);
      lines.push(`▸ 简介：${item.summaryZh}`);

      if (isSkillsTrending) {
        lines.push(`▸ 数据：📦 24h ${item.starsToday > 0 ? formatNumber(item.starsToday) : '-'}`);
      } else if (isSkillsHot) {
        const change = item.starsTotal > 0 ? `+${formatNumber(item.starsTotal)}` : '-';
        lines.push(`▸ 数据：⚡ 1H ${item.starsToday > 0 ? formatNumber(item.starsToday) : '-'}｜📈 Change ${change}`);
      } else if (isMcp) {
        lines.push(`▸ 数据：🔥 单日热度 ${item.starsToday > 0 ? formatNumber(item.starsToday) : '-'}｜📊 累计指标 ${item.starsTotal > 0 ? formatNumber(item.starsTotal) : '-'}`);
      } else {
        lines.push(`▸ Stars：今日 ⭐${formatNumber(item.starsToday)}｜总 ⭐${formatNumber(item.starsTotal)}`);
      }

      lines.push(isSkillsTrending || isSkillsHot || isMcp ? '▸ 推荐理由：' : '▸ 增长原因：');

      for (const reason of item.reasons) {
        lines.push(`${REASON_PREFIX}${reason.trim()}`);
      }

      lines.push(`▸ 链接：${item.repoUrl}`);
      lines.push('');
    }
  }

  lines.push('来源链接：');
  issue.sources.forEach((source, index) => {
    lines.push(`${index + 1}. ${source.label}：${source.url}`);
  });

  return lines.join('\n').trim();
}

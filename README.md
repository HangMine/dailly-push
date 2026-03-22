# GitHub 天榜速递

一个基于 Astro 的 GitHub Pages 静态站，用来展示每日 GitHub Trending 与 Best of JS 榜单，并生成可直接发送到 QQ 的中文文本版本。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 生成每日内容

先配置环境变量：

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
```

默认会优先读取本机 `~/.codex/config.toml` 和 `~/.codex/auth.json` 中的模型配置与 API Key。
如果 `.codex` 里缺少某些字段，脚本会再回退读取项目根目录的 `.env`。

然后执行：

```bash
pnpm generate:daily
pnpm generate:daily --date 2026-03-22
```

生成结果会写入：

- `src/content/daily/YYYY-MM-DD.json`
- `generated/YYYY-MM-DD.txt`

## 站点路由

- `/` 最新一期
- `/archive/` 历史归档
- `/daily/YYYY-MM-DD/` 单日详情

## 部署

仓库 push 到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

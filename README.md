# GitHub 每日速递

一个基于 Astro 的静态站点，用来展示每日 GitHub 榜单内容，并生成可直接转发的中文纯文本版本。

当前仓库按 GitHub Pages 项目页方式部署，目标地址为：

- `https://hangmine.github.io/dailly-push/`

## 本地开发

```bash
pnpm install
pnpm dev
```

如需在发布前检查构建结果：

```bash
pnpm build
```

## 生成每日内容

先配置环境变量：

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
```

脚本会优先读取本机 `~/.codex/config.toml` 和 `~/.codex/auth.json` 中的模型配置与 API Key；如果 `.codex` 中缺少对应字段，再回退读取项目根目录下的 `.env`。

执行命令：

```bash
pnpm generate:daily
pnpm generate:daily --date 2026-03-22
```

生成结果会写入：

- `src/content/daily/YYYY-MM-DD.json`
- `generated/YYYY-MM-DD.txt`

站点页面直接读取 `src/content/daily` 下的静态内容，所以要把新生成的 JSON 一起提交到仓库。

## 站点路由

- `/` 最新一期
- `/archive/` 历史归档
- `/daily/YYYY-MM-DD/` 单日详情

## 部署到 GitHub Pages

这个仓库已经包含 GitHub Pages 所需的 Astro 配置和 GitHub Actions 工作流：

- `astro.config.mjs` 中已设置：
  - `site: 'https://hangmine.github.io'`
  - `base: '/dailly-push'`
- `.github/workflows/deploy.yml` 会在推送到 `main` 分支后自动构建并发布

首次启用时，在 GitHub 仓库页面完成下面的设置：

1. 打开 `Settings -> Pages`
2. 在 `Build and deployment` 中把 Source 设为 `GitHub Actions`
3. 确认默认发布分支仍然是 `main`

之后的发布流程：

1. 本地生成或更新内容
2. 提交代码并推送到 `main`
3. 在 `Actions` 页面查看 `Deploy to GitHub Pages` 工作流是否成功
4. 成功后访问 `https://hangmine.github.io/dailly-push/`

## 发布说明

- GitHub Pages 只负责构建和发布仓库里的现成内容
- 当前工作流不会在 CI 里执行 `pnpm generate:daily`
- 内容生成和站点发布是两段流程：
  - 本地运行 `pnpm generate:daily`
  - 提交生成结果后由 GitHub Actions 自动发布

## 常见问题

### 页面能打开，但样式或脚本 404

优先检查 `astro.config.mjs` 里的 `base` 是否与仓库名一致。GitHub Pages 项目页必须使用：

- `/<repo-name>`

当前仓库名是 `dailly-push`，所以 `base` 必须是：

```ts
base: '/dailly-push'
```

### 仓库名或用户名变了怎么办

如果仓库 owner 或 repo name 变化，需要同步修改 `astro.config.mjs` 中的：

- `site`
- `base`

否则生成出来的资源路径会错误。

### 想换成自定义域名

仍然可以沿用 GitHub Actions 发布，但要按自定义域名重新调整 `site` 和 `base`，必要时再补充 `CNAME` 配置。

## 参考

- Astro 官方文档: https://docs.astro.build/en/guides/deploy/github/

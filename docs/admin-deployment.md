# 后台部署说明

后台运行在 Cloudflare Workers，D1 和 KV 由 `wrangler.jsonc` 中的 `ADMIN_DB`、`ADMIN_CACHE` 绑定提供。

## 必需 Secrets

在 Cloudflare Worker 中配置以下变量，不要提交到 Git：

```text
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
GITHUB_OWNER
GITHUB_REPO
GITHUB_BRANCH
GITHUB_TOKEN
GITHUB_GIST_TOKEN
MOMENTS_GIST_ID
MOMENTS_FILE_NAME
NOTEBOOK_GISTS_JSON
IMG_BED_URL
IMG_BED_TOKEN
```

可选集成按需配置：

```text
TELEGRAM_CHAT_ID
TELEGRAM_BOT_TOKEN
WEATHER_API_KEY
HUGGINGFACE_TOKEN
```

Cloudflare 账户 ID 和 API Token 只用于 CI 部署，放在 GitHub Actions Secrets：

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

## 初始化 D1

```bash
pnpm wrangler d1 migrations apply firefly-admin --remote
```

## 部署

推送到 `main` 会触发 `.github/workflows/cloudflare.yml`。部署前必须使用已经轮换的凭据，旧凭据不可复用。

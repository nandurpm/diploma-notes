# Ask POLY AI Worker

This Cloudflare Worker is the private server-side AI endpoint for the public POLY PMNA website.

## Why a Worker is required

The website repository is public and static. The OpenAI API key must never be placed in browser JavaScript or committed to GitHub. This Worker stores the key as a Cloudflare secret and forwards safe requests to the OpenAI Responses API.

## One-time GitHub repository secrets

Add these secrets under **Repository Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OPENAI_API_KEY`

The Cloudflare token needs permission to edit Workers for the selected account.

## Deployment

Run the GitHub Actions workflow **Deploy Ask POLY AI Worker** manually after adding the secrets. The workflow deploys the Worker, stores `OPENAI_API_KEY` as a Worker secret, and writes the deployed Worker URL into `assets/js/ask-poly-config.js` automatically.

Local commands:

```bash
cd workers/ask-poly-ai
npm install
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

## Default model

The Worker uses `gpt-5.4-mini` by default for a balance of quality, speed and cost. Change `OPENAI_MODEL` in `wrangler.toml` when needed.

## Supported behavior

- Mathematics and engineering calculations
- Trigonometry, limits, differentiation and integration
- Chemistry formulas, reactions and molar calculations
- Grammar correction and rewriting
- Electrical/electronics explanations and component questions
- HTML, CSS, JavaScript and other computer/programming questions
- Important days, current affairs and other time-sensitive questions using web search
- Lesson-aware answers when the current page context is included

## Security controls

- API key remains server-side
- Origin allowlist
- Request-size limits
- Basic per-IP throttling
- No response caching
- Current-affairs answers return source URLs for the website UI

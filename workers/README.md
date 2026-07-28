# Cloudflare Workers

Serverless functions deployed on Cloudflare Workers for server-side processing.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ask-poly-ai/` | Ask POLY AI chat endpoint — handles AI-powered queries from the site |

## How Workers Are Deployed

Workers are deployed using the Cloudflare Workers CLI or dashboard. Each subdirectory contains the worker source code and a `README.md` with deployment instructions.

## Relationship to Frontend

The frontend sends requests to these workers via fetch calls. The workers process the request, optionally call external APIs (e.g., OpenAI), and return the response.

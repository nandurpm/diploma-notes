# Supabase Edge Functions

Serverless functions deployed to Supabase for backend processing.

## Functions

| Function | Purpose |
|----------|---------|
| `evaluate-quiz` | Evaluates quiz answers server-side, computes scores, and stores results |

## Deployment

Functions are deployed using the Supabase CLI:

```bash
supabase functions deploy <function-name>
```

## Environment

Each function has access to:
- Supabase database (via `supabase-js` client)
- Edge runtime (Deno-compatible)
- Environment secrets configured in the Supabase dashboard

## Calling Functions

From the frontend, functions are called via:

```javascript
const { data, error } = await supabase.functions.invoke('evaluate-quiz', {
  body: { answers: [...], session_id: '...' }
});
```

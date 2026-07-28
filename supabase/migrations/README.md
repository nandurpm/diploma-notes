# Database Migrations

Sequential SQL migration files for the Supabase database. Apply in order.

## Migration Files

| File | Purpose |
|------|---------|
| `001_*.sql` | Initial schema: users table, authentication setup |
| `002_*.sql` | Quiz sessions and results tables |
| `003_*.sql` | Question banks and subject metadata |
| `004_*.sql` | Leaderboard and ranking indexes |
| `005_*.sql` | Performance optimizations and additional indexes |

## Applying Migrations

```bash
# Apply all pending migrations
supabase db push

# Apply a specific migration
supabase migration up
```

## Guidelines

- Migration files must be SQL-only
- Use `CREATE TABLE IF NOT EXISTS` for idempotency
- Always include `DROP` statements in the reverse migration if needed
- Test migrations on a development database before applying to production

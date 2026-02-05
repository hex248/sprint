<img src="packages/frontend/public/favicon.svg" width="128" />

# [Sprint](https://sprintpm.org)

Super simple project management tool for developers.

Born out of frustration with Jira.

## Self hosting

### Setup

1. Copy `.env.example` files into `.env`:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

2. Backend `.env` required values:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `RESEND_API_KEY` and `EMAIL_FROM` for verification emails
   - `SEED_PASSWORD` if you plan to run `reset-and-seed`

3. Frontend `.env` required values:
   - `VITE_SERVER_URL`

### Notes

- OpenCode is optional. The app runs without it, but the AI helper requires OpenCode (no login needed).
- S3 is optional. If you skip S3, image uploads will not work.
- Stripe credentials are not needed for the current state.

### Database seeding

Run the seed script to create demo data:

```bash
bun reset-and-seed
```

This seeds demo issues, users, projects, and organisations. Demo users are created and can be used without verification emails. `SEED_PASSWORD` must be set in `packages/backend/.env`.

# DevBridge — Turn What You Know Into Work You Can Show

A multi-page site that connects learners' skills with real opportunities: track what you know, browse opportunities admins post, apply, and submit finished work.

## Stack

- **Frontend**: vanilla HTML, CSS, JavaScript (no framework)
- **Backend**: [Supabase](https://supabase.com) — Postgres database + Auth, called directly from the browser via `supabase.js`
- **Hosting**: static site (e.g. Netlify)

Accounts, skills, applications, submissions, and messages are all stored in Supabase, not localStorage. A few client-side conveniences (uploaded work files, cached opportunity data) still use localStorage, but nothing that needs to be shared between users or devices does.

## Pages

| Page | What it does |
|---|---|
| `index.html` | Home page — hero, how it works, stats |
| `signup.html` / `login.html` | Create or sign in to a Supabase Auth account |
| `my-skills.html` | Add, search, filter, and remove your own skills |
| `opportunities.html` | Browse opportunities, filter/search, see your match %, apply |
| `profile.html` | Edit your profile, see your applications/submissions, submit finished work, read messages from admins |
| `about.html` / `contact.html` | Static info + contact form |
| `admin-dashboard.html` | Admin-only: post/delete opportunities, review applications and work submissions, manage uploaded job files, message techies |

## How It Works

1. **Sign up** on `signup.html` — this creates a Supabase Auth account and a row in `profiles`.
2. **Add your skills** on My Skills: name, category, level, where you learned it.
3. **Browse opportunities** — the site calculates a match % between your skills and each opportunity's required skills. New opportunities posted by an admin show up within a few seconds via polling, no refresh needed.
4. **Apply** to an opportunity from its card or detail modal.
5. An **admin reviews applications** in the dashboard and accepts or rejects them.
6. Once accepted, you can **submit finished work** (with file uploads) from your profile.
7. An **admin reviews submissions** and can message you from the dashboard.

## Admin Access

There's no hardcoded admin login. Admin access is a real Supabase Auth account whose row in the `profiles` table has `is_admin = true`. To make an account an admin:

1. Sign up normally through `signup.html`.
2. In the Supabase dashboard → Table Editor → `profiles`, find that user's row and set `is_admin` to `true`.

See `SUPABASE_SETUP.md` for the full table schema and `supabase-rls-policies.sql` for the Row Level Security policies that should be applied to the project — **run that SQL file before putting this live**, since without it every table is readable and writable by anyone with the (public) anon key.

## File Structure

```
DevBridge/
├── index.html, my-skills.html, opportunities.html, profile.html,
│   about.html, contact.html, login.html, signup.html, admin-dashboard.html
├── styles.css               # Shared stylesheet
├── app.js                   # Core app state, Supabase job loading, polling
├── auth.js                  # Supabase Auth: signup/login/session/requireLogin
├── supabase.js              # Thin fetch wrapper over the Supabase REST API
├── skills.js, opportunities.js, profile.js, contact.js   # Per-page logic
├── supabase-rls-policies.sql  # Row Level Security policies to run in Supabase
├── SUPABASE_SETUP.md          # Table schema reference
└── README.md                  # This file
```

## Running Locally

This is a static site — there's no build step. Open `index.html` in a browser, or serve the folder with any static file server. It talks to a live Supabase project, so you'll need your own Supabase URL/anon key in `supabase.js` and the tables described in `SUPABASE_SETUP.md`.

## Known Gaps / Next Steps

- No edit-job UI in the admin dashboard yet (post + delete only).
- Techies can read messages from admins on their profile, but can't reply — messaging is one-way (admin → techie) by design for now.
- Homepage stats and testimonials are placeholder content — swap them for real numbers/quotes before sharing the site publicly.

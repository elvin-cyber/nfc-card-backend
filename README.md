# NFC Connect Backend

Node.js / Express / MongoDB backend that implements the API contract expected by
the `nfc-card-frontend` app (see that project's README for the full contract list).

## Setup

```bash
npm install
# .env is already filled in with the values you supplied.
# Edit MONGO_URI if you're not running Mongo on localhost:27017.
npm run seed:admin   # creates the first administrator account (MAIN_ADMIN role)
npm run dev          # starts the API with nodemon on http://localhost:5000
```

The seeded administrator login is whatever you set in `.env`:
- Email: `ADMIN_EMAIL`
- Password: `ADMIN_PASSWORD`

Sign in to the admin portal at the frontend's `/admin/login` route.

## Environment variables

All variables from your supplied `_env` file are wired in as-is (`.env`):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Token signing |
| `JWT_COOKIE_NAME` / `ADMIN_JWT_COOKIE_NAME` | Separate httpOnly cookies for user vs admin sessions, so both can be logged in at once in the same browser |
| `CLIENT_ORIGIN` | Allowed CORS origin (your Vite dev server, or your deployed frontend URL in production) |
| `COOKIE_SECURE` | Set `true` only when serving the API over HTTPS |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used once by `npm run seed:admin` |

Optional addition (not in your original file, defaults to `CLIENT_ORIGIN` if unset):
- `PUBLIC_APP_URL` — the origin used to build the `publicUrl` an admin generates for a
  card (e.g. `https://your-domain.vercel.app`). Set this in production if your API and
  frontend are on different domains, so `card.publicUrl` points at the deployed frontend
  rather than `CLIENT_ORIGIN`.

## Auth model

- Users and Admins are **separate MongoDB collections** with separate login endpoints
  (`/api/auth/*` vs `/api/admin/auth/*`), matching the frontend's `AuthContext`.
- Both endpoints return the JWT in the JSON body (`token`) **and** set it as an httpOnly
  cookie. The frontend's `services/api.js` stores the returned token in
  `sessionStorage` and sends it as `Authorization: Bearer <token>` on every request —
  this is what lets a user session and an admin session coexist in two tabs of the same
  browser (a cookie alone would be shared across tabs).
- Every token carries a `kind: "user" | "admin"` claim so `/api/auth/me` and
  `/api/admin/auth/me` don't cross-accept each other's tokens — this is what makes the
  frontend's login-fallback logic in `AuthContext` (`try me() then adminMe()`) work.

## Admin roles

- `ADMIN` — manage users and NFC cards.
- `SUPER_ADMIN` / `MAIN_ADMIN` — everything `ADMIN` can do, plus create, edit, disable
  and delete other **administrator** accounts (the `/admin/admins` screen). The first
  seeded admin is `MAIN_ADMIN`.

## Card lifecycle

1. User requests a card (`POST /api/cards`) — one `PERSONAL` and one `COMPANY` card max
   per user. Card starts `status: ACTIVE`, `provisioned: false` (no public URL yet).
2. Admin provisions it (`POST /api/admin/cards`) — generates a unique token, sets
   `provisioned: true` and `publicUrl`.
3. User can enable/disable their own card unless an admin has locked it
   (`adminDisabled: true` / `status: ADMIN_DISABLED`) — only an admin can lift that lock.
4. Deleting a card (by the user or an admin) is a **soft delete**
   (`deleted: true`, `deletedAt`) so the admin card inventory keeps a full audit trail,
   per the frontend's documented contract, without restoring it to the user.
5. The public profile route (`GET /api/public/cards/:token`) never returns personal data
   for a card that is deleted, disabled, or whose owner is disabled — it returns just a
   status flag so the frontend can render its "card unavailable" page.

## Endpoints implemented

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

POST   /api/admin/auth/login
GET    /api/admin/auth/me
POST   /api/admin/auth/logout

GET    /api/profile
PUT    /api/profile
PUT    /api/profile/password

GET    /api/cards
POST   /api/cards
PUT    /api/cards/:id
PATCH  /api/cards/:id/enable
PATCH  /api/cards/:id/disable
DELETE /api/cards/:id

GET    /api/public/cards/:token

GET    /api/admin/users
GET    /api/admin/users/:id
POST   /api/admin/users
PUT    /api/admin/users/:id
PATCH  /api/admin/users/:id/disable
PATCH  /api/admin/users/:id/enable
DELETE /api/admin/users/:id

GET    /api/admin/cards
POST   /api/admin/cards
PUT    /api/admin/cards/:id
PATCH  /api/admin/cards/:id/disable
PATCH  /api/admin/cards/:id/enable
DELETE /api/admin/cards/:id
```

## Connecting the frontend

In `nfc-card-frontend`, set:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

(or your deployed API URL + `/api` in production), then `npm run dev`.

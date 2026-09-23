# AI Capsule - Cloud Deployed Prompt Manager

## Deployment Details
- **Deployed URL:** https://ai-capsule-bfe5.onrender.com
- **Cloud Platform:** Render (Web Service)

## Installation and Run Instructions
To run this project locally:
1. Run `npm install` in the root directory to install backend dependencies.
2. Run `cd frontend && npm install` to install frontend dependencies.
3. Add your `.env` variables in the root directory.
4. Run `npm run dev` in the root directory. This will start the backend server on port 3000.
5. Go to `http://localhost:3000` in your browser.

## Mandatory API Routes
- `/`: Explains AI Capsule (served via React Router)
- `/login`: Starts OAuth login by redirecting to GitHub.
- `/dashboard`: Protected dashboard (served via React Router).
- `GET /api/health`: Returns `{ "status": "ok" }`.
- `GET /api/capsules`: Returns all prompts owned by the authenticated user.
- `POST /api/capsules`: Creates a new prompt record for the user.
- `PUT /api/capsules/:id`: Updates a prompt record (only if owned by the user).
- `DELETE /api/capsules/:id`: Deletes a prompt record (only if owned by the user).

The React frontend communicates with the Express API using the `axios` library.

## OAuth and JWT
- **OAuth Provider:** GitHub
- **How it works:** When a user clicks login, they hit `/login` and are redirected to GitHub. After logging in, GitHub redirects back to `/api/auth/callback` with a code. Express uses this code to get a GitHub access token, fetches the user's GitHub ID, and then signs an application JWT containing the `user_id`. 
- **Storage and Verification:** This JWT is sent to the browser stored in a Secure, HttpOnly cookie named `token`. For any protected route, the `authMiddleware` checks for this cookie and verifies the JWT signature before allowing access.

## Environment Variables
The following environment variables are used (without revealing secret values):
- `PORT` (optional, defaults to 3000)
- `JWT_SECRET` (used to sign/verify JWTs)
- `GITHUB_CLIENT_ID` (from GitHub OAuth App)
- `GITHUB_CLIENT_SECRET` (from GitHub OAuth App)
- `GITHUB_CALLBACK_URL` (URL to return to after GitHub login)
- `NODE_ENV` (used to set secure cookie flags in production)

## Database Configuration
- **Creation:** The database uses SQLite. It automatically creates a `capsules.db` file and the `capsules` table if they do not exist when the server starts.
- **Ownership:** Every time a prompt is created, the backend extracts the verified `user_id` from the JWT and saves it as the owner of the record in the database.
- **Storage Limitation:** Because the application is deployed on Render's free tier, the file system is ephemeral. This means the `capsules.db` file (and all saved prompts) will be permanently lost every time the Render server goes to sleep or restarts.

## Required cURL Commands
Before submission, run these against your deployed URL and paste the output here:

# Test 1 - no authentication
cURL command: `curl -i https://ai-capsule-bfe5.onrender.com/api/capsules`
Result:
```
HTTP/2 401 
date: Wed, 23 Sep 2026 12:17:48 GMT
content-type: text/html; charset=utf-8
access-control-allow-origin: *
cf-cache-status: DYNAMIC
etag: W/"c-nZ8v8RL9rnQ4Jsq4VnjswLAAxa8"
rndr-id: 96079427-a99b-435e
server: cloudflare
vary: Accept-Encoding
x-powered-by: Express
x-render-origin-server: Render
cf-ray: a3f97d023a95f0dc-MEL
alt-svc: h3=":443"; ma=86400

unauthorized
```

# Test 2 - fake / invalid JWT
cURL command: `curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-bfe5.onrender.com/api/capsules`
Result:
```
HTTP/2 401 
date: Wed, 23 Sep 2026 12:18:03 GMT
content-type: text/html; charset=utf-8
access-control-allow-origin: *
cf-cache-status: DYNAMIC
etag: W/"c-nZ8v8RL9rnQ4Jsq4VnjswLAAxa8"
rndr-id: 07928219-a8c3-4423
server: cloudflare
vary: Accept-Encoding
x-powered-by: Express
x-render-origin-server: Render
cf-ray: a3f97d6598a3b62e-MEL
alt-svc: h3=":443"; ma=86400

unauthorized
```

## Honest Limitation
The application currently uses SQLite stored directly on the server's local file system. Because Render uses ephemeral storage for free web services, all data is lost whenever the server restarts. Using a managed database like PostgreSQL would fix this.

## AI-Assisted Development
- **Tools Used:** Google Antigravity 
- **Problem Found and Corrected:** 
  1. When initially setting up the React frontend, clicking the login button just reloaded the frontend page instead of talking to the backend. This was corrected by setting up the React proxy and configuring the button to correctly target the backend's `/login` route, allowing it to bypass React Router and trigger the OAuth flow.
  2. During Render deployment, the application crashed with a `GLIBC_2.38 not found` error because the latest `sqlite3` package (v6) now requires a newer Linux environment than Render's free tier currently provides. This was fixed by downgrading the `sqlite3` package to `v5.1.7` in the `package.json`, which has pre-built binaries that are perfectly compatible with Render's servers.
- **Verification of OAuth/JWT:** Verified by checking the browser cookies to confirm the `token` cookie was set as HttpOnly after GitHub login, and testing that the dashboard correctly loads the user's data while unauthenticated API calls return 401 Unauthorized.
- **Verification of CRUD/Ownership:** Verified by creating records and checking the SQLite database to confirm the `user_id` column was correctly populated, and ensuring that GET/PUT/DELETE routes strictly filter by this `user_id`.
- **Implementation Decision:** I decided to serve the built React frontend directly from the Express backend using `express.static()`. This simplifies deployment because everything runs on one server and one URL, completely avoiding complicated CORS issues between the frontend and backend.

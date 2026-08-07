# Financial Goals Planner

A personal finance planning web app based on the 8-step Financial Goals Worksheet.

- **No database** — each user's data is saved in their own private Google Sheet
- **Google Sign-In** — authenticate with any Google account
- **Household sharing** — family members can share the same plan
- **Auto-saves** — every change syncs to Google Sheets 2 seconds after you stop typing

## Quick start

See **[SETUP.md](SETUP.md)** for full instructions.

**TL;DR:**
1. Create a Google Cloud project, enable Sheets + Drive APIs
2. Get an API key and OAuth Client ID
3. Fill in `GSHEET_CONFIG` in `index.html` (~line 1564)
4. Push to GitHub → deploy to Code Engine (or run locally)

## Local development

```sh
cd server && node server.js
# open http://localhost:8080
```

## Deploy to IBM Cloud Code Engine

See **[DEPLOY.md](DEPLOY.md)** for full instructions.

```sh
docker build -t us.icr.io/<namespace>/fp-app:latest .
docker push us.icr.io/<namespace>/fp-app:latest

ibmcloud ce application create \
  --name financial-planner \
  --image us.icr.io/<namespace>/fp-app:latest \
  --port 8080 --min-scale 0 --max-scale 2 \
  --cpu 0.125 --memory 0.25G
```

## Household sharing

To let your wife see your plan, add one line to `GSHEET_CONFIG` in `index.html`:

```js
household: {
  'wife@gmail.com': 'your@gmail.com',
},
```

Then share your Google Sheet file with her (Editor access) — see SETUP.md.

## Tech stack

| Layer | What |
|---|---|
| Frontend | Single HTML file — no build step, no framework |
| Auth | Google Identity Services (OAuth 2.0) |
| Storage | Google Sheets API + Google Drive API (`drive.file` scope) |
| Server | Express.js — serves `index.html` only |
| Container | UBI9 Node 20 minimal |
| Hosting | IBM Cloud Code Engine (or any static host) |

# Setup Guide — Google Sheets Backend (Per-User Private Sheets)

No server, no database, no hosting required.  
Each user's data is saved in **their own private Google Sheet** in their own Google Drive.  
Nobody can see anyone else's data — enforced by Google itself.

---

## How data isolation works

```
Alice signs in  →  App creates "Financial Goals Planner — My Data" in Alice's Drive
Bob signs in    →  App creates "Financial Goals Planner — My Data" in Bob's Drive
You sign in     →  App creates "Financial Goals Planner — My Data" in your Drive
```

Each person's file is private to them. The `drive.file` OAuth scope means the app
can **only** read/write files it created — it cannot touch any other Drive files.

---

## Step 1 — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**
3. Name it `financial-planner` → **Create**

---

## Step 2 — Enable APIs

1. Go to **APIs & Services → Library**
2. Enable **Google Sheets API**
3. Enable **Google Drive API**

---

## Step 3 — Get an API Key

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → API key**
3. Copy the key — this is your `GOOGLE_API_KEY`
4. Click **Edit API key → Restrict key**:
   - API restrictions → select **Google Sheets API** and **Google Drive API**
   - Website restrictions → add your origins (see Step 6)

---

## Step 4 — Set up OAuth 2.0

1. Go to **APIs & Services → OAuth consent screen**
   - User type: **External** → Create
   - App name: `Financial Planner`
   - User support email + Developer contact: your email
   - **Scopes**: click "Add or Remove Scopes" and add:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`
   - **Test users**: add every Google account that will use the app
     *(while the app is in Testing mode — up to 100 users)*
   - Save and Continue through all steps

2. Go to **Credentials → + Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Financial Planner`
   - Authorised JavaScript origins — add all of these:
     ```
     http://localhost:8080
     http://localhost:5500
     http://127.0.0.1:5500
     https://your-code-engine-url.us-south.codeengine.appdomain.cloud
     ```
   - Click **Create** → copy the **Client ID**

---

## Step 5 — Add credentials to index.html

Find this block near the bottom of `index.html` (~line 1564):

```js
const GSHEET_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID',   // ← paste your OAuth Client ID
  apiKey:   'YOUR_GOOGLE_API_KEY',      // ← paste your API key
  fileName: 'Financial Goals Planner — My Data',  // leave as-is
};
```

Replace the two placeholder values. The `fileName` is the name of the Sheet
that will be created in each user's Google Drive — you can change it if you like.

> **No spreadsheetId needed** — each user gets their own Sheet created automatically
> on first sign-in. You don't need to create any Sheet yourself.

---

## Step 6 — Run it locally

Google OAuth requires `http://` (not `file://`). Start a simple local server:

**Python (built-in):**
```sh
cd /Users/prudhvi/Desktop/financial_planning
python3 -m http.server 8080
```
Open: **http://localhost:8080**

**Or run via Node (already in the project):**
```sh
cd server && node server.js
```
Open: **http://localhost:8080**

---

## Step 7 — First sign-in (any user)

1. User clicks **Sign in with Google**
2. Google OAuth popup — user selects their account
3. Permission screen appears asking for:
   - *"See, edit, create, and delete only the specific Google Drive files you use with this app"*
   - *"See, edit, create, and delete all your Google Sheets spreadsheets"*
4. User clicks **Allow**
5. App automatically creates `Financial Goals Planner — My Data` in that user's Drive
6. App loads — data is empty (new user). User starts filling in their plan.
7. Every change auto-saves to their Sheet 2 seconds later.

On every subsequent sign-in the app finds the existing Sheet and loads their data.

---

## What users see in their Google Drive

Each user will find a file called **"Financial Goals Planner — My Data"** in their Drive.
The file contains one data row — a JSON blob with all their goals, assets, and profile.
They can see it exists but shouldn't edit it manually (it would break the JSON).

---

## Publishing beyond Test mode (more than 100 users)

While in *Testing* mode, only Google accounts you added as Test Users can sign in.  
To open the app to anyone with a Google account:

1. **APIs & Services → OAuth consent screen**
2. Click **Publish App**
3. If asked for verification (only required if you request sensitive scopes),
   `drive.file` is **not a sensitive scope** — publishing is instant with no review.

---

## Environment variables for Code Engine

None needed. The server is just a static file host.

```sh
ibmcloud ce application create \
  --name financial-planner \
  --image us.icr.io/<namespace>/fp-app:latest \
  --port 8080 --min-scale 0 --max-scale 2 \
  --cpu 0.125 --memory 0.25G
```

Add the Code Engine URL to **Authorised JavaScript origins** in your OAuth Client ID settings.

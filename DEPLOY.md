# Deploy to IBM Cloud Code Engine — Step-by-Step

## Prerequisites
- IBM Cloud account with Code Engine and Container Registry access
- `ibmcloud` CLI with plugins: `code-engine` and `container-registry`
  ```sh
  ibmcloud plugin install code-engine
  ibmcloud plugin install container-registry
  ```

---

## Step 1 — Log in to IBM Cloud
```sh
ibmcloud login --sso
# or with API key:
ibmcloud login --apikey <YOUR_APIKEY> -r us-south
```

---

## Step 2 — Provision a PostgreSQL database

Option A — **IBM Cloud Databases for PostgreSQL** (recommended):
1. Go to [IBM Cloud Catalog → Databases for PostgreSQL](https://cloud.ibm.com/catalog/services/databases-for-postgresql)
2. Create a Lite or Standard instance
3. After provisioning: **Service credentials → New credential → Auto-generate**
4. Copy the `connection.postgres.composed[0]` value — that is your `DATABASE_URL`
   - It looks like: `postgres://ibm_cloud_xxx:password@host:port/ibmclouddb?sslmode=verify-full`

Option B — **ElephantSQL** (free, quick for testing):
1. Sign up at https://www.elephantsql.com
2. Create a "Tiny Turtle" (free) instance
3. Copy the URL from the dashboard — set `DATABASE_SSL=false` for ElephantSQL

Option C — **Neon.tech** (free Postgres, serverless):
1. Sign up at https://neon.tech
2. Create a project, copy the connection string
3. SSL is already embedded in the URL; no extra env var needed

---

## Step 3 — Build & push the container image

### 3a — Target IBM Container Registry
```sh
ibmcloud cr login
ibmcloud cr namespace-add financial-planner   # only needed once
```

### 3b — Build and push
```sh
# From the project root (financial_planning/)
docker build -t us.icr.io/financial-planner/app:latest .
docker push us.icr.io/financial-planner/app:latest
```

> Alternatively, Code Engine can build from source directly — see Step 4b.

---

## Step 4 — Create the Code Engine project and app

### 4a — Set up project
```sh
ibmcloud ce project create --name financial-planner
ibmcloud ce project select  --name financial-planner
```

### 4b — Create secrets (environment variables)
```sh
ibmcloud ce secret create --name fp-secrets \
  --from-literal DATABASE_URL="<your-postgres-url>" \
  --from-literal JWT_SECRET="<random-32-char-string>"
```
Generate a JWT secret:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4c — Deploy the application

**From pre-built image (recommended):**
```sh
ibmcloud ce application create \
  --name financial-planner \
  --image us.icr.io/financial-planner/app:latest \
  --registry-secret icr-secret \
  --env-from-secret fp-secrets \
  --port 8080 \
  --min-scale 0 \
  --max-scale 3 \
  --cpu 0.25 \
  --memory 0.5G
```

**From source (Code Engine builds it for you):**
```sh
ibmcloud ce application create \
  --name financial-planner \
  --build-source . \
  --build-strategy dockerfile \
  --env-from-secret fp-secrets \
  --port 8080 \
  --min-scale 0 \
  --max-scale 3 \
  --cpu 0.25 \
  --memory 0.5G
```

---

## Step 5 — Get your app URL
```sh
ibmcloud ce application get --name financial-planner --output url
```
Your app will be live at something like:
`https://financial-planner.<random>.us-south.codeengine.appdomain.cloud`

---

## Step 6 — Verify health
```sh
curl https://<your-app-url>/health
# → {"status":"ok"}
```

---

## Updating the app after code changes

```sh
# Rebuild & push
docker build -t us.icr.io/financial-planner/app:latest .
docker push us.icr.io/financial-planner/app:latest

# Trigger a new revision
ibmcloud ce application update --name financial-planner \
  --image us.icr.io/financial-planner/app:latest
```

---

## Environment Variables Reference

| Variable       | Required | Description                                              |
|----------------|----------|----------------------------------------------------------|
| `DATABASE_URL` | ✅        | Full PostgreSQL connection string                        |
| `JWT_SECRET`   | ✅        | Random secret for signing JWT tokens (32+ chars)         |
| `DATABASE_SSL` | optional | Set to `false` only for local Postgres without TLS       |
| `PORT`         | optional | Defaults to `8080` (Code Engine sets this automatically) |

---

## Local testing (without Docker)

```sh
cd server
npm install

# Start with a local Postgres or any connection string
DATABASE_URL="postgres://user:pass@localhost:5432/fp" \
DATABASE_SSL=false \
JWT_SECRET="local-dev-secret" \
node server.js
```
Then open http://localhost:8080

---

## File layout in the container

```
/app/
├── server.js       ← Express API + static file server
├── package.json
├── node_modules/
└── index.html      ← Full SPA frontend (served at /)
```

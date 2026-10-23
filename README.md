# 🧠 Helping Brain

Helping Brain is a modern AI-powered second brain application designed to help users organize knowledge, capture ideas, and retrieve information effortlessly.

Instead of searching through countless notes, Helping Brain allows you to organize everything into workspaces and folders while using AI to search across all your notes.

---

## ✨ Features

- 🔐 Secure Authentication
- 📁 Workspace Management
- 📂 Folder Organization
- 📝 Rich Note Editor
- 🔗 External links that open in a new tab
- 🖼️ Persistent image upload and clipboard paste
- 📌 Collaborative sticky notes with creator-only editing
- 🤖 AI Search Across Notes
- 🔍 Full-text Search
- 🌙 Modern Minimal UI
- 📱 Responsive Design

---

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Lucide Icons

### Backend

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation

### AI backend

- Python
- FastAPI
- LangChain
- OpenRouter-hosted model

---

## Project Structure

```
Helping-Brain/
├── second-brain-frontend/  # React + Vite
├── second-brain/           # Express + TypeScript + Prisma
├── ai-development/         # FastAPI + LangChain
└── README.md
```

---

## Screenshots

(Add screenshots here)

---

## Getting Started

### Clone

```bash
git clone https://github.com/yourusername/helping-brain.git
```

---

### Frontend

```bash
cd second-brain-frontend
npm ci
npm run dev
```

Runs on

```
http://localhost:5173
```

---

### Node.js backend

```bash
cd second-brain
npm ci
npm run dev
```

Runs on

```
http://localhost:3000
```

### Python AI backend

```powershell
cd ai-development
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## Environment Variables

Configure local secrets in untracked `.env` files. Never commit or share them.

**Frontend** (`second-brain-frontend/.env.local`):

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=
```

**Node.js backend** (`second-brain/.env`):

```env
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=
```

**Python AI backend** (`ai-development/.env`):

```env
OPENROUTER_API_KEY=
AI_SERVICE_TOKEN=
NODE_URL=http://localhost:3000
```

`AI_SERVICE_TOKEN` must have the same randomly generated value in both backend `.env` files.

---

## Deploy to Render

Deploy the three services separately from this repository. The Python service calls OpenRouter; it does not download or run a local model. Provide an OpenRouter API key and expect provider rate limits. Render Free web services have 512 MB RAM and shared monthly instance hours, and can sleep after 15 minutes without inbound traffic. This causes cold starts and can briefly interrupt live updates; saved page contents remain in Neon. No persistent Render disk is required.

### Static site — React frontend

- **Root Directory:** `second-brain-frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment:** `VITE_API_URL=https://<node-service>.onrender.com` (the frontend adds `/api` automatically; an existing `/api` suffix is also accepted), `VITE_GOOGLE_CLIENT_ID=<Google OAuth web client ID>`
- Add a Render rewrite from `/*` to `/index.html` so React Router invite links work when opened directly.

### Web service — Node.js API

- **Root Directory:** `second-brain`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`
- **Environment:** `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL=https://<frontend>.onrender.com`, `AI_SERVICE_URL=https://<python-service>.onrender.com`, and `AI_SERVICE_TOKEN`
- Render provides `PORT`; the server binds to `0.0.0.0`.

### Web service — Python AI API

- **Root Directory:** `ai-development`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment:** `OPENROUTER_API_KEY`, `AI_SERVICE_TOKEN` (same value as Node), and `NODE_URL=https://<node-service>.onrender.com`

Get `DATABASE_URL` from Neon and `OPENROUTER_API_KEY` from OpenRouter. `DATABASE_URL` must be present during the Node build as well as at runtime because Prisma loads its config during client generation. Generate `JWT_SECRET` and `AI_SERVICE_TOKEN` yourself; keep both private. Use exact deployed origins without trailing slashes. In Google Cloud, add the deployed frontend domain as an authorized JavaScript origin for the OAuth web client. The Python service uses Python 3.13.9 as specified in `.python-version`.

Deploy Python first, prepare the Neon schema, then deploy Node and the static site. Verify Neon connectivity and authentication before sharing an invite link.

For an existing Neon database that was originally synchronized with `prisma db push`, run `npx prisma db push` from `second-brain` once before deploying the Node service so the collaboration tables, page attribution/revision fields, page-image storage, and sticky-note tables are added. This is an additive schema update; it does not restore deleted rows. Do not run `prisma migrate reset`. For a brand-new database with no schema, run `npx prisma migrate deploy` instead.

Workspace invite links do not expire and can be used by multiple Google-authenticated users until the owner revokes or replaces the link. Revoking the link prevents future joins; it does not remove members who already joined. Collaborators see saved updates live and the page's latest editor name. Non-overlapping text edits are merged when possible; conflicting edits are protected from silent overwrites and require the user to choose which version to load. Page images are stored in Neon as their original file, with a 5 MB per-image limit. Sticky notes are visible to page collaborators, but only the author can edit or delete each note.
---

## Roadmap

- [x] Authentication
- [x] Workspace
- [x] Folder Management
- [x] Dashboard
- [X] Rich Text Editor
- [ ] AI Search
- [ ] File Upload
- [ ] Tags
- [x] Shared Workspaces
- [ ] AI Summaries
- [ ] Markdown Support
- [ ] Mobile Responsive Improvements

---

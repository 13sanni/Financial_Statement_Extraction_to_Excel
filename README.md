# Financial Statement Extraction to Excel

Web app to upload income-statement PDFs, extract key rows, and generate Excel output.

## What This Solves

Manual financial statement extraction is slow and error-prone.  
This project provides:

- PDF upload for one or many files
- Structured extraction (Auto / Gemini / Rule mode)
- Excel generation for extracted rows
- Run tracking dashboard (summary, runs, queue, exports)
- Auth with user roles (admin vs analyst)

## How It Works

1. User logs in.
2. User uploads PDF(s) and starts extraction.
3. Backend extracts statement rows from text.
4. Backend generates an Excel workbook.
5. Excel file is returned immediately to browser download.
6. Metadata (run status, counts, warnings) is saved in MongoDB for portal views.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS v4
- Zod (response validation)

### Backend

- Node.js + TypeScript
- Express 5
- MongoDB + Mongoose
- JWT auth
- Multer (multipart uploads, memory)
- pdf-parse
- ExcelJS
- Zod
- Google Gemini SDK (`@google/genai`) for optional LLM extraction

## Built-in Libraries and Purpose

### Backend dependencies

- `express`: HTTP API server and routing
- `mongoose`: MongoDB models and queries
- `dotenv`: environment variable loading
- `cors`: cross-origin support for frontend
- `helmet`: secure HTTP headers
- `express-rate-limit`: API throttling
- `jsonwebtoken`: sign/verify JWT tokens
- `bcryptjs`: password hashing
- `multer`: file upload handling (`multipart/form-data`)
- `pdf-parse`: text extraction from PDF buffers
- `exceljs`: generate `.xlsx` output files
- `zod`: request/response validation contracts
- `@google/genai`: Gemini extraction mode

### Frontend dependencies

- `react`, `react-dom`: UI rendering
- `react-router-dom`: multi-page routing
- `axios`: API calls
- `zod`: API payload validation
- `tailwindcss`: styling
- `vite`: dev/build tooling

## Roles and Access

### Analyst/User can:

- Register and login
- Upload PDFs and run extraction
- View dashboard/runs/exports pages
- Delete individual runs

### Admin can additionally:

- Open `Admin` page (`/maintenance`)
- Cleanup old history (`cleanup by days`)
- Delete all history

## Admin Credentials (Demo)

From `backend/.env.example`:

- `ADMIN_EMAIL=admin@example.com`
- `ADMIN_PASSWORD=change_me`

Use these only for local testing.  
Change immediately in production.

## Local Setup

## 1) Backend

```bash
cd backend
npm install
```

Create `backend/.env` (copy from `.env.example`) and set:

- `MONGO_URI`
- `JWT_SECRET`
- optional: `GEMINI_API_KEY`
- optional admin bootstrap:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

Run backend:

```bash
npm run dev
```

Backend default port: `4000`  
(from `backend/src/index.ts`, falls back to `4000` if `PORT` is not set)

## 2) Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Run frontend:

```bash
npm run dev
```

Frontend default dev port: `5173` (Vite default)

## API Overview

- `POST /auth/register`
- `POST /auth/login`
- `POST /tools/income-statement?mode=auto|gemini|rule`
- `GET /portal/summary`
- `GET /portal/upload-queue`
- `GET /portal/runs`
- `GET /portal/runs/:runId/jobs`
- `DELETE /portal/runs/:runId`
- `GET /portal/downloads`
- Admin only:
  - `POST /portal/runs/cleanup`
  - `POST /portal/runs/cleanup-all`

## Current Storage Behavior

This version does **not** use cloud file storage.

- PDFs and generated Excel are processed in request flow.
- Excel is downloaded immediately by browser.
- File URLs are not persisted to an external storage service.
- MongoDB stores run/job metadata for dashboard views.

## Demo PDF for Testing

- Sample file included at `samples/demo-income-statement.pdf`
- Use it from the upload section to quickly validate end-to-end extraction.

## Deploy Notes

- Set backend env vars in your host (Render, etc.).
- Set frontend env:
  - `VITE_API_BASE_URL=<your-backend-url>`
- Ensure backend CORS allows your frontend origin.

You can add your deployed URLs below:

- Frontend URL: `https://financial-statement-extraction-to-e.vercel.app/login`
- Backend URL: `https://financial-statement-extraction-to-excel.onrender.com`

## Quality Checks

Recommended before deploy:

```bash
# frontend
npm run lint
npm run build

# backend
npm run build
```

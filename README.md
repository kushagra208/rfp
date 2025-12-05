# AI-Powered RFP Management System

This repository is a full-stack demo for managing Requests for Proposals (RFPs) with AI-powered proposal parsing and comparison.

## Project Structure

- `backend/` — Node.js + Express API server
  - Sequelize ORM (PostgreSQL by default)
  - AI integration (Google Gemini via `@google/genai`)
  - Email sending (Mailgun)
  - Service layer, error handling, and proposal comparison
- `frontend/` — React (Vite) + Material-UI
  - Create/view RFPs, manage vendors, ingest proposals, AI-powered comparison
- `db/` — SQL migration for initial schema
- `samples/` — Example vendor email and expected parsed output

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or SQLite with config tweaks)
- Mailgun API key (for email sending)
- Google Gemini API key (for AI parsing/comparison)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB and API keys
npm install
npm run dev
```
- The backend runs on http://localhost:4000
- Endpoints: `/api/rfps`, `/api/vendors`, `/api/email/inbound`, `/api/rfps/:id/compare`, etc.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- The frontend runs on http://localhost:5173

### Simulate Inbound Email (for demo/testing)
```bash
curl -X POST http://localhost:4000/api/email/inbound \
  -H "Content-Type: application/json" \
  -d '{"recipient":"rfp-<rfp_id>@inbound.local","sender":"vendor@example.com","subject":"Re: RFP ...","body-plain":"... vendor response ..."}'
```

## Features
- Create RFPs from natural language
- Add/manage vendors
- Ingest proposals via email webhook
- AI-powered proposal parsing and comparison
- Centralized error handling and robust input validation
- Frontend: Toast notifications, modals, and tabular AI comparison results

## Customization & Next Steps
- Replace API keys and endpoints as needed
- Add authentication and multi-user support for production
- Extend AI prompts or swap model as needed in `backend/services/ai.js`
- Add PDF/Excel parsing for attachments if required

---

For questions or contributions, open an issue or PR.

# cf-ai-syllabus-parser

An AI-powered tool that extracts course deadlines and assignments from a syllabus (PDF or pasted text) and formats them into a calendar-friendly list.

## 🚀 Features
- Upload or paste your syllabus  
- Uses **Llama 3.3** on **Cloudflare Workers AI** to extract due dates  
- Returns structured results (JSON, CSV, or ICS)  
- Stores data using **Cloudflare KV** for persistence  
- Built with **Vite + React + Hono + Workers**

## 🧠 Tech Stack
- **Frontend:** Vite + React (Cloudflare Pages)  
- **Backend:** Cloudflare Workers + Hono  
- **AI:** Workers AI (@cf/meta/llama-3-8b-instruct)  
- **Storage:** Cloudflare KV

## ⚙️ Run Locally
```bash
npx wrangler dev --remote

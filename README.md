# SpeedReader

A self-hosted speed-reading web app. Upload a book or document and read it in several modes, including RSVP (one word at a time at a set speed), while the app keeps your place, notes, bookmarks and reading statistics.

> **Personal project, built with AI assistance.** The first version was generated with Abacus.ai's DeepAgent. I deploy, run and maintain it on my own home server and keep it as a hands-on example of working with AI-generated code in a real deployment.

## Screenshots
| Library (book titles blurred) | Reader (RSVP / chunking) | Settings |
|---|---|---|
| ![Library](docs/screenshots/library.jpg) | ![Reader](docs/screenshots/reader-rsvp.jpg) | ![Settings](docs/screenshots/settings.jpg) |

## What it does
- **Library** of uploaded documents (from a file or a URL).
- **Five reading modes:** normal, chunk, highlight, guided and RSVP.
- **Bookmarks, annotations, notes (with categories) and flashcards.**
- **Sessions and statistics** (reading speed over time, charts).
- **Settings** for accent and highlight colours, reading font and light/dark theme.
- Text extraction from plain text, Markdown, HTML, DOCX, PDF and EPUB, done in the browser (pdf.js, epub.js, mammoth).

## Quick start (Docker)
You need [Docker](https://docs.docker.com/get-docker/) with Compose. Nothing else.

```bash
git clone https://github.com/MooseChild/SpeedReader.git
cd SpeedReader
docker compose up --build
```

The first build takes a few minutes. Then open **http://localhost:3000**, click **Upload Document**, and add an EPUB, PDF, DOCX or text file.

- Your library lives in two Docker volumes (`pgdata` for the database, `books` for the uploaded files), so it survives restarts.
- Stop it with `docker compose down` (data is kept). `docker compose down -v` also deletes the data.
- No Docker? See [DEPLOYMENT.md](DEPLOYMENT.md) for a manual install with Node.js and PostgreSQL.

## How it works
1. **Upload.** The browser reads the file and extracts its text itself (pdf.js for PDF, epub.js for EPUB, mammoth for DOCX, plain reading for text, Markdown and HTML). The original file is saved to the books folder and the text goes into PostgreSQL.
2. **Read.** The reader shows the words in one of five modes: RSVP (one word at a time at your speed), chunk, guided, highlight and normal. You set the words-per-minute, and your position is saved as you go.
3. **Remember.** Reading sessions, bookmarks, annotations, notes and flashcards are stored per document and feed the Stats page.
4. **Persist.** Prisma manages the schema (`prisma/schema.prisma`). On start the container runs `prisma db push`, which creates the tables if they are missing.

## Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS with shadcn/ui, Prisma 6, PostgreSQL. Plotly draws the charts.

## How it runs on my homelab
A Node process under pm2 in a Proxmox LXC container, with a local PostgreSQL database, books mounted from a separate disk, and a Cloudflare Tunnel in front. Updates follow a back-up, stop, replace, migrate, restart, verify routine with a rollback path.

## Security notes (read before putting it online)
- **There is no login.** Anyone who can reach the app can read, upload and delete documents. The Compose file therefore binds to `127.0.0.1` only. If you expose it, put something in front of it that asks for a login (a VPN, or a proxy with authentication such as Cloudflare Access).
- **"Upload from URL"** makes the server fetch whatever address it is given. Do not expose it to the internet or a network you do not trust.
- The default database password in `docker-compose.yml` is for local use only.
- No secrets are committed. Configuration is in environment variables; see `.env.example`.
- There is no automated test suite yet.

## Leftovers from the generated version
Parsing happens in the browser, so no cloud service is needed to import books. One unused server route (`app/api/documents/[id]/parse`) still calls Abacus.ai's hosted API for PDFs and needs `ABACUSAI_API_KEY`, and the root layout loads a script from Abacus.ai (`app/layout.tsx`). Both can be removed for a fully self-contained build. NextAuth is installed but not used.

## How this was built (with AI, step by step)
- **First version:** generated with Abacus.ai's DeepAgent. I deployed it on my homelab and have kept it running since.
- **Publishing it (11 November 2026):** I asked Claude Code (Anthropic's coding agent) to help me put it on GitHub. It scanned the code for secrets, IP addresses and my domain before anything was committed, wrote the README, and corrected its own first draft after checking the code (it had wrongly said PDFs need a cloud API).
- **Making it deployable (same day):** I then asked whether anyone could run it. Claude Code read the code, found that the app has no login, and added the Dockerfile and `docker-compose.yml` so that `docker compose up` works, with the port bound to localhost for that reason. It built and ran the image in a test container before this was pushed. It also added the security notes above.

I direct the work, check what it produces, and run the result. The AI wrote most of the code and the setup around it.

## Licence
MIT. See [LICENSE](LICENSE).

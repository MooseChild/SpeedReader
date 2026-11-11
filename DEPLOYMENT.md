# Self-hosting guide (manual install)

> The easiest way to run SpeedReader is Docker: see **Quick start** in the [README](README.md). This guide is for installing it directly with Node.js and PostgreSQL.

A local-first speed reading web app. Importing and reading need no cloud service (see the README for two optional Abacus.ai leftovers).

## Requirements

- **Node.js 18+** and **yarn** (or npm)
- **PostgreSQL 14+** database
- A filesystem path for book storage (default: `/mnt/books`)

## Quick Start

### 1. Clone / Extract

```bash
git clone https://github.com/MooseChild/speedreader.git speedread
cd speedread
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and edit:

```bash
cp .env.example .env
```

Required variables:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/speedread?schema=public"

# Book storage directory (must be writable by the app)
BOOKS_STORAGE_PATH="/mnt/books"

# NextAuth (required for session handling — set to your domain)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"  # generate with: openssl rand -base64 32
```

### 4. Initialize Database

```bash
yarn prisma db push
```

This creates all tables in your PostgreSQL database.

### 5. Create Storage Directories

```bash
mkdir -p /mnt/books/notes
chown -R youruser:youruser /mnt/books
```

### 6. Run (Development)

```bash
yarn dev
```

Open `http://localhost:3000`.

### 7. Run (Production)

```bash
yarn build
yarn start
```

For production behind a reverse proxy (nginx/Caddy), set `NEXTAUTH_URL` to your public URL.

## Architecture

### Storage

- **Books**: Stored as files on disk at `$BOOKS_STORAGE_PATH` (default `/mnt/books`)
- **Notes files**: Stored at `$BOOKS_STORAGE_PATH/notes/`
- **Metadata**: PostgreSQL database (documents, sessions, bookmarks, annotations, notes, flashcards, settings)
- **Offline cache**: IndexedDB in the browser (books cached for offline reading)

### Features

- **5 reading modes**: Normal (scroll), RSVP, Chunking, Guided, Highlight
- **File support**: PDF, EPUB, DOCX, TXT, MD, CSV, HTML, XML, JSON
- **Front-matter detection**: Auto-detects front-matter in uploaded books; manually adjustable per book
- **Notes & Flashcards**: Create notes manually, import from .txt/.md files, create flashcards, organize with color-coded categories
- **Editable metadata**: Edit book title, author; original filename preserved
- **Theme customization**: Accent color, highlight color, reading font (Settings page)
- **Reading statistics**: Sessions tracked, WPM history, progress charts
- **Bookmarks & Annotations**: In-reader bookmarking and text annotation
- **Dark/Light mode**: System-aware theme toggle
- **Mobile-first**: Touch-optimized, responsive UI

### No Cloud Dependencies

- No AWS / S3 / cloud storage
- No LLM / AI APIs
- No external services
- Fully self-contained

## Proxmox / LXC Notes

If running in a Proxmox container:

1. Bind-mount your storage: `mp0: /path/on/host,mp=/mnt/books`
2. Ensure the container user has write access to `/mnt/books`
3. Use a separate PostgreSQL instance or container

## Backup

1. **Database**: `pg_dump speedread > backup.sql`
2. **Books**: `tar czf books-backup.tar.gz /mnt/books`

## Troubleshooting

- **"ENOENT" on upload**: Ensure `/mnt/books` exists and is writable
- **Database connection error**: Check `DATABASE_URL` in `.env`
- **PDF rendering issues**: `pdfjs-dist` is used client-side; no server-side canvas needed
- **EPUB not working**: `epubjs` handles EPUB parsing client-side

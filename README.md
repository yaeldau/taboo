# טאבו — Hebrew Online Taboo Game

A real-time Hebrew Taboo game built with Next.js and Supabase Realtime. Mobile-first, RTL, no login required.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Font | Heebo (Hebrew + Latin) |
| Real-time | Supabase Realtime (Broadcast) |
| Deployment | Vercel |

## Project Structure

```
taboo/
├── app/
│   ├── page.tsx               # Landing page
│   └── room/[roomId]/
│       └── page.tsx           # Game room
├── components/ui/             # shadcn/ui components
├── data/
│   └── cards.json             # Hebrew taboo cards (~100 cards)
├── lib/
│   ├── cards.ts               # Card loader + shuffler
│   ├── game.ts                # Game state machine
│   ├── room.ts                # Room ID generation
│   └── supabase.ts            # Supabase client + channel helper
└── types/
    └── game.ts                # Shared TypeScript types
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** For running locally without Supabase (skeleton only), the placeholder values in `.env.local` are enough to start the dev server. Real-time features require a live Supabase project.

### 3. Create a Supabase project (for real-time)

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Enable Realtime in the Supabase dashboard (Project Settings → Realtime).
3. Copy your project URL and anon key from Project Settings → API.
4. Paste them into `.env.local`.

No database tables are required — the game uses ephemeral Broadcast channels only.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works (MVP flow)

1. Player A opens the app and clicks **צור משחק חדש** — gets a unique room URL.
2. Player A shares the URL with their friends.
3. Players join by opening the link.
4. The room creator (host) controls game flow and is the source of truth for game state.
5. All clients sync via Supabase Realtime Broadcast (no DB writes during gameplay).

## MVP Features

- [x] Landing page
- [x] Create room (unique link)
- [x] Join room by link
- [ ] Lobby (team setup)
- [ ] Taboo card display
- [ ] Action buttons (Correct / Skip / Taboo)
- [ ] 60-second turn timer
- [ ] Score tracking per team
- [ ] End-of-turn summary
- [ ] New game / reset

## Deployment

```bash
vercel
```

Set the same environment variables in the Vercel dashboard (or via `vercel env add`).

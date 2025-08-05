<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# LiveKit Meet

A Discord-like voice chat application built with LiveKit and Next.js.

## Features

- Real-time voice and video communication
- Discord-like UI with sidebar navigation
- Voice channel presence tracking with Supabase Realtime
- End-to-end encryption support
- Screen sharing capabilities
- Noise suppression

## Setup

### Prerequisites

- Node.js 18+
- LiveKit Cloud account
- Supabase account (for presence tracking)

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Supabase Configuration (for presence tracking)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Enable Realtime in your Supabase dashboard
3. Add the environment variables to your `.env.local` file
4. The presence tracking will automatically work once configured

### Installation

```bash
npm install
npm run dev
```

## Voice Channel Presence

The app uses Supabase Realtime to track who is currently in each voice channel. Users will automatically appear in the sidebar when they join a voice channel and disappear when they leave.

## Development

```bash
npm run dev
npm run build
npm run lint
```

# FreePark

**Real-time Vancouver parking finder — find free and cheap street meters near you.**

![CI](https://github.com/chloe-ek/FreePark/actions/workflows/ci.yml/badge.svg)
&nbsp;

<!-- ![App Store](https://img.shields.io/badge/App_Store-under_review-lightgrey?logo=apple) -->

![Google Play](https://img.shields.io/badge/Google_Play-available-brightgreen?logo=google-play&logoColor=white)

<p align="center">
  <img src="assets/final.png" alt="FreePark app screenshots" width="100%">
</p>

---

## Features

- **Live meter status** — rate, time limit, and payment type updated in real time based on current hour and day
- **Rush hour & holiday awareness** — automatically applies No Parking restrictions and BC statutory holidays
- **4 parking layers** — street meters, accessible spots, motorcycle zones, EV charging stations
- **Nearby list** — sort by price or distance, filter by payment method
- **Crowd-sourced reports** — mark a meter as full; expires automatically
- **Search** — address / landmark search with recent history; falls back to Google Places API only when needed
- **Dark mode** — full light/dark theme support
- **Adjustable radius** — search within 100 m – 1 km

---

## Tech Stack

| Layer              | Choice                                                        |
| ------------------ | ------------------------------------------------------------- |
| Framework          | Expo (React Native) + TypeScript                              |
| Map                | react-native-maps (Google Maps on Android, Apple Maps on iOS) |
| Backend / DB       | Supabase (PostgreSQL + PostGIS)                               |
| Real-time          | Supabase Realtime (spot reports)                              |
| Location           | expo-location                                                 |
| Geocoding / Search | Google Places API                                             |
| Storage            | AsyncStorage (settings, recent searches, report cooldowns)    |
| Data source        | City of Vancouver Open Data                                   |

---

## Architecture

```
src/
├── components/
│   ├── markers/      # Map markers (Meter, Disability, EV, Motorcycle)
│   ├── sheets/       # Bottom sheets (Meter, Disability, EV, Motorcycle)
│   ├── search/       # SearchBar, SearchOverlay
│   ├── ui/           # Shared UI (TabBar, FilterPanel, FloatingPill, etc.)
│   └── ErrorBoundary.tsx
├── constants/        # Geo bounds, map config, layer definitions, storage keys
├── contexts/         # Theme, Settings, ParkingData (React Context)
├── hooks/            # Data fetching (useMapData), filters, location, reports
├── lib/              # Supabase client, geocoding
├── screens/          # MapScreen, NearbyListScreen, SettingsScreen
├── types/            # Database result types, map selection types
└── utils/            # Parking rate logic, BC holiday calculation

supabase/
├── migrations/       # Schema + PostGIS RPC functions (nearby_* queries)
└── functions/        # Edge functions (weekly data sync from Vancouver Open Data)
```

**Data flow**

```
GPS / Search input
       │
       ▼
ParkingDataContext (useMapData → Supabase RPC → PostGIS ST_DWithin)
       │
       ▼
parkingUtils  ←  current time + BC holiday check
       │
       ▼
MapMarkers / NearbyList  →  MapSheets on select
```

Key design decisions:

- All time-sensitive parking logic (rates, rush hours, prohibitions) runs **on-device** — no extra API call needed after data is fetched
- Google Places API is called **only** when local search dataset returns fewer than 3 results
- Spot report cooldown is **1 hour**, persisted in AsyncStorage across sessions. TTL is also enforced in the DB; the app purges stale reports client-side every 60 s as a safety net

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- iOS Simulator / Android Emulator, or physical device with Expo Go

### 1. Clone & install

```bash
git clone https://github.com/chloe-ek/FreePark.git
cd FreePark
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

| Variable                          | Where to get it                              |
| --------------------------------- | -------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`        | Supabase project → Settings → API            |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | Supabase project → Settings → API            |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud Console → Maps SDK + Places API |

### 3. Run

```bash
# Start Metro
npx expo start

# iOS
npx expo run:ios

# Android
npx expo run:android
```

### 4. Build (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# iOS / Android production build
eas build --platform ios
eas build --platform android
```

### 5. Tests

```bash
npm test
```

---

## CI / CD

Two GitHub Actions workflows are in place:

**`ci.yml`** — runs on every push and pull request to `main`:

- TypeScript type check (`tsc --noEmit`)
- Full test suite (`npm test`)

**`sync-parking-data.yml`** — runs every **Monday at 8 AM Vancouver time**:

- Fetches the latest meter and motorcycle parking data from the City of Vancouver Open Data Portal
- Re-seeds the Supabase database
- Opens a GitHub Issue automatically if the sync fails

```
.github/workflows/
├── ci.yml                  # push / PR → typecheck + tests
└── sync-parking-data.yml   # weekly → seed-meters + seed-motorcycle-parking
```

The sync workflow requires two repository secrets: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## Data

Parking data is sourced from the **[City of Vancouver Open Data Portal](https://opendata.vancouver.ca/)**. Coverage is limited to the City of Vancouver boundary.

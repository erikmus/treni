# Treni - Hardloop Training App

Een persoonlijke hardloop coach applicatie met web en mobiele apps.

## 📁 Project Structuur

```
treni/
├── apps/
│   ├── web/          # Next.js web applicatie
│   └── mobile/       # Expo React Native app
├── packages/
│   └── shared/       # Gedeelde code (types, utils, i18n)
├── turbo.json        # Turborepo configuratie
└── pnpm-workspace.yaml
```

## 🚀 Aan de slag

### Vereisten

- Node.js 18+
- pnpm 9+
- Expo CLI (voor mobile development)
- Xcode (voor iOS development)
- Android Studio (voor Android development)

### Installatie

```bash
# Installeer dependencies
pnpm install

# Build shared packages
pnpm build --filter=@treni/shared
```

### Development

```bash
# Start alle apps
pnpm dev

# Start alleen de web app
pnpm dev:web

# Start alleen de mobile app
pnpm dev:mobile
```

### Web App (Next.js)

```bash
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### Mobile App (Expo)

```bash
cd apps/mobile
pnpm dev
```

Scan de QR code met de Expo Go app op je telefoon.

#### iOS Simulator

```bash
cd apps/mobile
pnpm ios
```

#### Android Emulator

```bash
cd apps/mobile
pnpm android
```

## 📦 Packages

### @treni/shared

Gedeelde code tussen web en mobile:

- **types/** - Database types (Supabase generated)
- **utils/** - Utility functies (distance conversie, formatting)
- **i18n/** - Internationalisatie configuratie

```typescript
// Gebruik in web of mobile
import { Profile, Activity } from '@treni/shared/types'
import { formatDistance, formatPace } from '@treni/shared/utils'
import { locales, defaultLocale } from '@treni/shared/i18n'
```

## 🔧 Environment Variables

### Web App (`apps/web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
```

### Mobile App (`apps/mobile/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Build

```bash
# Build alle packages
pnpm build

# Build alleen web
pnpm build:web

# Build mobile (via EAS)
cd apps/mobile
eas build --platform ios
eas build --platform android
```

## 📱 Mobile App Features

- ✅ Authenticatie (login/signup)
- ✅ Home dashboard met workout van vandaag
- ✅ Workouts overzicht
- ✅ Activiteiten lijst
- ✅ Profiel met instellingen
- 🔲 Strava OAuth integratie
- 🔲 Push notifications
- 🔲 Offline support

## 🔗 Technologie Stack

### Web
- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase (auth, database)
- next-intl (i18n)

### Mobile
- Expo 52
- React Native 0.76
- Expo Router
- Supabase (auth, database)

### Shared
- TypeScript
- date-fns
- Zod

## 📄 License

MIT

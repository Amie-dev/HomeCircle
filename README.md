# 🏢 HomeCircle - Smart Gated Community App

HomeCircle is a premium, universal mobile and web application built with [Expo (v55.0.0)](https://docs.expo.dev/versions/v55.0.0/) and [Supabase](https://supabase.com) designed to streamline gate control, amenities booking, resident requests, and visitor management for smart residential societies.

---

## 🚀 Key Modules & Role Workflows

HomeCircle implements a comprehensive access control system with dedicated dashboards and flows for 5 key user roles:

| Role | Responsibility | Key Features |
| :--- | :--- | :--- |
| **Society Admin** | Full community oversight | Configures Towers, Flats, Amenity limits, broadcasts notices, creates polls, verifies Guards/Flat Admins. |
| **Tower Admin** | Tower-level verification | Reviews Flat Admin joining requests, manages tower complaints, monitors tower-specific notices. |
| **Flat Admin** | Flat owner/primary resident | Registers family members & vehicles, books amenities, pre-approves visitors (generates QR pass), registers complaints. |
| **Security Guard** | Gate security operations | Scans/verifies resident & visitor QR codes, logs vehicle details, handles spot guest entries, views duty shift details. |
| **Guest / Visitor** | Temporary access requester | Signs up to request access to specific flats, receives digital QR entry passes upon approval. |

---

## 🛠️ Getting Started & Setup

Follow these steps to configure, run, and develop the application locally.

### 1. Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v18.x or v20.x recommended)
* **npm** or **yarn**
* **Expo Go** app on your iOS/Android device (for quick testing) or a configured emulator (Android Studio / Xcode Simulator)

---

### 2. Clone & Install Dependencies

Clone the project to your local directory and install the required npm packages:

```bash
# Install package dependencies
npm install
```

---

### 3. Configure Environment Variables

1. Copy the environment variables template file:
   ```bash
   cp .env.example .env.local
   ```
2. Open the newly created [`.env.local`](file:///home/aminul/development/Prod/HomeCircle/.env.local) file and populate it with your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
   ```

---

### 4. Database Setup (Supabase)

HomeCircle uses Supabase as a Backend-as-a-Service (BaaS). Set up the tables, triggers, and Row Level Security (RLS) policies by importing the SQL scripts in order:

1. **Core Database Schema**: Open the Supabase SQL Editor and run the SQL instructions located in [`supabase/production_schema.sql`](file:///home/aminul/development/Prod/HomeCircle/supabase/production_schema.sql). This initializes core tables like `societies`, `users`, `towers`, `flats`, and initial verification logs.
2. **Latest Modifications & Policies**: Run the SQL commands in [`supabase/residentSchem.sql`](file:///home/aminul/development/Prod/HomeCircle/supabase/residentSchem.sql) to add modern schema updates for amenities categories, star ratings, household deletion permissions, and profile picture integration.

> [!IMPORTANT]
> Make sure to enable the `uuid-ossp` extension in your Supabase dashboard before executing the schemas (this is included at the top of the schema file).

---

### 5. Push Notifications & Firebase Configuration

Firebase is used to handle push notifications via `expo-notifications`.
* **Android**: Download `google-services.json` from your Firebase Console and place it at the root folder [`google-services.json`](file:///home/aminul/development/Prod/HomeCircle/google-services.json).
* **iOS**: Configure APNs credentials in your Expo developer portal if building for iOS.

> [!NOTE]
> The app config [`app.config.js`](file:///home/aminul/development/Prod/HomeCircle/app.config.js) dynamically targets different Google Services configurations based on the `APP_VARIANT` variable (`development` vs `preview` / `production`).

---

## 🏃 Run the Application

Start the local Expo development server:

```bash
# Start expo dev server
npm run start
```

Use the interactive terminal commands to run the application on your desired platform:
* Press **`a`** to run on an **Android emulator**.
* Press **`i`** to run on an **iOS simulator**.
* Press **`w`** to run in a **Web browser**.
* Press **`r`** to force reload the bundle.

For troubleshooting dependency or bundle issues, run with a cleared cache:
```bash
npx expo start -c
```

---

## 📦 Building and Publishing

HomeCircle is configured to use **Expo Application Services (EAS)** for compiling and building binaries as specified in [`eas.json`](file:///home/aminul/development/Prod/HomeCircle/eas.json).

### Build Development Client (Recommended for local native modules)
```bash
eas build --profile development --platform all
```

### Build Android Preview APK
```bash
eas build --profile preview --platform android
```

---

## 📁 Repository Structure

```
HomeCircle/
├── assets/             # Image resources, app launcher icons, splash icons
├── supabase/           # PostgreSQL Database schemas (production_schema.sql, residentSchem.sql)
├── src/                # Primary source directory
│   ├── app/            # Expo Router file-based pages & layouts (e.g. resident, guard, admin portals)
│   ├── components/     # Reusable UI component modules (e.g. PassHistoryList)
│   └── theme.ts        # App UI theme (fonts, colors, spacing parameters)
├── instructions/       # Modules & onboarding technical specs
├── app.config.js       # Dynamic Expo configuration file (variants & native plugins)
└── eas.json            # EAS building configurations
```

---

## 📚 Learn More

* [Expo SDK 55 Documentation](https://docs.expo.dev/versions/v55.0.0/)
* [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
* [Supabase Javascript Client API](https://supabase.com/docs/reference/javascript/introduction)

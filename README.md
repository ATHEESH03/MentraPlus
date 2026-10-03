# Mentra+ — Personal Wellbeing Learning Platform for College Students

Mentra+ is a reflective personal wellbeing and self-discovery application built with Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, and Firebase (Authentication + Cloud Firestore).

Instead of scoring students or issuing diagnoses, Mentra+ helps college students notice patterns in their daily life — triggers, emotional states, chosen coping strategies, and subsequent outcomes — through their own recorded experiences over time.

---

## 🌟 Signature Features

1. **Personal Response Map**: Interactive vector graph (`d3-force` layout + SVG) mapping situations → emotional states → chosen thoughts & strategies → reported outcomes without fabricated edges. Includes pan, zoom, filtering by date and node kind, timeline view, and accessible keyboard controls.
2. **Evidence-Backed Insights Engine**: Evaluates patterns across check-ins and experiments with status classification (`emerging`, `supported`, `reviewed`, `confirmed`, `dismissed`, `contradicted`, `changing`) and transparent evidence links.
3. **Structured Personal Experiments**: Formulate hypotheses, log attempts with before/after reflections, track helpful vs unhelpful ratios, and integrate findings into your personal playbook.
4. **Non-Diagnostic Self-Assessments**: 5 reflective questionnaires (Perceived Stress, Sleep Routines, Energy & Daily Functioning, Coping & Resilience, General Wellbeing & Life Balance) with deterministic scoring and non-clinical interpretations.
5. **Private Journal**: Free-form and prompt-guided reflections with tag management and search.
6. **Playbook & Progress Tracking**: Catalogued coping strategies with real empirical success metrics, plus Recharts area trends for mood, energy, and stress.
7. **Pseudonymous Circles (Community)**: Topic-based peer encouragement where users post exclusively via pseudonyms (`@handle`). Includes likes synced atomically via transactions, bookmarks, and reporting.
8. **Breathing & Grounding Studio**: Calming nervous system exercises including an accessible 4-second breath pacer and 5-4-3-2-1 sensory grounding.
9. **Mentora (AI Companion with Honest Fallback)**: Server-side route calling an OpenAI-compatible endpoint with strict safety prompts and opt-in context sharing. If no API key is configured, a clearly labeled deterministic offline fallback provides reflective prompts.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v3 with bespoke natural paper/ink/teal/coral palette
- **Data & Auth**: Firebase JS SDK v10 (Authentication & Cloud Firestore)
- **Visualization**: `d3-force` (Response Map), `recharts` (Progress trends)
- **Server API**: Next.js Node.js server route (`/api/mentora`) with Firebase Admin SDK support

---

## 📂 Project Structure

```
mentra-plus/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  postcss.config.js
  firebase.json
  firestore.rules
  firestore.indexes.json
  .env.example
  README.md
  app/
    globals.css
    layout.tsx
    page.tsx                              # Art-directed landing page & 7-step loop
    (auth)/
      sign-in/page.tsx
      sign-up/page.tsx
      reset-password/page.tsx
    onboarding/page.tsx                   # 3-step skippable preferences
    (app)/
      layout.tsx                          # Auth guard + AppShell
      home/page.tsx                       # Dashboard with metrics & top insight
      check-in/page.tsx                   # 60-second structured check-in form
      journal/page.tsx                    # Private journal with search & tags
      map/page.tsx                        # Personal Response Map
      insights/page.tsx                   # Evidence-backed observations
      insights/[id]/page.tsx              # Deep inspection of linked records
      experiments/page.tsx                # Personal experiments list
      experiments/new/page.tsx            # Experiment designer
      experiments/[id]/page.tsx           # Experiment detail & attempt logger
      assess/page.tsx                     # Self-assessment questionnaires
      assess/[id]/page.tsx                # Interactive runner with draft saving
      playbook/page.tsx                   # Tested strategies with empirical counts
      progress/page.tsx                   # Trajectory charts (Recharts)
      community/page.tsx                  # Pseudonymous Circles
      community/new/page.tsx              # Composer
      studio/page.tsx                     # Breathing and sensory grounding
      profile/page.tsx                    # Privacy, AI toggles, export, delete
      mentora/page.tsx                    # AI chat interface
    api/
      mentora/route.ts                    # Serverless endpoint (rate-limited)
  components/
    ui/{Button,Input,Chip,Card,Dialog,Toast,Spinner,EmptyState,Slider,Tabs}.tsx
    layout/{AppShell,TopNav,BottomNav,MoreSheet}.tsx
    map/{ResponseMap,useForceLayout}.tsx
    checkin/{CheckInForm,CheckInCTA}.tsx
    journal/{JournalEditor,JournalCard}.tsx
    assessments/AssessmentRunner.tsx
    experiments/ExperimentForm.tsx
    community/{PostCard,Composer}.tsx
    studio/BreathingCircle.tsx
    mentora/ChatView.tsx
  lib/
    firebase.ts                           # Client Firebase initialization
    types.ts                              # Document interfaces & union types
    utils.ts                              # Formatting & helper utilities
    auth.tsx                              # AuthProvider & user profile state
    data/                                 # Owner-scoped repositories
      userRepo.ts, checkIns.ts, journal.ts, experiments.ts,
      strategies.ts, insightsRepo.ts, conversations.ts,
      achievements.ts, community.ts, assessments.ts
    insights/engine.ts                    # Pure pattern derivation
    map/model.ts                          # Nodes & edges graph builder
    assessments/{definitions.ts,scoring.ts}
    mentora/{adapter.ts,context.ts,system.ts,fallback.ts}
  tests/
    scoring.test.mjs                      # Dependency-free scoring unit test
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Firebase Account**: Free Spark plan on [firebase.google.com](https://console.firebase.google.com)

### 2. Installation
```bash
npm install
```

### 3. Configure Firebase Credentials
1. In the [Firebase Console](https://console.firebase.google.com):
   - Create a project (e.g. `mentra-plus-dev`).
   - Go to **Build → Authentication** → Click **Get Started** → Enable **Email/Password**.
   - Go to **Build → Firestore Database** → Click **Create database** → Choose **Production mode** and your preferred region.
   - Go to **Project Settings → General → Your apps** → Add a **Web app** (`</>`).
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in your Firebase web app keys in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

### 4. Deploy Firestore Security Rules & Indexes
Deploy directly using the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore
```
*(Alternatively, copy and paste the contents of `firestore.rules` and `firestore.indexes.json` directly into the Firestore Rules and Indexes tabs in the Firebase Console).*

### 5. Run the Scoring Unit Tests
```bash
npm run test:scoring
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Architecture

1. **Owner-Only Wellbeing Tree**: All personal data lives under `/users/{uid}/...` (`checkIns`, `journalEntries`, `assessmentResults`, `drafts`, `experiments`, `strategies`, `insights`, `conversations`). Security rules enforce that `request.auth.uid == uid` for every read and write.
2. **Pseudonymous Community Isolation**: Community posts exist in `/communityPosts/{id}` and store only `@authorHandle` and `authorId`. Private collections are never queryable by other users.
3. **Atomic Like Counts**: `communityPosts.likeCount` cannot be edited directly by users; it updates atomically via transactions matching document existence in `/communityPosts/{id}/likes/{uid}`.
4. **Server-Side AI Secrets**: `MENTORA_API_KEY` stays on the server. If omitted, the deterministic local fallback responds safely.

---

## ⚠️ Non-Clinical Disclaimer

Mentra+ is an educational and reflective wellbeing tool designed for personal insight. It is **not** a healthcare provider, mental health clinic, suicide prevention service, or diagnostic instrument. 

If you or someone you know is experiencing acute distress, self-harm, or an emergency, please contact your university counseling service, emergency medical personnel, or local crisis hotline immediately.

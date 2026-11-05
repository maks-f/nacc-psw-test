# NACC Exam Prep App (PSW Final Exam Trainer)

A fast, mobile-first, and zero-config web application for mastering all NACC (National Association of Career Colleges) Personal Support Worker (PSW) exam tickets. Designed to run seamlessly directly from GitHub Pages or locally with no complex server setup, full offline support, and interactive study modes.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were aligned based on your responses:
> - **Sync & Export Strategy**: Direct browser-side JSON import/export (for effortless Google Drive or cloud drive backup) paired with rich formatted Notion-compatible Markdown exporter for cheatsheets and notes. This guarantees the app works instantly on GitHub Pages or locally with zero server configuration or secret API keys.
> - **Language Presentation**: Questions and options appear in pristine English by default (matching the real Canadian exam conditions). Each card provides an instant one-tap toggle to reveal Ukrainian translations, in-depth clinical rationales, and "How to Remember" mnemonics. Furthermore, an integrated on-demand translation tool enables translation into any language via web standards / built-in translator.
> - **Study & Drill Modes**: Three primary modes:
>   1. **Linear Ticket Study**: Sequential card-by-card inspection following the document order with slide transitions.
>   2. **Custom Range Quiz Generator**: Flexible selection of question ranges (e.g., 1–50, 100–250, True/False tickets, or custom number of randomized questions) with instant scoring and detailed feedback.
>   3. **Spaced Repetition & Smart Error Drill**: Tracks historical mistakes and difficulty scores to prioritize questions requiring urgent repetition.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a dedicated, distraction-free study environment containing all exam tickets from the official NACC preparation document (including Multiple Choice Q1–Q780 and True/False questions). Tracks individual question mastery, bookmarks, mistake frequency, and study streaks in `localStorage`.
- **Target Audience**: Students preparing for the Canadian NACC / PSW certification exam on smartphone or laptop.
- **Key Value**: 100% focused study experience without clutter. Switch between English-only exam simulation and bilingual study with mnemonic memory hooks; practice customizable subsets of tickets anytime, anywhere, with offline availability and GitHub deployment readiness.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Mode Selection & Dashboard**:
   - Clean top overview displaying total progress (mastered, learning, difficult), daily streak, and quick launch buttons for:
     - **Study Mode (Linear)**
     - **Custom Quiz (Range Selector)**
     - **Smart Error Drill (Worst-performing tickets)**
     - **Bookmarks / Saved Difficult Questions**
     - **Analytics & Graphs**
2. **Interactive Ticket Study & Quiz Card**:
   - Minimalist slide deck view with animated slide transitions (smooth gesture / button navigation).
   - Card displays: Ticket Number, English Question text, and English Answer options (A, B, C, D or True/False).
   - Floating utility buttons: Bookmark toggle (★), Ukrainian Translation toggle (🇺🇦), Explanation & Mnemonic reveal (💡), and text-to-speech option.
   - Immediate feedback in quiz mode: Highlights selected vs. correct choice with clear explanatory notes.
3. **Flexible Quiz Configurator**:
   - Sliders / inputs for Start Question and End Question (e.g. 50 to 120).
   - Mode toggles: "Shuffle questions", "Only unattempted", "Only previously failed".
   - Selectable question count (10, 25, 50, or full range).
4. **Analytics & Performance Tracking**:
   - Visual charts showing category mastery, daily study activity, and a ranking of "Top 10 Hardest Questions" based on failure rates.
5. **Offline & Cloud Export**:
   - **Download PDF Summary**: Clean, printer-friendly CSS stylesheet and export tool to generate an offline PDF study guide.
   - **Export to Notion**: Copies a clean, markdown-formatted study summary and mistake list formatted for pasting into Notion.
   - **Backup & Restore**: One-click JSON backup file download/upload for Google Drive syncing.
   - **Daily Reminder**: Web Notification scheduling for study sessions.

### Visual Identity & Theme
- **Aesthetic**: Minimalist Swiss-inspired typography, distraction-free clinical clarity, zero ornamental clutter.
- **Color Palette**:
  - *Light Mode*: Canvas `#F8FAFC`, Cards `#FFFFFF`, Borders `#E2E8F0`, Text `#0F172A`, Muted `#64748B`.
  - *Dark Mode*: Canvas `#0B0F17`, Cards `#131B2A`, Borders `#1E293B`, Text `#F1F5F9`, Muted `#94A3B8`.
  - *Accents*: Academic Indigo/Cyan (`#0284C7` / `#38BDF8`), Success Emerald (`#10B981`), Error Coral (`#EF4444`), Warning Amber (`#F59E0B`).
- **Typography**: Display font `Plus Jakarta Sans`, clean tabular figures for metrics (`tabular-nums font-mono`).
- **Mobile Ergonomics**: 48px touch targets, sticky bottom action bar within thumb-reach, swipe transitions, and sub-15% header/footer footprint.

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React SPA (Vite)                              │
│                                                                        │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │     Study / Quiz State    │      │       Question Database       │  │
│  │   (Active ticket, filter, │ ───> │  (All ~800 parsed questions   │  │
│  │     mode, range, timer)   │      │  with EN text, UA translation,│  │
│  └─────────────┬─────────────┘      │  options, explanations, notes)│  │
│                │                    └───────────────────────────────┘  │
│                ▼                                                       │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │   Local Persistence Store │      │        Export & Sync          │  │
│  │  - View history & mastery │      │  - JSON Backup (Google Drive) │  │
│  │  - Bookmarks              │ <──> │  - Notion Markdown Clipboard  │  │
│  │  - Error frequency counts │      │  - Print / PDF Export Engine  │  │
│  │  - Notification preferences│     │  - Web Notifications API      │  │
│  └───────────────────────────┘      └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Structure
- `App.tsx`: Main application shell with theme manager (dark/light), active view routing, and bottom mobile navigation bar.
- `src/data/questions.ts`: Complete structured dataset of all questions extracted from the NACC exam preparation material (Question, UA Translation, Options, Correct Answer, Explanation, How to Remember).
- `src/components/LinearStudyView.tsx`: Slide-by-slide learning mode with swipe / keyboard controls, instant toggle for translation/explanation.
- `src/components/QuizView.tsx`: Configurable practice mode with score calculator, timer option, and mistake recording.
- `src/components/QuizConfigModal.tsx`: Range selector, question count, and filter options.
- `src/components/AnalyticsView.tsx`: Charts and progress metrics, accuracy percentages, hardest questions list.
- `src/components/BookmarksView.tsx`: Quick access to saved difficult questions.
- `src/components/ExportSyncModal.tsx`: Notion markdown generator, JSON download/upload, and PDF print preview.
- `src/components/ReminderSettings.tsx`: Browser push notification scheduler for daily practice.

---

## 4. Verification Plan

1. **Compilation & Lint**:
   - Run `compile_applet` and `lint_applet` to ensure zero TypeScript errors or missing imports.
2. **Functional Testing**:
   - Verify question browsing across Question 1 to 780 and True/False questions in order.
   - Verify custom range selection (e.g. tickets 20 to 60) generates an exact quiz matching the selected bounds.
   - Verify English by default + toggle Ukrainian translation works smoothly on any ticket.
   - Verify answer selection correctly highlights green (correct) / red (incorrect) and saves to error bank.
   - Verify dark mode toggle updates all surfaces with proper contrast (`@custom-variant dark`).
   - Verify JSON export/import restores user progress accurately.
   - Verify Notion Markdown export formats clean readable markdown with headers and bullet lists.
   - Verify mobile responsiveness (touch targets $\ge 44\text{px}$, smooth transitions, responsive layout).

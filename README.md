# ⚡ Hackboard — Voice-First Hackathon War Room

> **"Your board never leaves this browser."**  
> A zero-backend, 100% local-first command center for multi-hackathon sprinters. Hold your **Wispr Flow** key, ramble about deadlines and tasks, and Hackboard automatically turns your speech into synchronized countdowns, Kanban boards, and Mermaid Gantt timelines.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zero Backend](https://img.shields.io/badge/Zero-Backend-emerald?style=flat-square)](https://github.com/yashvantatk/HackerBoard)
[![Tests Passing](https://img.shields.io/badge/Tests-32%2F32%20(100%25)-brightgreen?style=flat-square)](https://github.com/yashvantatk/HackerBoard)

---

## 🎯 The Problem

Students and hackers frequently participate in multiple hackathons at the same time. Deadlines, submission guidelines, demo video constraints, and tasks get scattered across Devpost, Discord channels, and bookmarks. Switching contexts leads to missed deadlines and last-minute panic.

---

## 🚀 The Solution

**Hackboard** is a local-first war room built specifically for voice dictation:
1. Hold your **Wispr Flow** key anywhere.
2. Ramble naturally (e.g., *"Nvidia closes October 30 at 11:59 pm. I still need the demo video, readme, and deploy."*).
3. Hackboard extracts the dates in **Indian Standard Time (IST)**, estimates work hours, auto-splits tasks, tracks urgency, and plots your entire week onto a live Gantt chart.

---

## ✨ Core Features

### 🎙️ 1. Intelligent Natural Language Parser
- **Chrono-Node IST Timezone Engine**: Extracts future dates and times in IST (`+05:30`), defaulting unspecified hours to 11:59:59 PM IST.
- **Task Splitting**: Automatically extracts tasks following trigger words (*"need"*, *"tasks"*, *"todo"*, *"have to do"*).
- **Phonetic Speech Aliases**: Tolerates real-world speech-to-text dictation errors (*"Navya's"* for Nvidia, *"Whisper"* for Wispr).
- **Filler Word Stripping**: Handles conversational speech naturally (*"um"*, *"so"*, *"like"*, *"and also"*, *"basically"*).
- **Task Hour Estimates**: Dictate estimates directly (*"demo video for Nebius takes 2 hours"* or *"add record demo for Wispr, 1 hour"*).
- **100% Verified Test Suite**: 32/32 realistic dictation test cases passing.

### 📋 2. Multi-View Operations
- **Cards View**: Live countdown ticking every second with urgency color coding:
  - 🟢 **Green (> 48h)**: Plenty of time
  - 🟡 **Amber (≤ 48h, > 12h)**: War room crunch
  - 🔴 **Red (≤ 12h)**: Critical rush with pulsing warning
  - SVG Circular progress rings showing task completion ratio.
- **Kanban Board View (`K`)**: Three drag-and-drop columns (**To Do**, **Doing**, **Done**) with per-column hour totals and live synchronization from voice commands.
- **Operations Timeline (`T`)**: Interactive **Mermaid Gantt Chart** plotting all hackathon deadlines, tasks, progress states, and the current time marker.

### 🎯 3. "What Now" Focus Intelligence & Pomodoro Sprint (`N`)
- **Least-Slack Urgency Scoring**:
  $$\text{Slack} = \text{Hours Left} - \text{Remaining Estimated Work Hours}$$
  The hackathon with the least slack wins. Tasks already in *Doing* take priority, followed by tasks fitting your available focus time.
- **Plain Sentence Explanation**: E.g., *"Nebius NVIDIA Hackathon has 121 hours left and 8 hours of work."*
- **Built-in Pomodoro Sprint Timer**: 25-minute default focus sprint with auto-completion prompt (*"Did you complete this task?"*).
- **Overbooked Warning Banner**: Automatically alerts you when remaining work exceeds the hours left before deadline!

### 📜 4. Hackathon Rules Reader (`R`)
- Paste or dictate raw submission pages or Devpost guidelines.
- Automatically extracts:
  - Hackathon name
  - All mentioned deadlines (with radio picker if multiple dates found)
  - Submission checklist: Demo video & duration (e.g. *"max 3 mins"*), GitHub repo, deployed URL, README, screenshots, and team size rules.
- One-click import converts the checklist directly into active tasks.

### 📅 5. RFC 5545 iCalendar (.ics) Export
- Downloads an `.ics` file containing all hackathons formatted with IST timing.
- Embedded alarms:
  - **24 hours before** deadline
  - **2 hours before** deadline (final submission warning)

### 🔗 6. Zero-Server URL Hash Sharing
- Compresses the entire board state using `lz-string` into the URL hash (`#shared=...`).
- Share with teammates with zero server involvement. Teammates can view in read-only mode and click **"Copy into My Board"** to import locally.

### 🏁 7. Judge 60-Second Guided Tour
- Built-in 4-step interactive walkthrough for judges:
  1. Sample voice ramble execution
  2. What Now focus card & Pomodoro sprint
  3. Rules reader auto-extraction
  4. Operations timeline view

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **`Ctrl + Enter`** | Execute voice dictation / command from Command Bar |
| **`K`** | Toggle between Cards view and Kanban Board view |
| **`T`** | Switch to Mermaid Gantt Operations Timeline |
| **`N`** | Open *What Now* focus card & Pomodoro sprint |
| **`R`** | Open *Rules Reader* modal |
| **`/`** | Focus Command Bar input |
| **`?`** | Toggle Keyboard Shortcuts Guide |
| **`Esc`** | Close open modals and sheets |

---

## 🛠️ Quickstart

```bash
# Clone the repository
git clone https://github.com/yashvantatk/HackerBoard.git
cd HackerBoard

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view Hackboard.

---

## 🧪 Testing & Verification

Run the 32-case natural dictation test suite:

```bash
npm test
```

Build the zero-backend static export:

```bash
npm run build
```

Generated static assets will be located in the `out/` directory, ready for immediate deployment on Vercel, GitHub Pages, or Netlify.

---

## 🔒 Privacy & Architecture Guarantee

- **Zero API Keys**: No third-party AI keys or credentials required.
- **Zero Backend**: All state is managed client-side in browser `localStorage`.
- **Static Export**: Prerendered plain HTML/JS/CSS files via Next.js static export (`output: 'export'`).
- **Data Sovereignty**: Your hackathon tasks and voice notes never leave your browser.

---

## 📄 License

MIT © [yashvantatk](https://github.com/yashvantatk)

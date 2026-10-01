# TruthTrail — Anti-Ghost-School Audit System

A mobile-first web app for auditing government schools in rural Khairpur, Pakistan — built to detect **"ghost schools"** (schools that exist on paper with a budget and a teacher, but little to no real teaching).

TruthTrail is designed to work even when the school, local office, and district office all benefit from hiding the truth. It relies on **independent, tamper-resistant signals** and **unpredictable inspections**.

## 🔗 View Project

**[https://truthtrail-khairpur-anti-ghost-school-audit-syste.ai.studio/](https://truthtrail-khairpur-anti-ghost-school-audit-syste.ai.studio/)**

## ✨ Highlights

- **Teacher attendance app** — face check-in with liveness, GPS geofence, photo-hash reuse detection, offline queueing.
- **Anonymous inspection system** — inspectors are shuffled and assigned on the server; the admin never sees who goes where until the report is submitted.
- **Explainable risk scoring** — flags ghost-school patterns (round enrollment, ~100% attendance, out-of-geofence check-ins, reused photos, parent contradictions).
- **Super Admin dashboard** — KPI cards, risk-colored Leaflet map, Recharts trends, inspection batches, anonymous tips inbox.
- **Parent / community layer** — parents verify attendance directly with the system, bypassing the school and local office.

## 🛠 Tech Stack

React · Vite · TypeScript · Tailwind CSS · React Router · Leaflet (OpenStreetMap) · Recharts · face-api.js · PWA-ready with offline sync

## 📄 License

MIT

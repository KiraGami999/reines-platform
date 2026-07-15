# Reines Project Mate — Client Walkthrough Script

**Audience:** Stakeholders / clients reviewing the mobile app and its link to the Reines web platform  
**Duration:** ~20–25 minutes  
**Surfaces:** Mobile app (Client + Project Manager) · Web portal · Public website HelpDesk  

---

## Before You Start (5 minutes setup)

### Devices
| Role | Device | Where |
|------|--------|--------|
| You (presenter) | Laptop | Web portal + admin |
| Phone A | Galaxy / physical phone | Project Manager mobile login |
| Phone B *or* laptop browser #2 | — | Client mobile **or** client web portal |

> Use a **physical phone** for push notifications. Emulators often cannot register for push.

### Accounts (seed / demo)
| Role | Email | Password | Use on |
|------|-------|----------|--------|
| Project Manager | `samuel.phiri@reines.co.mw` | `Manager123!` | Mobile + web |
| Client | `demo.client@example.com` | `Client123!` | Mobile + web |
| Admin | `reines.admin1@gmail.com` | `superadmin123` | **Web only** |

### Systems check (say this out loud while verifying)
1. Web backend is running (`reines-web` → `npm run dev`).
2. Mobile `.env` has `EXPO_PUBLIC_API_URL` set to your PC’s **LAN IP** (not `localhost`), e.g. `http://192.168.x.x:3000`.
3. Phone and PC are on the **same Wi‑Fi**.
4. Open web portal on laptop: `http://localhost:3000` (or your domain).
5. Open the mobile app (Expo Go / APK / development build).

**Presenter line:**  
*“Everything you’re about to see — mobile and website — reads and writes to the same database. There is no separate mobile system.”*

---

## Part 0 — Opening Narrative (1 min)

**Say:**

> “Reines Project Mate is the official mobile client for the Reines Property Development platform.  
> Clients and project managers use the same accounts, projects, messages, gallery, payments, and loyalty data as the website.  
> Pre-project support — HelpDesk — stays on the public website. Once someone becomes a portal client, day-to-day work moves into the app.”

**Show briefly (laptop):**
- Public site home
- Mention Contact / Quote / chatbot as HelpDesk (we return to this at the end)

---

## Part 1 — Project Manager Mobile Portal (6–7 min)

### 1.1 Login
1. Open the app → Login.  
2. Sign in as **Project Manager**.  
3. Confirm you land on the **Manager Dashboard**.

**Say:**  
*“Role-based access: managers never see client-only screens like Payments or Rewards.”*

### 1.2 Dashboard overview
Point out:
- Greeting / “needs attention”
- Stats (projects, messages, deadlines)
- **Pending Acceptance** (if the seed project isn’t accepted yet)

### 1.3 Accept the project (required unlock)
1. Open **Projects** tab (or Accept from dashboard).  
2. Tap the assigned project (e.g. *Chichiri Residential Complex*).  
3. Tap **Accept project**.

**Say:**  
*“Until the manager accepts, gallery uploads, milestones, and messaging stay locked. This mirrors the website rules.”*

**Sync proof (laptop):** Refresh the manager web project page — accepted state should match.

### 1.4 Gallery upload (visual proof of shared database)
1. Go to **Gallery** tab.  
2. Select the project.  
3. Tap **+** → take or choose a photo → add a short note (and progress % if shown) → upload.  
4. Wait for progress to finish → photo appears in Photos / Updates.

**Sync proof (laptop — strongest demo moment):**
1. Log in as **Client** on the web portal (or keep a second tab already logged in).  
2. Open that project’s **Progress Gallery**.  
3. Show the **same photo and note**.

**Say:**  
*“Uploaded from the phone. Stored on the server. Visible instantly on the website. One gallery, one database.”*

### 1.5 Messages (two-way sync)
1. On mobile (manager) → **Messages** → open the project thread.  
2. Send: *“Site inspection completed — photo uploaded to the gallery.”*  
3. On laptop (client web) → **Messages** → same project → show the message appear (within a few seconds; app polls ~every 5s).

**Optional reverse:**
- Client replies on web or client phone → show it on manager mobile after a short refresh/wait.

**Say:**  
*“Project-based messaging — not a generic chat. Same conversation on web and mobile.”*

### 1.6 Milestones
1. From project detail → **Milestones** (or open milestones screen).  
2. **+ Add** a milestone: title *“Foundation complete”*, optional due date → save.  
3. Mark it **In Progress** or **Complete**.

**Sync proof:**
- Client mobile **Project Detail → Milestones** section, **or** client web project page — same milestone.

**Say:**  
*“Milestones keep the client informed of stage progress without needing a phone call.”*

### 1.7 Manager Settings (quick)
1. **Settings** → show profile, role badge.  
2. Toggle **Push Notifications** ON (grant permission if asked).  
3. Do **not** dwell on Dark Mode (“Coming soon”).

---

## Part 2 — Client Mobile Portal (7–8 min)

### 2.1 Login as client
1. Sign out of manager (or use Phone B).  
2. Login as **Client**.  
3. Land on **Client Dashboard**.

**Say:**  
*“The client sees their projects, payments due, loyalty points, and recent updates in one place.”*

### 2.2 Dashboard walkthrough
Point to:
- Stat cards (Projects, Pending payments, Loyalty, Messages)
- Active projects → tap into one
- Recent updates (gallery notes / timeline)

### 2.3 Project detail
1. Open a project.  
2. Show status, progress, manager card, **Message** shortcut.  
3. Show **Milestones** (read-only for client).  
4. Show **Progress Timeline** — the photo uploaded earlier should appear here.

**Say:**  
*“The client doesn’t manage the build — they track it. Transparency is the product.”*

### 2.4 Messages
1. **Messages** tab → open thread.  
2. Reply: *“Thank you — received the update.”*  
3. Optionally show unread badge behaviour.

### 2.5 Payments (Cash path — reliable for live demos)
1. **Payments** → **+ New**.  
2. Select project, enter amount + description.  
3. Choose **Cash** → optionally attach a receipt photo → submit.  
4. Status should be **Pending**.

**Sync proof (laptop as Admin):**
1. Login as **Admin** on web → **Payments**.  
2. Find the pending cash payment → **Approve**.  
3. Back on client mobile → pull to refresh Payments / open detail → status **Paid / Success**.

**Say:**  
*“Payment submitted on mobile. Reviewed on the website. Status updates on the phone. Same payment record.”*

> **Note:** For PayChangu online checkout, only demo if gateway keys are configured. Otherwise stick to Cash.

### 2.6 Rewards (Loyalty)
1. Open **Rewards** tab.  
2. Show Overview (points, tier).  
3. If points exist → open Rewards → **Redeem** one (or explain without redeeming if balance is low).  
4. Show History tab.

**Sync proof (optional):** Client or admin loyalty page on web shows the same balance/activity.

### 2.7 Settings + push
1. Settings → confirm name/email/role.  
2. Ensure **Push Notifications** is ON.  
3. From manager phone (or web is weaker for message push) send a new message to the client.  
4. Show the notification on the client phone → tap it → lands in the correct chat.

**Say:**  
*“Push takes the client straight to the right screen — messages, gallery, payments, or project updates.”*

---

## Part 3 — HelpDesk on the Website (3–4 min)

**Say:**

> “HelpDesk is for people who are not yet inside a live project — or who need general support. That lives on the public website, not as a separate mobile ticket system.”

### 3.1 Contact / enquiry (HelpDesk intake)
1. Open public **/contact**.  
2. Submit a short enquiry (use subject like *Client Portal Support*).  
3. On admin web → **Enquiries** → show it arrived.

### 3.2 Quotation request (optional)
1. Open **/quote**.  
2. Explain: prospect submits a project brief → admin reviews under **Quotations**.

### 3.3 AI chatbot (optional, if configured)
1. Open the floating chatbot on the public site.  
2. Ask: *“How do I contact Reines?”* or *“What services do you offer?”*  
3. Show it directs serious / account issues to contact or login.

**Presenter line:**  
*“Prospect → website HelpDesk. Active client → portal + mobile app. One company, the right channel for each stage.”*

---

## Part 4 — “Connection Checklist” (verify live)

Use this as a spoken checklist so stakeholders see the system is wired correctly.

| # | Proof | Pass? |
|---|--------|-------|
| 1 | Same login works on web and mobile (client / manager) | ☐ |
| 2 | Manager accept unlocks project tools | ☐ |
| 3 | Photo uploaded on mobile appears on web gallery | ☐ |
| 4 | Message sent on mobile appears on web (and reverse) | ☐ |
| 5 | Milestone created on mobile visible to client | ☐ |
| 6 | Cash payment on mobile → admin approve on web → status updates on mobile | ☐ |
| 7 | Loyalty / rewards reflect shared points | ☐ |
| 8 | Push notification opens the correct screen | ☐ |
| 9 | Contact form lands in admin Enquiries (HelpDesk) | ☐ |
| 10 | Admin cannot (and should not) use the mobile app | ☐ |

**Closing line:**

> “The mobile app is not a parallel product. It is a secure, role-based window into the same Reines platform — projects, communication, progress media, payments, and loyalty — with HelpDesk remaining on the website for public and pre-project support.”

---

## Suggested Demo Order (one page)

1. Opening — one platform, three surfaces  
2. Manager login → Accept project  
3. Upload gallery photo → show on client web  
4. Send message → show on client web  
5. Add/complete milestone → show on client view  
6. Client login → dashboard + project timeline  
7. Cash payment → admin approve → client status update  
8. Rewards glance  
9. Push notification tap-through  
10. Website HelpDesk (Contact + Enquiries)  
11. Connection checklist + Q&A  

---

## Do Not Promise / Soft Language

| Topic | What to say |
|-------|-------------|
| Dark mode | “On the roadmap — not enabled yet.” |
| Notifications inbox inside the app | “Alerts come as push notifications that deep-link to the right screen.” |
| Instant chat typing indicators | “Messages refresh frequently; architecture is ready for realtime later.” |
| Edit profile / reset password on mobile | “Managed securely via the web portal / admin support today.” |
| HelpDesk inside the app | “Pre-project and general support is on the website; project work is in the app.” |
| PayChangu | Only demo if keys are live; otherwise show Cash approval flow. |

---

## Emergency Fallback Scripts

| If this fails… | Do this instead |
|----------------|-----------------|
| Phone can’t reach API | Confirm LAN IP, same Wi‑Fi, firewall; fall back to **web portal demo** of the same flows |
| Push doesn’t arrive | Show in-app message list update; explain physical device + permissions |
| PayChangu errors | Use **Cash payment + admin approve** only |
| No seed project | Admin assigns a project to the manager on web, then continue from Accept |
| Gallery empty | Upload one live photo during the demo — stronger than seed data anyway |

---

## Optional Handout (one sentence for clients)

**Reines Project Mate** lets clients and project managers collaborate on the same live project data as the Reines website — progress photos, messages, milestones, payments, and rewards — while HelpDesk and quotations stay on the public site for everyone else.

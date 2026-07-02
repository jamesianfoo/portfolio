# Bible Study Platform — Design Spec
**Date:** 2026-07-02  
**Product Owner:** James Foo  
**Role:** James is the Admin and product owner. Mentor is a separate person (the Bible study leader).

---

## Overview

A mobile-only PWA for a Bible Study mentor to manage recurring sessions, mentees, and group coordination across global timezones. Mentees receive sessions via calendar sync (Google/Apple Calendar), which handles all notifications natively. No custom push notifications required.

---

## Platform Constraints

- **Mobile-only.** Any access from a desktop, laptop, or tablet triggers a full-screen block: "Please open this on your phone." Detection via user agent + screen width (< 768px).
- **PWA** — installable on home screen, works offline for viewing cached upcoming sessions.
- **No native app** — no App Store or Play Store submission required.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite (PWA) | Fast, installable, mobile-first |
| Backend | Firebase (Firestore + Auth + Hosting) | Free tier sufficient, no server to manage |
| Calendar Sync | iCal feed (per-mentee URL) | Works with Google Calendar and Apple Calendar universally |
| Notifications | Native calendar app reminders | Zero infrastructure, mentee controls their own preferences |
| Message drafts | In-app template generator | Copy/paste into WhatsApp — no API needed |

---

## Roles

| Role | Who | Capabilities |
|---|---|---|
| Mentor | The Bible study leader | Full control: sessions, invites, broadcasts, remove mentees |
| Admin | James (product owner) | View everything, manage mentees (cannot create sessions or send broadcasts) |
| Mentee | Anyone invited | View sessions, mark absent, manage their own account |

---

## Authentication Flow

### First Visit (Onboarding)
1. Mentor shares invite link with embedded PIN (e.g. `app.com/join?pin=ABC123`)
2. Mentee opens link on phone, enters PIN
3. If PIN is valid and not expired → prompted to enter name + phone number
4. OTP sent to phone → verified → account created
5. Prompted to subscribe iCal feed to Google Calendar or Apple Calendar

### Return Visits
1. Enter phone number → OTP sent → logged in

### PIN Rules
- Single-use per mentee (once redeemed, PIN is invalidated)
- Mentor sets expiry date when generating
- Expired or already-used PINs show a clear error: "This invite has expired. Ask your mentor for a new link."

---

## Sessions

### Creating a Recurring Session
Mentor inputs:
- Day of week (e.g. Tuesday)
- Time (auto-detected from mentor's device timezone)
- Zoom link (manual paste)
- Number of weeks (e.g. 8 weeks)

App generates all N sessions at once and publishes them to all active mentee iCal feeds immediately.

### Editing a Session
Mentor can:
- Edit a **single session** (change time, update Zoom link)
- Edit **all remaining sessions** in the series (bulk update)

### Cancelling a Session
- Cancel a **single session** OR **all remaining sessions**
- On cancel: app auto-generates a WhatsApp draft message pre-filled with session details
- Example draft: *"Hi everyone, Bible Study scheduled for Tuesday 15 July at 7:00pm (your local time) has been cancelled. See you next week! 🙏"*
- Mentor copies and pastes into WhatsApp manually

### iCal Feed
- Each mentee has a unique iCal feed URL generated at account creation
- All session changes (edits, cancellations) are reflected immediately in the feed
- If a mentee is removed, their feed URL is invalidated — sessions disappear from their calendar on next sync (typically within minutes)

---

## Timezone Handling

- Timezone is detected automatically from the user's device on account creation
- Stored on the user's profile — never shown to other mentees
- All session times are displayed in the viewer's local timezone throughout the app
- Mentor sees session times in his own timezone when creating/managing
- iCal feed uses UTC internally; calendar apps convert to local time automatically

---

## Mentee Features

- **Dashboard:** List of upcoming sessions in their local timezone
- **Self-absent:** Mark themselves absent for a specific session (visible to Mentor and Admin)
- **Calendar subscribe:** Prompt on onboarding to add iCal feed to Google or Apple Calendar
- **Account:** View their name, phone number, timezone (read-only after setup)

---

## Mentor Features

- **Session management:** Create, edit, cancel recurring sessions
- **WhatsApp draft generator:** Pre-filled message on cancellation/reschedule
- **Mentee management:** View all mentees, their name, timezone, joined date; remove a mentee
- **Invite management:** Generate invite links with PIN + expiry date; view active/expired invites
- **Absence overview:** See which mentees have marked themselves absent per session

---

## Admin Features (James)

- View all sessions (past and upcoming)
- View all mentees (name, timezone, joined date, absence history)
- Remove a mentee (same as Mentor)
- Cannot create sessions, generate invites, or send broadcasts

---

## Edge Cases — Flagged for Product Owner Review

### 🚩 Timezone changes
If a mentee travels or moves, their stored timezone becomes stale. The iCal feed always shows correct times (calendar app converts UTC), but the in-app display will be wrong.
**Decision needed:** Should mentees be able to update their timezone manually, or auto-update on each login?

### 🚩 Zoom link reuse across sessions
If the mentor pastes the same Zoom link for all sessions in a series and the link expires (Zoom links can have time limits), all sessions break silently.
**Decision needed:** Should the app warn if the same Zoom link is used for sessions more than X weeks out?

### 🚩 iCal feed sync delay
Calendar apps don't sync iCal feeds in real time — Apple Calendar and Google Calendar typically poll every 24 hours. A same-day cancellation may not reach mentees in time via calendar.
**Note:** This is a known limitation of iCal. The manual WhatsApp draft message covers this gap. No action needed unless real-time push becomes a requirement later.

### 🚩 OTP delivery in certain countries
Some countries have unreliable SMS delivery or high costs. Firebase Phone Auth supports international OTP but success rates vary.
**Decision needed:** Should we add a fallback login method (e.g. email OTP) for mentees in regions with poor SMS delivery?

### 🚩 Mentee removes iCal feed manually
If a mentee unsubscribes their iCal feed from their calendar app, they lose session visibility but remain an active mentee in the system. The app has no way to detect this.
**Note:** Re-subscribing is always possible from the app's account page. No action needed — just a UX note.

### 🚩 Mentor account recovery
If the mentor loses access to their phone number, there's no fallback to recover the account. As Admin, James would need a manual recovery path.
**Decision needed:** Should Admin have a "reset mentor phone number" capability, or handle this via Firebase console?

### 🚩 Session created with wrong number of weeks
If the mentor sets 10 weeks but the series should end at 8, there's no "shorten series" option — only cancel remaining.
**Note:** Cancel remaining sessions works as a workaround. Could add "edit series end date" later.

### 🚩 New mentee joins mid-series
When a new mentee joins after a series has already started, they get the iCal feed, but only future sessions appear (past sessions are pruned). This is correct behaviour — flagging for awareness.

### 🚩 PIN sharing
A mentee could technically share their invite link + PIN with someone outside the group before redeeming it.
**Mitigation:** PINs are single-use, so only one person can join per PIN. Expiry dates limit the window. Mentor can revoke unused PINs.

---

## Out of Scope (for now)

- In-app messaging / async check-ins (privacy considerations TBD)
- Automated WhatsApp/SMS notifications
- Custom push notifications
- Tablet support
- Web/desktop access

---

## Open Questions

1. Email OTP fallback for poor-SMS-coverage regions?
2. Auto-update timezone on each login, or allow manual update?
3. Mentor account recovery path — Admin console vs. Firebase console?

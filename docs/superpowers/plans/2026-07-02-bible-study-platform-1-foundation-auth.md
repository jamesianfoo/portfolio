# Bible Study Platform — Plan 1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the mobile-only PWA, wire up Firebase, implement the two-stage auth flow (PIN invite → OTP), and enforce role-based routing — so all three roles (Mentor, Admin, Mentee) can log in and reach their home screen.

**Architecture:** React + Vite PWA hosted on Firebase Hosting. Firebase Auth handles phone OTP. Firestore stores users, roles, and invite PINs. A desktop gate blocks all non-mobile browsers before anything else renders. Routing is role-aware — each role lands on its own home screen after login.

**Tech Stack:** React 18, React Router v6, Vite + vite-plugin-pwa, Firebase 10 (Auth + Firestore + Hosting), Vitest, @testing-library/react, @testing-library/jest-dom, date-fns

**Project root:** `/Users/jf/Documents/BibleStudyPlatform` (new standalone project, separate from portfolio)

**Spec:** `../Portfolio/docs/superpowers/specs/2026-07-02-bible-study-platform-design.md`

---

## File Map

```
BibleStudyPlatform/
├── public/
│   ├── manifest.json              # PWA manifest
│   └── icons/                     # App icons (192x192, 512x512)
├── src/
│   ├── main.jsx                   # React entry point
│   ├── App.jsx                    # Router + auth provider
│   ├── firebase/
│   │   ├── config.js              # Firebase app init
│   │   ├── auth.js                # signInWithPhone, confirmOTP, signOut
│   │   └── invites.js             # createInvite, redeemInvite, validatePin
│   ├── hooks/
│   │   └── useAuth.js             # Current user + role state
│   ├── components/
│   │   ├── MobileGate.jsx         # Blocks desktop, shows phone message
│   │   └── ProtectedRoute.jsx     # Role-based route guard
│   ├── pages/
│   │   ├── Join.jsx               # Step 1: enter PIN
│   │   ├── Setup.jsx              # Step 2: enter name + phone, verify OTP
│   │   ├── Login.jsx              # Return visit: phone + OTP
│   │   ├── mentee/
│   │   │   └── Home.jsx           # Placeholder mentee home
│   │   ├── mentor/
│   │   │   └── Home.jsx           # Placeholder mentor home
│   │   └── admin/
│   │       └── Home.jsx           # Placeholder admin home
│   └── utils/
│       └── timezone.js            # detectTimezone()
├── firestore.rules                # Security rules
├── firebase.json                  # Hosting + emulator config
├── .firebaserc                    # Firebase project alias
├── vite.config.js
├── index.html
└── package.json
```

---

## Task 1: Scaffold Vite + React PWA Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `public/manifest.json`

- [ ] **Step 1: Create project directory and scaffold**

```bash
cd /Users/jf/Documents
npm create vite@latest BibleStudyPlatform -- --template react
cd BibleStudyPlatform
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install firebase react-router-dom date-fns
npm install -D vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bible Study',
        short_name: 'BibleStudy',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/test-setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create placeholder icons directory**

```bash
mkdir -p public/icons
# Add 192x192 and 512x512 PNG icons to public/icons/
# For now, create placeholder files:
touch public/icons/icon-192.png public/icons/icon-512.png
```

- [ ] **Step 6: Replace `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 7: Replace `src/index.css` with minimal mobile-first reset**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  background: #ffffff;
  color: #1a1a2e;
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server running at `http://localhost:5173`

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite + React PWA project"
```

---

## Task 2: Firebase Setup

**Files:**
- Create: `src/firebase/config.js`
- Create: `firestore.rules`
- Create: `firebase.json`
- Create: `.firebaserc`

- [ ] **Step 1: Create Firebase project**

Go to https://console.firebase.google.com → New project → name it `bible-study-platform`.

Enable:
- Firestore Database (start in production mode)
- Authentication → Sign-in method → Phone

- [ ] **Step 2: Get Firebase config**

In Firebase Console → Project Settings → Your apps → Add web app → copy the config object.

- [ ] **Step 3: Create `src/firebase/config.js`**

```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

- [ ] **Step 4: Create `.env.local` with your Firebase values**

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

- [ ] **Step 5: Add `.env.local` to `.gitignore`**

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 6: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isMentor() {
      return isSignedIn() && getRole() == 'mentor';
    }
    function isAdmin() {
      return isSignedIn() && getRole() == 'admin';
    }
    function isMentorOrAdmin() {
      return isMentor() || isAdmin();
    }

    // Users: read own, mentor/admin read all, mentor/admin write all
    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isMentorOrAdmin());
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isSignedIn() && (request.auth.uid == userId || isMentorOrAdmin());
      allow delete: if isMentorOrAdmin();
    }

    // Invites: only mentor creates/reads/deletes
    match /invites/{inviteId} {
      allow read, write, delete: if isMentor();
      // Allow unauthenticated PIN validation (checked by Cloud Function later)
      allow read: if true;
    }

    // Sessions: mentor writes, all signed-in read
    match /sessions/{sessionId} {
      allow read: if isSignedIn();
      allow write: if isMentor();
    }

    // Absences: mentee writes own, mentor/admin reads all
    match /absences/{absenceId} {
      allow create, update: if isSignedIn() && request.auth.uid == resource.data.menteeId;
      allow read: if isSignedIn();
      allow delete: if isMentorOrAdmin();
    }
  }
}
```

- [ ] **Step 7: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [ ] **Step 8: Create `.firebaserc`**

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

- [ ] **Step 9: Install Firebase CLI and login**

```bash
npm install -g firebase-tools
firebase login
firebase use default
```

- [ ] **Step 10: Deploy Firestore rules**

```bash
firebase deploy --only firestore:rules
```
Expected: `Deploy complete!`

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: add Firebase config and Firestore security rules"
```

---

## Task 3: Mobile-Only Gate

**Files:**
- Create: `src/components/MobileGate.jsx`
- Create: `src/components/MobileGate.test.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/MobileGate.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import MobileGate from './MobileGate'

const ChildContent = () => <div>App content</div>

describe('MobileGate', () => {
  const originalNavigator = window.navigator
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
  })

  it('renders children on mobile user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
      writable: true,
    })
    Object.defineProperty(window, 'innerWidth', { value: 390, writable: true })

    render(<MobileGate><ChildContent /></MobileGate>)
    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(screen.queryByText(/use your phone/i)).not.toBeInTheDocument()
  })

  it('renders block screen on desktop user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      writable: true,
    })
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true })

    render(<MobileGate><ChildContent /></MobileGate>)
    expect(screen.queryByText('App content')).not.toBeInTheDocument()
    expect(screen.getByText(/open this on your phone/i)).toBeInTheDocument()
  })

  it('renders block screen when screen width >= 768 even on mobile UA', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
      writable: true,
    })
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    render(<MobileGate><ChildContent /></MobileGate>)
    expect(screen.queryByText('App content')).not.toBeInTheDocument()
    expect(screen.getByText(/open this on your phone/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/MobileGate.test.jsx
```
Expected: FAIL — `MobileGate` not found

- [ ] **Step 3: Implement `MobileGate.jsx`**

```jsx
const MOBILE_UA_PATTERN = /android|iphone|ipad|ipod|blackberry|windows phone/i

function isMobileDevice() {
  return MOBILE_UA_PATTERN.test(navigator.userAgent) && window.innerWidth < 768
}

export default function MobileGate({ children }) {
  if (!isMobileDevice()) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: '#1a1a2e',
        color: '#ffffff',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
          Please open this on your phone
        </h1>
        <p style={{ color: '#aaa', maxWidth: '300px' }}>
          This app is designed for mobile devices only. Open it on your phone to continue.
        </p>
      </div>
    )
  }
  return children
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/MobileGate.test.jsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/MobileGate.jsx src/components/MobileGate.test.jsx
git commit -m "feat: add mobile-only gate component"
```

---

## Task 4: Routing + Auth Provider

**Files:**
- Create: `src/hooks/useAuth.js`
- Create: `src/components/ProtectedRoute.jsx`
- Create: `src/components/ProtectedRoute.test.jsx`
- Create: `src/pages/mentee/Home.jsx`
- Create: `src/pages/mentor/Home.jsx`
- Create: `src/pages/admin/Home.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/hooks/useAuth.js`**

```js
import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [role, setRole] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setRole(snap.exists() ? snap.data().role : null)
        setUser(firebaseUser)
      } else {
        setUser(null)
        setRole(null)
      }
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Write the failing test for ProtectedRoute**

Create `src/components/ProtectedRoute.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))
import { useAuth } from '../hooks/useAuth'

const Dashboard = () => <div>Dashboard</div>

describe('ProtectedRoute', () => {
  it('shows loading state while auth is resolving', () => {
    useAuth.mockReturnValue({ user: undefined, role: null, loading: true })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['mentee']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ user: null, role: null, loading: false })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['mentee']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders children when role matches', () => {
    useAuth.mockReturnValue({ user: { uid: '123' }, role: 'mentee', loading: false })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['mentee']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects to /login when role does not match', () => {
    useAuth.mockReturnValue({ user: { uid: '123' }, role: 'mentee', loading: false })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/components/ProtectedRoute.test.jsx
```
Expected: FAIL — `ProtectedRoute` not found

- [ ] **Step 4: Implement `ProtectedRoute.jsx`**

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) return null

  if (!user || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/components/ProtectedRoute.test.jsx
```
Expected: PASS (4 tests)

- [ ] **Step 6: Create placeholder home pages**

Create `src/pages/mentee/Home.jsx`:
```jsx
export default function MenteeHome() {
  return <div style={{ padding: '1.5rem' }}><h1>Upcoming Sessions</h1><p>Coming soon.</p></div>
}
```

Create `src/pages/mentor/Home.jsx`:
```jsx
export default function MentorHome() {
  return <div style={{ padding: '1.5rem' }}><h1>Mentor Dashboard</h1><p>Coming soon.</p></div>
}
```

Create `src/pages/admin/Home.jsx`:
```jsx
export default function AdminHome() {
  return <div style={{ padding: '1.5rem' }}><h1>Admin Dashboard</h1><p>Coming soon.</p></div>
}
```

- [ ] **Step 7: Create `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import MobileGate from './components/MobileGate'
import ProtectedRoute from './components/ProtectedRoute'
import Join from './pages/Join'
import Setup from './pages/Setup'
import Login from './pages/Login'
import MenteeHome from './pages/mentee/Home'
import MentorHome from './pages/mentor/Home'
import AdminHome from './pages/admin/Home'

function RoleRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'mentor') return <Navigate to="/mentor" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'mentee') return <Navigate to="/mentee" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <MobileGate>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/join" element={<Join />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute allowedRoles={['mentee']} />}>
              <Route path="/mentee" element={<MenteeHome />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
              <Route path="/mentor" element={<MentorHome />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminHome />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MobileGate>
  )
}
```

- [ ] **Step 8: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: add routing, auth provider, and role-based protected routes"
```

---

## Task 5: Timezone Detection

**Files:**
- Create: `src/utils/timezone.js`
- Create: `src/utils/timezone.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/timezone.test.js`:
```js
import { detectTimezone } from './timezone'

describe('detectTimezone', () => {
  it('returns the browser IANA timezone string', () => {
    const tz = detectTimezone()
    // IANA timezone strings always contain a slash (e.g. "America/New_York")
    // or are a named zone like "UTC"
    expect(typeof tz).toBe('string')
    expect(tz.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/utils/timezone.test.js
```
Expected: FAIL — `detectTimezone` not found

- [ ] **Step 3: Implement `src/utils/timezone.js`**

```js
export function detectTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function formatInTimezone(date, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/utils/timezone.test.js
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/timezone.js src/utils/timezone.test.js
git commit -m "feat: add timezone detection utility"
```

---

## Task 6: PIN Invite — Generation and Validation

**Files:**
- Create: `src/firebase/invites.js`
- Create: `src/firebase/invites.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/firebase/invites.test.js`:
```js
import { generatePin, isInviteExpired, isInviteRedeemed } from './invites'

describe('generatePin', () => {
  it('returns a 6-character uppercase alphanumeric string', () => {
    const pin = generatePin()
    expect(pin).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('generates unique pins on repeated calls', () => {
    const pins = new Set(Array.from({ length: 20 }, () => generatePin()))
    expect(pins.size).toBeGreaterThan(15)
  })
})

describe('isInviteExpired', () => {
  it('returns true when expiry is in the past', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    expect(isInviteExpired({ expiresAt: pastDate })).toBe(true)
  })

  it('returns false when expiry is in the future', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    expect(isInviteExpired({ expiresAt: futureDate })).toBe(false)
  })
})

describe('isInviteRedeemed', () => {
  it('returns true when redeemedAt is set', () => {
    expect(isInviteRedeemed({ redeemedAt: '2026-07-01T00:00:00Z' })).toBe(true)
  })

  it('returns false when redeemedAt is null', () => {
    expect(isInviteRedeemed({ redeemedAt: null })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/firebase/invites.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement `src/firebase/invites.js`**

```js
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from './config'

export function generatePin() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // removed ambiguous chars O,0,I,1
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function isInviteExpired(invite) {
  return new Date(invite.expiresAt) < new Date()
}

export function isInviteRedeemed(invite) {
  return Boolean(invite.redeemedAt)
}

export async function createInvite({ expiresAt }) {
  const pin = generatePin()
  const inviteRef = doc(collection(db, 'invites'))
  await setDoc(inviteRef, {
    id: inviteRef.id,
    pin,
    expiresAt: expiresAt.toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdAt: new Date().toISOString(),
  })
  return { id: inviteRef.id, pin }
}

export async function validatePin(pin) {
  const q = query(collection(db, 'invites'), where('pin', '==', pin.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return { valid: false, reason: 'not_found' }
  const invite = snap.docs[0].data()
  if (isInviteExpired(invite)) return { valid: false, reason: 'expired' }
  if (isInviteRedeemed(invite)) return { valid: false, reason: 'already_used' }
  return { valid: true, invite }
}

export async function redeemInvite(inviteId, userId) {
  await updateDoc(doc(db, 'invites', inviteId), {
    redeemedAt: new Date().toISOString(),
    redeemedBy: userId,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/firebase/invites.test.js
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/firebase/invites.js src/firebase/invites.test.js
git commit -m "feat: add PIN invite generation and validation logic"
```

---

## Task 7: Auth Helpers

**Files:**
- Create: `src/firebase/auth.js`

- [ ] **Step 1: Create `src/firebase/auth.js`**

```js
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import { detectTimezone } from '../utils/timezone'

export function setupRecaptcha(containerId) {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
}

export async function sendOTP(phoneNumber, recaptchaVerifier) {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

export async function createUserProfile({ uid, name, phone, role = 'mentee' }) {
  const timezone = detectTimezone()
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    phone,
    role,
    timezone,
    icalToken: crypto.randomUUID(),
    joinedAt: new Date().toISOString(),
  })
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function updatePhoneNumber(uid, newPhone) {
  await updateDoc(doc(db, 'users', uid), { phone: newPhone })
}

export async function signOut() {
  await firebaseSignOut(auth)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/firebase/auth.js
git commit -m "feat: add auth helpers (OTP, user profile creation)"
```

---

## Task 8: Join Page (PIN Entry)

**Files:**
- Create: `src/pages/Join.jsx`

- [ ] **Step 1: Create `src/pages/Join.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validatePin } from '../firebase/invites'

export default function Join() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await validatePin(pin)
      if (!result.valid) {
        const messages = {
          not_found: 'Invalid invite code. Check with your mentor.',
          expired: 'This invite has expired. Ask your mentor for a new link.',
          already_used: 'This invite has already been used.',
        }
        setError(messages[result.reason] || 'Invalid invite.')
        return
      }
      // Store invite in sessionStorage for the Setup page to use
      sessionStorage.setItem('pendingInvite', JSON.stringify(result.invite))
      navigate('/setup')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Welcome</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Enter the invite code your mentor sent you.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={pin}
          onChange={e => setPin(e.target.value.toUpperCase())}
          placeholder="Enter 6-digit code"
          maxLength={6}
          style={{
            width: '100%', padding: '0.75rem', fontSize: '1.25rem',
            letterSpacing: '0.2em', textAlign: 'center', border: '2px solid #ddd',
            borderRadius: '8px', marginBottom: '1rem',
          }}
          autoFocus
        />
        {error && <p style={{ color: '#e53e3e', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        <button
          type="submit"
          disabled={pin.length < 6 || loading}
          style={{
            width: '100%', padding: '0.875rem', background: '#1a1a2e',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '1rem', opacity: (pin.length < 6 || loading) ? 0.5 : 1,
          }}
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Join.jsx
git commit -m "feat: add join page (PIN entry)"
```

---

## Task 9: Setup Page (Account Creation + OTP Verification)

**Files:**
- Create: `src/pages/Setup.jsx`

- [ ] **Step 1: Create `src/pages/Setup.jsx`**

```jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setupRecaptcha, sendOTP, createUserProfile } from '../firebase/auth'
import { redeemInvite } from '../firebase/invites'

export default function Setup() {
  const [step, setStep] = useState('details') // 'details' | 'otp'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const confirmationRef = useRef(null)
  const recaptchaRef = useRef(null)
  const navigate = useNavigate()

  async function handleSendOTP(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      recaptchaRef.current = setupRecaptcha('recaptcha-container')
      confirmationRef.current = await sendOTP(phone, recaptchaRef.current)
      setStep('otp')
    } catch {
      setError('Could not send OTP. Check the phone number and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await confirmationRef.current.confirm(otp)
      const uid = result.user.uid
      const invite = JSON.parse(sessionStorage.getItem('pendingInvite'))
      await createUserProfile({ uid, name, phone })
      await redeemInvite(invite.id, uid)
      sessionStorage.removeItem('pendingInvite')
      navigate('/mentee')
    } catch {
      setError('Incorrect code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Verify your number</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          We sent a code to {phone}
        </p>
        <form onSubmit={handleVerifyOTP}>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            placeholder="6-digit code"
            maxLength={6}
            inputMode="numeric"
            style={{
              width: '100%', padding: '0.75rem', fontSize: '1.25rem',
              letterSpacing: '0.2em', textAlign: 'center', border: '2px solid #ddd',
              borderRadius: '8px', marginBottom: '1rem',
            }}
            autoFocus
          />
          {error && <p style={{ color: '#e53e3e', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={otp.length < 6 || loading}
            style={{
              width: '100%', padding: '0.875rem', background: '#1a1a2e',
              color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem',
              opacity: (otp.length < 6 || loading) ? 0.5 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Create your account</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Just your name and phone number.
      </p>
      <form onSubmit={handleSendOTP}>
        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          style={{
            width: '100%', padding: '0.75rem', border: '2px solid #ddd',
            borderRadius: '8px', marginBottom: '1.25rem', fontSize: '1rem',
          }}
        />
        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>
          Phone number (with country code)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          style={{
            width: '100%', padding: '0.75rem', border: '2px solid #ddd',
            borderRadius: '8px', marginBottom: '1.25rem', fontSize: '1rem',
          }}
        />
        {error && <p style={{ color: '#e53e3e', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        <div id="recaptcha-container" />
        <button
          type="submit"
          disabled={!name.trim() || !phone.trim() || loading}
          style={{
            width: '100%', padding: '0.875rem', background: '#1a1a2e',
            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem',
            opacity: (!name.trim() || !phone.trim() || loading) ? 0.5 : 1,
          }}
        >
          {loading ? 'Sending code...' : 'Send verification code'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Setup.jsx
git commit -m "feat: add account setup page (name + phone + OTP verification)"
```

---

## Task 10: Login Page (Return Visits)

**Files:**
- Create: `src/pages/Login.jsx`

- [ ] **Step 1: Create `src/pages/Login.jsx`**

```jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setupRecaptcha, sendOTP } from '../firebase/auth'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function Login() {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const confirmationRef = useRef(null)
  const recaptchaRef = useRef(null)
  const navigate = useNavigate()
  const { user, role } = useAuth()

  // If already logged in, redirect to role home
  useEffect(() => {
    if (user && role) {
      navigate(`/${role}`, { replace: true })
    }
  }, [user, role, navigate])

  async function handleSendOTP(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      recaptchaRef.current = setupRecaptcha('recaptcha-container')
      confirmationRef.current = await sendOTP(phone, recaptchaRef.current)
      setStep('otp')
    } catch {
      setError('Could not send OTP. Check the phone number and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirmationRef.current.confirm(otp)
      // useAuth will detect the new auth state and redirect via the useEffect above
    } catch {
      setError('Incorrect code. Please try again.')
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Enter your code</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Sent to {phone}</p>
        <form onSubmit={handleVerifyOTP}>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            placeholder="6-digit code"
            maxLength={6}
            inputMode="numeric"
            style={{
              width: '100%', padding: '0.75rem', fontSize: '1.25rem',
              letterSpacing: '0.2em', textAlign: 'center', border: '2px solid #ddd',
              borderRadius: '8px', marginBottom: '1rem',
            }}
            autoFocus
          />
          {error && <p style={{ color: '#e53e3e', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={otp.length < 6 || loading}
            style={{
              width: '100%', padding: '0.875rem', background: '#1a1a2e',
              color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem',
              opacity: (otp.length < 6 || loading) ? 0.5 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Sign in</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>We'll send you a verification code.</p>
      <form onSubmit={handleSendOTP}>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          style={{
            width: '100%', padding: '0.75rem', border: '2px solid #ddd',
            borderRadius: '8px', marginBottom: '1rem', fontSize: '1rem',
          }}
          autoFocus
        />
        {error && <p style={{ color: '#e53e3e', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        <div id="recaptcha-container" />
        <button
          type="submit"
          disabled={!phone.trim() || loading}
          style={{
            width: '100%', padding: '0.875rem', background: '#1a1a2e',
            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem',
            opacity: (!phone.trim() || loading) ? 0.5 : 1,
          }}
        >
          {loading ? 'Sending...' : 'Send code'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Login.jsx
git commit -m "feat: add login page (OTP return visit flow)"
```

---

## Task 11: Build + Deploy to Firebase Hosting

**Files:**
- None new

- [ ] **Step 1: Build the PWA**

```bash
npm run build
```
Expected: `dist/` directory created, no errors

- [ ] **Step 2: Run all tests before deploying**

```bash
npx vitest run
```
Expected: All tests pass

- [ ] **Step 3: Deploy to Firebase Hosting**

```bash
firebase deploy --only hosting
```
Expected: `Hosting URL: https://your-project.web.app`

- [ ] **Step 4: Verify mobile gate on desktop**

Open `https://your-project.web.app` on a laptop browser.
Expected: Full-screen block — "Please open this on your phone"

- [ ] **Step 5: Verify app loads on mobile**

Open the URL on a phone. Expected: Join page loads (or redirect to `/login` if no PIN in URL).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: production build and Firebase Hosting deployment verified"
```

---

## What's Next

**Plan 2: Sessions + iCal** covers:
- Session data model in Firestore
- Recurring session creation (Mentor)
- Firebase Function — per-mentee iCal feed endpoint
- Edit single session / full series
- Cancel session + auto-generated WhatsApp draft message

**Plan 3: Dashboards + Admin** covers:
- Mentee dashboard (upcoming sessions in local timezone)
- Self-absent marking
- Calendar subscribe flow (Google + Apple)
- Mentor dashboard, session list, absence overview
- Mentee management (view, remove)
- Admin view (sessions + mentees)
- Phone number reset (Mentor + Admin capability)
- Invite management (generate, view active/expired, revoke)

# Chesto.us

Personal site for photography, recipes, and blog posts. Built with Vite + React, Tailwind CSS, and Firebase.

## Stack

- **Frontend**: Vite + React 18 + React Router v6
- **Styling**: Tailwind CSS with custom brand tokens
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Deployment**: Vercel (recommended)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/PeytonChester/chesto-us.git
cd chesto-us
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable these services:
   - **Firestore Database** (start in production mode)
   - **Storage**
   - **Authentication** → Email/Password
3. Go to Project Settings → Your Apps → Add Web App
4. Copy the config values

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Fill in your Firebase values in .env.local
```

### 4. Create your admin account

In Firebase Console → Authentication → Users → Add User  
Use any email/password you like — that's your login for `/admin`.

### 5. Set up Firestore rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

And for Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## Admin Panel

Go to `/admin` (linked quietly in the footer). Sign in with your Firebase Auth credentials to:

- **Upload photos** by category (Wildlife, Macro, Street, Architecture, Sports, Nature)
- **Add and edit recipes** with ingredients (auto-scaling by servings), step-by-step instructions, and cover photos
- **Write blog posts** with cover images and formatted body text

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → Select this repo
3. Add your environment variables (same as `.env.local`) in the Vercel dashboard
4. Deploy — it will auto-deploy on every push to `main`

## Project Structure

```
src/
  components/     Layout, Nav, Footer
  pages/          Public pages (Home, Photography, Recipes, Blog)
  pages/admin/    Admin panel (Login, Dashboard, Photos, Recipes, Blog editors)
  hooks/          useAuth, useCollection
  firebase.js     Firebase initialization
  index.css       Tailwind + custom component classes
```

## Firestore Collections

| Collection | Fields |
|---|---|
| `photos` | url, storagePath, category, title, createdAt |
| `recipes` | title, slug, excerpt, category, prepTime, cookTime, servings, difficulty, ingredients[], instructions[], notes, imageUrl, createdAt |
| `posts` | title, slug, excerpt, category, body[], imageUrl, createdAt |

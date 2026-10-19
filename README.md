# CampusAI

An AI-powered study assistant for university students, built as a Level 300 Computer Science semester project at Riverdale School of Management Science and Technology (RSMST).

**Live demo:** https://campusai-web.vercel.app

Built by Bayode Philip Sunday.

## What it does

CampusAI helps students understand difficult course topics and turn long lecture notes into short summaries. It is a responsive website that works in the browser on phones and computers.

## Features

- **Accounts:** sign up, log in, log out and password reset with Firebase Authentication
- **Email verification:** a 6-digit code is emailed to each new student and checked on the server, with expiry, a resend wait and a limit on wrong tries
- **AI chat:** questions are answered by Google Gemini in a clear, teacher-style format with headings, lists, tables and code blocks
- **Note summarizer:** paste lecture notes and get a title and key points, with share and copy options
- **Protected pages:** the Dashboard, Chat, Notes and Profile are only available to logged-in students with a verified email
- **Design:** responsive layout (bottom tabs on phones, side menu on computers), light and dark theme, logo and splash screen
- **Legal pages:** Terms and Conditions and Privacy Policy, with an agreement box on sign up

## Still demo or planned

- Save Summary and Recent Activities use demo data (saving with Firestore is planned)
- Edit Profile, Notifications, Upload Notes and chat attachments are not built yet

## Built with

- Next.js (App Router) and JavaScript
- CSS Modules with a shared theme (CSS variables)
- Firebase Authentication and Firestore (with the Firebase Admin SDK on the server)
- Google Gemini API (server routes keep the key private)
- Brevo (sends the verification emails)
- react-markdown (shows AI answers safely, without running raw HTML)
- Deployed on Vercel

## How verification works

1. After sign up, the server creates a random 6-digit code.
2. Only a salted hash of the code is stored in Firestore, with an expiry time (10 minutes) and a counter of wrong tries (5 allowed).
3. The code is emailed through Brevo. A new code can be requested after 60 seconds.
4. The student types the code. The server checks it and then marks the account as verified.

## Project structure

    src/
    ├── app/
    │   ├── api/              Server routes (chat, summarize, verification)
    │   ├── login/ signup/ verify-email/ terms/ privacy/
    │   └── (main)/           Pages that need login: dashboard, chat, notes, profile
    ├── components/           Reusable pieces (Button, Input, Card, ChatBubble, Footer, ...)
    └── lib/                  Firebase setup, login helpers, server helpers

## Run it locally

1. Install the packages:

        npm install

2. Create a file named `.env.local` in the project root with these names (use your own values, and never commit this file):

        GEMINI_API_KEY=
        GEMINI_MODEL=
        NEXT_PUBLIC_FIREBASE_API_KEY=
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
        NEXT_PUBLIC_FIREBASE_APP_ID=
        FIREBASE_SERVICE_ACCOUNT_BASE64=
        BREVO_API_KEY=
        EMAIL_FROM_NAME=
        EMAIL_FROM_ADDRESS=

3. Start the app:

        npm run dev

4. Open http://localhost:3000

## Notes

CampusAI was first started as a React Native (Expo) mobile app and was then rebuilt as a Next.js website. The original mobile version is kept in a separate repository under the tag `expo-version`.

AI answers can contain mistakes. Students should check important information with their lecture notes and lecturers.

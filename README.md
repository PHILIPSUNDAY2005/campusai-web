# CampusAI

An AI-powered campus assistant web app for students, built as a Level 300 Computer Science semester project.

**Live demo:** https://campusai-web-something.vercel.app

## What it does

CampusAI helps students understand difficult course topics and summarize their lecture notes. It is a responsive website that works in the browser on phones and computers.

## Current status

This version is the complete user interface, running on demo data:

- Login and Sign Up pages with form validation
- Dashboard with feature cards and recent activities
- AI Chat screen (demo replies)
- Note summary result screen with Save and Share
- Profile page
- Responsive navigation: bottom tabs on phones, side menu on computers

**Planned next:** Firebase Authentication, Firestore, Gemini AI integration, real note summarization, and file upload.

## Built with

- Next.js (App Router) and JavaScript
- CSS Modules with a shared theme (CSS variables)
- React Icons
- Deployed on Vercel

## Project structure

    src/
    ├── app/            Pages (each folder is a web address)
    │   ├── login/
    │   ├── signup/
    │   └── (main)/     Pages that share the navigation
    │       ├── dashboard/
    │       ├── chat/
    │       ├── notes/
    │       └── profile/
    └── components/     Reusable pieces (Button, Input, Card, ChatBubble, ...)

## Run it locally

    npm install
    npm run dev

Then open http://localhost:3000

## Notes

CampusAI was first started as a React Native (Expo) mobile app and was moved to a Next.js website. The original mobile version is kept in a separate repository under the tag `expo-version`.

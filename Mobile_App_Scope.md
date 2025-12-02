# Mobile Application Scope: Android & iOS Expansion

This document outlines the scope for extending the Electrical Safety Audit System into dedicated mobile applications for Android and iOS platforms.

## 1. Strategic Objective
To empower field engineers with a robust, offline-capable mobile tool that simplifies on-site data collection, leverages device hardware (camera, GPS), and ensures productivity even in areas with poor connectivity.

## 2. Core Mobile Features

### 2.1 Offline-First Architecture (Critical)
*   **Local Database:** Implementation of a local database (e.g., SQLite or Realm) on the device.
*   **Sync Engine:**
    *   Engineers can perform full audits without internet access (e.g., in basements or remote sites).
    *   Data automatically syncs with the central cloud server once connectivity is restored.
    *   Conflict resolution handling for data consistency.

### 2.2 Enhanced Media Capture
*   **Native Camera Integration:**
    *   Take photos directly within the app without switching contexts.
    *   In-app basic image editing (crop, rotate, annotate/draw arrows on issues).
    *   Multi-shot mode to capture multiple observations quickly.
*   **Voice-to-Text Notes:** Use the device's microphone to dictate observations instead of typing, speeding up data entry.

### 2.3 Location & Context Awareness
*   **Geo-Tagging:** Automatically capture GPS coordinates for every audit to verify site visits.
*   **Time-Stamping:** Immutable timestamps for start and end times of the inspection.

### 2.4 User Experience (UX) Optimization
*   **Biometric Login:** Secure and fast access using Fingerprint or Face ID.
*   **Push Notifications:** Real-time alerts for assigned audits, sync status, or urgent admin messages.
*   **Dark Mode:** Native dark mode support for better visibility in low-light environments (e.g., electrical rooms).

## 3. Technology Stack Strategy

### Recommended Approach: Cross-Platform Development (React Native)
Given the existing web application is built with **React**, using **React Native** (specifically with **Expo**) is the most efficient strategy.

*   **Code Reusability:** Up to 70-80% of the business logic and state management code from the web app can be reused.
*   **Single Codebase:** Develop once and deploy to both Android (Google Play Store) and iOS (Apple App Store).
*   **Performance:** Near-native performance suitable for forms and image handling.

### Alternative: Hybrid Wrapper (Capacitor/Ionic)
*   Wrap the existing Next.js web application in a native container.
*   **Pros:** Fastest time to market; uses the exact same code.
*   **Cons:** Less "native" feel; offline management is more complex than a true native app.

## 4. Development Phases

### Phase 1: MVP (Minimum Viable Product)
*   Basic Form Entry (matching web app).
*   Native Camera support.
*   PDF/Docx Generation on-device.
*   Local storage (simple offline mode).

### Phase 2: Cloud Sync & Accounts
*   User Authentication.
*   Cloud Database Sync.
*   Audit History view.

### Phase 3: Advanced Features
*   Image Annotation.
*   Geo-fencing.
*   Push Notifications.

## 5. Deliverables
*   **Android APK/AAB file** ready for Google Play Console.
*   **iOS IPA file** ready for Apple TestFlight/App Store Connect.
*   **Source Code Repository** (separate or monorepo with web).

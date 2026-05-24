# VanLoka RTO Project Report

## Executive Summary

VanLoka RTO is a Create React App-based learner license mock test portal for Karnataka RTO preparation. The app provides a trainee login gate, a timed 20-question mock test, multilingual UI support, result review, local attempt history, and a trainee verification abstraction intended to connect with an external backend.

The current implementation is a frontend-only prototype with localStorage persistence and demo authentication. It is suitable for interactive demos and early product validation, but it needs backend integration, encoding fixes, stronger test coverage, and a completed dashboard before production use.

## Technology Stack

- Framework: React 19.2.6 with Create React App / react-scripts 5.0.1
- Routing: react-router-dom 6.30.3
- Testing: Jest and React Testing Library via CRA
- State management: React Context and component state
- Persistence: browser localStorage
- Styling: global CSS in `src/styles/theme.css`
- Database planning: PostgreSQL schema migration in `database/mock_test_schema.sql`

## Project Structure

```text
vanloka-rto/
  database/
    mock_test_schema.sql
  public/
    index.html
    manifest.json
    static CRA assets
  src/
    App.jsx
    index.js
    components/
    context/
    data/
    pages/
    services/
    styles/
```

## Application Routing

Routes are defined in `src/App.jsx`.

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Authenticated | Home / landing workspace |
| `/login` | Public | Demo trainee login form |
| `/trainee` | Public redirect | Redirects to `/login` |
| `/test` | Authenticated | Timed mock test |
| `/results` | Authenticated | Result summary and review |
| `/dashboard` | Authenticated | Placeholder dashboard page |
| `*` | Public redirect | Redirects to `/` |

Most app pages are wrapped in `RequireAuth`, so unauthenticated users are sent to `/login`.

## Core User Journeys

### 1. Login

The login page is implemented in `src/pages/TraineePortal.jsx`.

- The demo credentials are currently hardcoded as `Ram / 9874563210`.
- Login validates name and mobile number locally.
- A successful login stores an auth session under `vanloka_auth_session`.
- The app also stores a verified trainee object under `vanloka_verified_trainee`.

### 2. Home

The home page is implemented in `src/pages/Home.jsx`.

- Displays the main VanLoka mock test entry point.
- Shows latest attempt summary if local history exists.
- Provides links to trainee login, test start, dashboard, and results.

### 3. Mock Test

The mock test is implemented in `src/pages/MockTest.jsx`.

- Selects 20 random questions from the question bank.
- Randomizes option order per question.
- Runs a 30-minute timer.
- Requires users to accept rules before starting.
- Supports question navigation, answer selection, cancellation confirmation, and submit confirmation for unanswered questions.
- Saves completed attempts to localStorage under `vanloka_test_history`.
- Pass mark is hardcoded as 12 out of 20.

### 4. Results Review

The results page is implemented in `src/pages/Results.jsx`.

- Reads the submitted result from router state or falls back to the latest localStorage history item.
- Displays score, pass/fail status, time taken, trainee details, and metrics.
- Supports clipboard sharing.
- Displays question-by-question review, including correct answers and explanations.
- Calls the AI report service to generate a personalized performance report.

### 5. Dashboard

`src/pages/Dashboard.jsx` currently renders only the authenticated top navigation. UI strings and CSS suggest a fuller dashboard was planned, but the page logic has not been implemented.

## Data and Domain Model

### Question Bank

Questions live in `src/data/questions.js`.

- Total questions found: 50
- Categories:
  - Traffic Rules: 10
  - Traffic Signals: 10
  - Road Signs - Mandatory: 10
  - Road Signs - Cautionary: 10
  - Road Signs - Informatory: 10
- Each question includes:
  - `id`
  - `category`
  - localized `question`
  - localized `options`
  - `correct` option index
  - localized `explanation`

The app copy says "100+ questions" in several places, but the repository currently contains 50 question entries. This is a product/content mismatch.

### Local Storage Keys

| Key | Purpose |
| --- | --- |
| `vanloka_auth_session` | Stores the current demo user session |
| `vanloka_verified_trainee` | Stores normalized trainee details |
| `vanloka_lang` | Stores selected language |
| `vanloka_theme` | Stores light/dark theme |
| `vanloka_test_history` | Stores completed mock test results |

### Database Schema

`database/mock_test_schema.sql` creates a `mock_test` schema and `mock_test.trainee` table.

The table mirrors verified trainee details from `mds.mds_trainees` and tracks:

- trainee ID
- name
- mobile number
- attempts
- best score
- created/updated timestamps

The migration only creates new schema objects and avoids modifying existing source tables.

## Authentication and Trainee Verification

There are two related mechanisms:

1. Demo auth in `AuthContext.jsx`
   - Validates hardcoded local credentials.
   - Persists a minimal user session.

2. Verification service in `services/traineeVerification.js`
   - Supports an environment variable: `REACT_APP_TRAINEE_VERIFY_URL`.
   - Sends trainee ID, phone, token, source, and table metadata to a backend endpoint.
   - Falls back to demo trainee data in development.
   - Throws in production if the backend URL is not configured.

Important gap: the current `/login` page does not call `verifyTrainee`; it performs only hardcoded demo credential validation. The README describes optional trainee query params and backend verification, but the active route now redirects `/trainee` to `/login`, and the login form does not consume query params.

## AI Report Service

`src/services/aiReport.js` builds a structured prompt from the user's score, time taken, weakest category, and wrong answer topics.

Current behavior:

- Calls `https://api.gemini.com/v1/messages`.
- Requests model `geminiflash`.
- Returns plain text report content if the response shape matches.
- Falls back to `null` and lets the UI show a generic encouragement card.

Risks:

- The endpoint and payload shape may not match a real Gemini API.
- No API key or auth header is configured.
- Browser-side calls to third-party AI APIs expose integration details and can hit CORS/auth issues.
- Production should proxy this through a backend service.

## UI and Styling

The UI uses global CSS in `src/styles/theme.css`.

Notable features:

- Light/dark theme support through `html[data-theme]`
- Responsive layouts for landing, test, and results pages
- Full-page authenticated shell and top navigation
- Modal confirmation dialogs
- Result confetti effect for passed attempts
- Desktop-oriented design with mobile breakpoints

The CSS file is large and appears to include styles for planned dashboard sections that are not currently rendered by the dashboard page.

## Internationalization Status

The app intends to support English, Kannada, and Hindi through:

- `LanguageContext.jsx`
- `ui_strings.js`
- localized question/option/explanation fields
- language selectors in navigation and `LanguageToggle`

However, many Kannada and Hindi strings appear mojibake-encoded in source, for example visible sequences such as `à²...` and `à¤...`. This likely means the original UTF-8 text was decoded or saved incorrectly. The multilingual UI will render broken text until these strings are corrected.

## Testing Status

Command run:

```bash
npm.cmd test -- --watchAll=false
```

Result: failed.

Failure reason:

- `src/App.test.js` expects the home headline to be rendered immediately.
- The current app redirects unauthenticated users to `/login`.
- The rendered page is the login form, not the authenticated home page.

The test should be updated to either:

- assert the login screen for an unauthenticated user, or
- seed/mock auth state before expecting the home page.

## Key Strengths

- Clear separation between pages, shared components, contexts, services, and data.
- Mock test flow is functionally complete: timer, random question selection, shuffled options, scoring, history, result review, and retake path.
- The trainee verification service is already abstracted for backend integration.
- The PostgreSQL migration is conservative and references the intended source MDS trainee table.
- UI polish is relatively high for a prototype, especially on the test and result screens.

## Main Risks and Gaps

1. Dashboard is incomplete.
   - The route exists, but the page renders only navigation.

2. Tests are stale.
   - The only app test fails after authentication gating was introduced.

3. Multilingual text is corrupted.
   - Kannada/Hindi source strings need replacement with valid Unicode text.

4. README is partly outdated.
   - It says `/trainee` accepts query params and verifies trainees, but `/trainee` currently redirects to `/login`.

5. Question count mismatch.
   - UI says 100+ questions; repository contains 50.

6. AI integration is not production-ready.
   - Endpoint, auth, CORS, and API shape need validation.

7. Authentication is demo-only.
   - Production auth/verification must move to a backend-backed flow.

8. All attempt history is client-side.
   - localStorage can be cleared, edited, or lost across devices.

9. Randomization is not reproducible.
   - Attempts do not store the shuffled option order, so review fallback reconstructs questions in original order when router state is unavailable.

10. Timer and test integrity are client-side only.
    - Users can refresh, edit localStorage, or manipulate browser state.

## Recommended Next Steps

### High Priority

1. Fix `App.test.js` to match the authenticated routing behavior.
2. Restore valid Kannada and Hindi strings in `ui_strings.js`, `questions.js`, and language labels.
3. Decide whether `/trainee` should be a real verification entry route or simply an alias for `/login`, then update code and README consistently.
4. Implement or remove the dashboard route until it has meaningful content.
5. Replace browser-side AI calls with a backend endpoint.

### Medium Priority

1. Persist completed attempts to a backend database.
2. Add tests for login, protected routing, test submission, scoring, and results fallback.
3. Store complete attempt snapshots, including question order and option order.
4. Align question bank copy with the actual number of questions or add more questions.
5. Add error boundaries or user-visible fallback states for malformed localStorage.

### Production Readiness

1. Connect trainee verification to `REACT_APP_TRAINEE_VERIFY_URL`.
2. Add backend endpoints for attempt creation, best score updates, and dashboard analytics.
3. Move pass mark, test size, and timer duration into configuration.
4. Add accessibility checks for modals, focus trapping, keyboard navigation, and color contrast.
5. Add deployment documentation for environment variables and backend dependencies.

## Overall Assessment

VanLoka RTO is a strong frontend prototype for a learner license mock test product. The main test-taking experience is already usable and thoughtfully structured. The largest work remaining is not basic UI construction; it is hardening the product boundary: real trainee verification, durable attempt storage, working multilingual content, production-safe AI reporting, and tests that protect the intended user flows.

# Trao | The AI Interview Prep Kit
**Assessment ID:** `FS-AI-INTERVIEW-01`  
**Application Overview:** Autonomous full-stack system and evaluation pipeline that transforms any job description, company URL, and preparation timeframe into a structured, personalized, and reshapeable interview preparation kit. Built with pure JavaScript (Node.js ES Modules and React JSX).

> 🚀 **Live Production Application:** [https://trao-frontend-pto1.onrender.com](https://trao-frontend-pto1.onrender.com)  
> ⚡ **Live Backend API Health:** [https://trao-backend-41qq.onrender.com/api/health](https://trao-backend-41qq.onrender.com/api/health)  
> 🎬 **Video Walkthrough Script & Review Defense:** [presentation_guide.md](./presentation_guide.md)  
> ☁️ **Render Cloud Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 1. Project Overview & Tech Stack Justification

The AI Interview Prep Kit adheres strictly to the Trao assessment specifications. It combines automated web retrieval, category-tailored LLM generation, deterministic arithmetic scheduling, code-level coverage verification, and an interactive study suite.

| Layer | Chosen Technology | Justification & Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router) + React JSX + Tailwind CSS** | Server-side performance, fast page transitions, responsive layouts for mobile and desktop, and a sleek modern UI with glassmorphism and real-time state updates using pure JavaScript/JSX. |
| **Backend** | **Node.js (ES Modules) + Express (Pure JavaScript)** | Enforces clean architectural separation between retrieval, extraction, LLM orchestration, deterministic logic, and API endpoints without transpilation overhead. |
| **Database** | **MongoDB (Mongoose) + Hybrid Resilient Storage** | Provides schema validation and document storage. Implements a hybrid adapter pattern: connects to MongoDB when available, and automatically activates an in-memory/JSON-file fallback store when running offline or on a clean clone without a local MongoDB service. |
| **Scraping** | **Cheerio + Axios + robots-parser + SSRF Validator** | Handles intelligent page retrieval, parses `robots.txt`, executes semantic link ranking to discover buried hiring pages without hardcoded paths, cleans DOM content, and blocks SSRF attacks. |
| **LLM Provider** | **Google Gemini (Free Tier) & Groq API** | Uses Google Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite` via `@google/generative-ai`) and Groq (`llama-3.3-70b-versatile`), both offering generous free tiers. Equipped with an exponential backoff rate limiter and an offline mock provider for deterministic local test runs. |
| **Testing** | **Vitest** | Fast modern test runner verifying schedule allocation, coverage checks, structure schemas, and the batch CLI runner in pure JavaScript. |

---

## 2. Setup Instructions (Local & Deployed)

### Prerequisites
- Node.js `v18+` (tested on Node `v24.15.0`)
- npm `v9+` (tested on npm `v11.16.0`)
- Git

### Installation from a Clean Clone
1. **Clone the repository:**
   ```bash
   git clone https://github.com/RahulNaikMudavath/Trao-assignment.git
   cd Trao-assignment
   ```
2. **Install all dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your keys:
   - `GEMINI_API_KEY`: Obtain a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
   - If no API key is provided, the application automatically runs in deterministic `mock` mode for seamless offline testing.

### Running the Application Locally
Run both frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api`
- **Health Check:** `http://localhost:5000/api/health`

### Running Automated Tests
```bash
npm test
```
Executes the comprehensive Vitest suite covering schedule allocation, coverage check loops, Appendix A schema conformance, builder state preservation, and batch runner execution.

---

## 3. Mandatory Batch Entry Point (Section 9)

Your repository exposes the single mandatory command that reads a JSON file of cases and writes the resulting kits matching Appendix B:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Example Usage:
```bash
npm run evaluate -- --input test_cases.json --output test_output.json
```

### Batch Characteristics:
- **Clean Clone Compatible:** Runs out of the box with zero external dependencies.
- **Identical Pipeline:** Executes the exact same backend pipeline code (`runKitPipeline`) used by the web application.
- **Local Address & Relative Link Support:** Correctly handles `http://localhost:...` servers and follows relative links without assuming a public host.
- **Fault-Tolerant:** If a company URL is unreachable or 404, it records an honest kit status rather than aborting. Fatal unrecoverable cases are recorded with `status: "failed"` and `{ error: { code, message } }`.
- **Performance:** Completes 5 cases well within the 15-minute threshold with token-bucket rate limiting and retries.

---

## 4. Which LLM Provider and Model Used

- **Primary Provider:** **Google Gemini 1.5 Flash** (`gemini-1.5-flash`) via `@google/generative-ai`.
- **Alternative Provider:** **Groq** (`llama-3.3-70b-versatile`).
- **Offline Fallback:** Deterministic Mock Provider for offline testing without network or quota constraints.
- **Rate-Limiting & Backoff:**
  Free tiers limit requests and tokens per minute. Our custom `RateLimiter` (`backend/src/services/llm/rateLimiter.js`) enforces:
  - Minimum request spacing (1,200ms) to avoid burst rate-limit spikes.
  - Exponential backoff with randomized jitter (0–500ms) on HTTP 429 and transient errors.
  - Automatic retry up to 4 attempts before escalating.
  - Robust JSON sanitization that strips markdown fences and repairs trailing commas.

---

## 5. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                      │
│  - Dashboard (Single Paste / Multi-Role File Upload)        │
│  - Reshapeable Builder (Inline Edit, Reorder, Category Move)│
│  - Practice Mode (3D Flashcard Trainer & Recall Tracking)   │
│  - AI Mock Interview Simulator & Diagnostics Studio         │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / SSE
┌──────────────────────────────▼──────────────────────────────┐
│                    Express API Backend                      │
│  - Auth Middleware (JWT Sessions & User Isolation)          │
│  - Storage Engine (MongoDB Mongoose + In-Memory Fallback)   │
│  - Kit API Routes & Progress Event Streaming                │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│           7-Step Autonomous Pipeline Orchestrator           │
├─────────────────────────────────────────────────────────────┤
│ 1. Extract Requirements (must vs nice, technical/beh/domain) │
│ 2. Intelligent Crawl & Semantic Link Ranking                │
│ 3. Public Discussion & Interview Stage Retrieval            │
│ 4. Category-Specific Question Generation (Targeted Prompts) │
│ 5. Active Recall Flashcards Mapped to Requirement IDs       │
│ 6. DETERMINISTIC Coverage Check & Second Pass Gap Loop      │
│ 7. DETERMINISTIC Arithmetic Schedule Allocation             │
└──────────────────────────────┬──────────────────────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
┌─────────────────────────────┐       ┌─────────────────────────────┐
│    Crawler & Security       │       │    LLM Client & Resilience  │
│  - SSRF Private IP Guard    │       │  - Rate Limiter with Jitter │
│  - robots.txt Compliance    │       │  - JSON Schema Repair       │
│  - Semantic Link Ranker     │       │  - Gemini / Groq / Mock     │
│  - DOM Cleaner & Text Sizer │       └─────────────────────────────┘
└─────────────────────────────┘
```

---

## 6. Retrieval Approach and Sources Used

### The Link Ranking Engine
Hardcoding paths like `/careers` or `/jobs` fails because companies bury hiring information in handbooks (e.g. GitLab), engineering blogs (e.g. PostHog), or culture pages.
Our `extractAndRankLinks` algorithm (`backend/src/services/crawler/linkRanker.js`) works dynamically:
1. Fetches the homepage and converts all relative `<a href>` links to normalized absolute URLs.
2. Evaluates anchor text and URL pathnames against weighted semantic keywords:
   - High Priority (+80 to +100): `interview process`, `how we hire`, `hiring process`, `careers`, `jobs`, `work with us`, `handbook`, `engineering`.
   - Culture Priority (+40 to +45): `culture`, `values`, `team`, `mission`, `about us`.
   - Disqualifiers (-150): `login`, `signup`, `terms`, `privacy`, `cart`, `checkout`, `.pdf`, `.zip`.
3. Sorts candidate links by score and crawls the top-ranked hiring and culture pages.
4. Cleans HTML using Cheerio, stripping scripts, styles, navigations, and footers, and limits characters to prevent prompt blowups.

### Sources Consulted:
1. Target company homepage and ranked internal subpages.
2. Discovered career portals and public employee handbooks.
3. Public discussion indexes (DuckDuckGo search snippets for Glassdoor and Reddit candidate experiences).
4. Respects `robots.txt` using `robots-parser`.
5. SSRF validation blocks access to cloud metadata endpoints (`169.254.169.254`), loopback, and private IPv4 ranges in production.

---

## 7. Pipeline Step Sequencing & Responsibilities

The generation pipeline executes 7 deliberate steps in strict sequence:

1. **Step 1: Requirement Extraction (`1_extractRequirements.js`)**
   - Parses the job description into `title`, `seniority`, `responsibilities`, and stable `requirements` (`r1`, `r2`...).
   - Classifies each requirement into `technical`, `behavioural`, or `domain`.
   - Distinguishes `must` vs `nice` strictly based on wording ("required" vs "bonus points").
   - Does NOT invent missing requirements for two-line stubs.
2. **Step 2: Company Website Research (`2_researchCompany.js`)**
   - Crawls domain, ranks links, extracts what the company does, their mission, and discovered hiring practices. If unreachable or 404, produces an honest brief.
3. **Step 3: Public Interview Discussion Research (`3_searchDiscussions.js`)**
   - Gathers public interview stages and candidate experiences, or records an honest absence.
4. **Step 4: Category-Specific Question Generation (`4_generateQuestions.js`)**
   - Prompts are customized per category:
     - *Technical:* Deep dive into runtime behaviour, error boundaries, memory/CPU performance, and race conditions.
     - *Behavioural:* Focused on STAR method, conflict resolution, technical debt tradeoffs, and leadership.
     - *System Design:* Focus on scalability, data partitioning, caching tiers, and network failure modes.
     - *Company Fit:* Connecting company mission and tech stack to candidate background.
   - Every question links to one or more requirement IDs and assigns difficulty 1–3.
5. **Step 5: Flashcard Generation (`5_generateFlashcards.js`)**
   - Generates high-yield active recall cards (`f1`, `f2`...) mapped to requirements.
6. **Step 6: DETERMINISTIC Coverage Verification & Second Pass (`6_coverageCheck.js`)**
   - Pure code (not LLM). Extracts all requirement IDs covered by generated questions.
   - Detects uncovered `must` requirements.
   - Executes Second Pass loop to generate missing questions specifically targeting those gaps.
   - Records `coverage.passes` and `coverage.uncovered_requirement_ids`.
7. **Step 7: DETERMINISTIC Arithmetic Schedule Allocation (`7_allocateSchedule.js`)**
   - Pure arithmetic (not LLM). Distributes questions across exactly `days_available` days.

---

## 8. How Generated, Edited, and Pinned State is Represented

### The State Problem
In Section 6, the assessment requires that the user can reshape any part of the kit, and that regenerating a single section (e.g. a question category) **must not clobber user edits, pinned questions, or custom questions**.

### Our Solution
Every question and flashcard maintains explicit metadata:
```javascript
// Metadata tracking on each Question object
metadata: {
  origin: 'generated' | 'user_created',
  status: 'unmodified' | 'edited' | 'pinned',
  pinned: boolean
}
```

### Regeneration Algorithm (`StateManager.js`):
When the user triggers `Regenerate Category`:
1. Partition questions in that category into:
   - **Protected Items:** Any question where `origin === 'user_created'`, `status === 'edited'`, `status === 'pinned'`, or `pinned === true`.
   - **Replaceable Items:** Questions where `origin === 'generated'` AND `status === 'unmodified'` AND `pinned !== true`.
2. Generate fresh candidate questions for the category.
3. Assemble the new category by keeping **all protected items** and replacing only the unmodified generated items.
4. Questions in all other categories and user edits made elsewhere are 100% untouched.

---

## 9. How the Schedule is Allocated

The schedule allocation algorithm (`backend/src/services/pipeline/7_allocateSchedule.js`) is 100% deterministic and arithmetic:
1. **Priority & Complexity Scoring:**
   - Questions covering a `must-have` requirement receive a base score of `100`; `nice-to-have` receive `20`.
   - Difficulty adds `15 * difficulty` (up to 45 points for difficulty 3).
2. **Sorting:**
   - Questions are sorted descending by score: **Harder (difficulty 3) and must-have questions land earlier in the schedule**, never the night before.
3. **Exact Day Distribution:**
   - **1-Day Schedule:** All high-priority material is concentrated into an intensive Day 1 session.
   - **N Days (<= Question Count):** Questions are bucketed across days 1..N based on score rank.
   - **Extended Timeframes (e.g. 14, 30, 60 Days):** Material is introduced in earlier days, followed by structured active recall, mock rehearsals, and spaced-repetition revision sessions.
   - **Duration:** Calculated as integer minutes (15 min for diff 1, 25 min for diff 2, 35 min for diff 3), strictly integers.
   - **Verification:** Verifies that every must-have requirement appears in `schedule.days`.

---

## 10. Creative Feature: Interactive AI Mock Interviewer & Diagnostics Studio

### Problem Solved
Candidates frequently struggle to transition from passive reading to active interview performance under time constraints. A static document does not assess verbal structure, STAR method adherence, or technical depth.

### Implementation (`/kits/[id]/mock`)
1. **Live Question Simulation:** The user selects any question from their kit and starts a timer.
2. **Answer Submission:** The user outlines or types their spoken response.
3. **AI Rubric Diagnostic:** The backend evaluates the candidate's answer against the expected answer outline across:
   - Technical Accuracy and Depth (40%)
   - Structure & Communication (STAR method / architectural clarity) (30%)
   - Trade-offs & Failure Modes (30%)
4. **Actionable Feedback:**
   - Objective Score (0–100)
   - Specific Identified Strengths
   - Critical "Weak Spots" and omitted edge cases
   - Exemplary Model Answer demonstrating a top-percentile response
5. **One-Click Cheat Sheet Export:** Exports the entire kit into a clean, printable Markdown/PDF cheat sheet.

---

## 11. Practice Mode & Spaced-Repetition Defense

Practice Mode (`/kits/[id]/practice`) implements an active recall player:
- **3D Card Flip:** Press `Space` or click to reveal the answer outline.
- **Confidence Rating:** Rate each card: `1. Hard (Needs Work)`, `2. Medium (Good)`, `3. Easy (Mastered)`.
- **Spaced-Repetition Ordering:** When initiating a new session, cards are reordered by confidence:
  $$\text{Hard (1)} \longrightarrow \text{Unreviewed (0)} \longrightarrow \text{Medium (2)} \longrightarrow \text{Easy (3)}$$
  This ensures candidates spend the majority of their limited prep time on concepts they are least confident about.

---

## 12. Key Design Decisions, Trade-Offs & Known Limitations

1. **Pure JavaScript & Modern ES Modules:**
   - Built with standard Node.js ES Modules and React JSX for maximum simplicity, zero compilation baggage, and native compatibility.
2. **Hybrid Storage Engine:**
   - *Decision:* MongoDB with automatic in-memory fallback.
   - *Rationale:* Ensures reviewers can clone and immediately run `npm run evaluate` or `npm test` without needing to install or spin up an external MongoDB daemon.
3. **SSRF Guard with Test Server Bypass:**
   - *Decision:* Rejects private and loopback IPs by default, but allows `localhost` when `ALLOW_LOCAL_URLS=true` or in test environments.
   - *Rationale:* Section 9 states that evaluation company sites may be hosted locally (`http://localhost:8099/acme/`).
4. **Deterministic Separation:**
   - *Decision:* Never ask the LLM to allocate the schedule or check coverage.
   - *Rationale:* LLMs frequently hallucinate day counts, miscalculate integer minutes, and skip requirements. Hardcoding arithmetic in pure JavaScript guarantees 100% mathematical precision.
5. **Known Limitations:**
   - Deep JavaScript single-page application (SPA) company sites that require complex client-side rendering (e.g. heavy React rendering without SSR) may yield less text than static/SSR pages when crawled without a headless browser like Puppeteer. Cheerio was chosen for speed, zero binary overhead, and reliability across platforms.

---

## 13. Appendix Conformance Verification

- **Appendix A (Kit Structure):** Strictly conforms to schema. Validated via `AppendixAKitSchema` (Zod). All field names match, `difficulty` is 1–3, `minutes` is an integer, every `question_ids` entry exists, and all must-haves are covered.
- **Appendix B (Batch Structure):** Output strictly formatted as `{ version: "1.0", generated_at: string, kits: [...] }`. Validated via `BatchOutputSchema` (Zod).

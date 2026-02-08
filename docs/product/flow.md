# Student Flow: End-to-End (Happy Path + Edge Cases)

Created: 2026-02-07

## Happy Path (Single Class Recap)
1. Sign in with Google
2. Connect Google Classroom and Google Drive
3. Select a class
4. Choose a session or video
5. System ingests video + transcript + related materials
6. Generate Single Class Recap
7. Student reviews, saves, exports, or adds to Exam Pack

## Happy Path (Exam Preparation Pack)
1. Select a class
2. Choose exam scope (which sessions are included)
3. System gathers saved Single Class Recaps + all files
4. Compose Exam Preparation Pack
5. Student studies, exports, or asks questions

## Data Ingestion Pipeline (High Level)
- Fetch class roster and materials from Classroom
- Resolve Drive file IDs for videos and documents
- Extract transcripts from video or use provided captions
- Extract text from documents (PDF, Slides, Docs)
- Normalize and index all sources

## Edge Cases and UX Responses
- Missing transcript
  - Show: "Transcript missing" in Gaps
  - Provide: summary from materials only
- Poor transcript quality
  - Show: "Low confidence" and highlight uncertain sections
- Missing files or permissions
  - Show: file-level errors and prompt re-auth
- Large exams (many sessions)
  - Provide progress and allow partial generation
- Duplicate or revised content across sessions
  - Prefer latest session or mark as teacher revision

## Trust Signals
- Source references for every critical claim
- Confidence indicators at recap and section levels
- Gaps section always visible

## Persistence Rules
- Each Single Class Recap is saved as a canonical record
- Exam Packs must reuse saved recaps whenever possible
- If a recap is missing, the system can generate one and save it before building the Exam Pack

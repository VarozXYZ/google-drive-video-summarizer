# Product Vision: Class Replacement via Google Drive/Classroom

Created: 2026-02-07
Owner: Product
Status: Living document

## North Star Problem
Students at schools that use Google Classroom and Google Drive often miss or cannot fully absorb classes. They need a fast, trustworthy replacement that captures what the teacher actually said, what was emphasized for exams, and the specific exercises and examples covered.

## Product Promise
Give students a full replacement for class attendance in minutes by:
- Connecting Google Classroom and Google Drive
- Ingesting class videos and materials
- Generating detailed, source-backed recaps for each class session
- Composing exam-ready synthesis across multiple sessions

## Primary User
- Student at a school that uses Google Classroom and Google Drive
- Goal: Understand and prepare for exams without attending every class

## Core Artifacts (Differentiation)
1. Single Class Recap (atomic)
- Scope: One class session, one video
- Output: Detailed session recap with timeline references, exam focus, exercises solved, vocabulary/definitions/functions, and teacher emphasis
- Persistence: Saved and reusable in other features, especially Exam Preparation

2. Exam Preparation Pack (composed)
- Scope: Multiple sessions selected by the student
- Input: All Single Class Recaps plus all related files from Drive/Classroom
- Output: Complete revamp of everything taught with improvements, tips, and exam-focused guidance

## Success Metrics (Initial)
- Time-to-value: First usable recap in under 5 minutes from selection
- Coverage: Recap references at least 80 percent of key topics in the session
- Trust: Each critical claim has a source reference (timestamp or file excerpt)
- Exam readiness: Student self-assessed confidence improves by 2 levels (e.g., 2/5 to 4/5)

## UX Principles
- Trust through traceability: Always show where information came from
- Completeness over brevity: Provide full replacement, not just a teaser
- Exam-first framing: Highlight what the teacher emphasized and what is likely tested
- Persistence: Every recap becomes a reusable building block

## Constraints and Risks
- Transcript quality varies across recordings
- Missing files or inaccessible Drive permissions
- Classroom and Drive API rate limits
- Student trust: Must avoid hallucinated content

## Non-Negotiables
- Every recap must show citations with timestamps or file excerpts
- Missing data must be surfaced explicitly in a Gaps section
- The Exam Pack must be built from saved Single Class Recaps whenever possible

## Open Questions (to keep updated)
- How to handle multi-language classes and code-switching
- How to evaluate summary completeness without teacher grading
- Best UI for comparing multiple sessions in one exam pack

# Single Class Recap UI Spec

Created: 2026-02-07

## Purpose
Provide a full replacement for a single class session with explicit source references. This is the atomic artifact for all downstream features.

## Page Title
"Class Recap: [Session Title]"

## Header Block
- Course name
- Date and time
- Teacher name
- Duration
- Sources used: X video, Y files
- Confidence: High | Medium | Low
- Gaps summary: missing files or transcript issues

## Section 1: Executive Summary (2 to 5 minutes)
- A concise paragraph that captures the core of what the class taught
- Must be understandable without scrolling

## Section 2: What Was Taught (Timeline)
- Each item includes a timestamp and a short summary
- Provide a "Jump to moment" action for each item
- Example format: 00:19:30 Arrays and Big-O tradeoffs

## Section 3: Exam Focus
- A prioritized list (High, Medium, Low) of teacher-emphasized items
- Each item must cite its source reference

## Section 4: Exercises Solved
- Each exercise includes prompt, brief solution outline, and sources

## Section 5: Vocabulary / Functions / Definitions
- Structured list of key terms introduced in the session
- Each term includes a short definition and sources

## Section 6: Teacher Signals
- Explicit teacher statements that imply exam relevance
- Example: "This will be on the exam" or "Remember to explain"

## Section 7: Files Used
- List of files used in the recap
- Each file shows type, title, and a short snippet preview

## Section 8: Gaps and Uncertainties
- Always visible
- Includes missing files, weak transcript areas, or unclear segments

## Actions
- Save to Exam Pack
- Export as PDF
- Ask a question

## Persistence Requirements
- Recap is saved as a canonical record
- All sections are addressable by IDs for reuse in Exam Pack
- All claims must have SourceRefs for traceability

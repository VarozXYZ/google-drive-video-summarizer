# Exam Preparation Pack Spec

Created: 2026-02-07

## Purpose
Provide a complete, exam-ready synthesis across multiple class sessions and materials. This is the composed, high-level artifact.

## Inputs
- Selected session IDs
- All Single Class Recaps for those sessions
- All related Drive/Classroom materials
- Optional: teacher study guides or announcements

## Composition Logic (Deterministic)
1. Validate completeness
- List sessions with missing recaps or materials
- Offer to generate missing recaps before composing

2. Aggregate knowledge units
- Collect RecapSections, GlossaryItems, Exercises, ExamFocusItems

3. Cluster by topic
- Group overlapping concepts across sessions
- Preserve source references

4. Resolve conflicts
- Prefer latest session if teacher revises a concept
- Otherwise highlight conflicting explanations explicitly

5. Build the Exam Pack
- Compose sections in a consistent order

6. Quality checks
- Coverage score
- Gaps summary
- Confidence summary

## Output Sections
- Executive Summary
- Syllabus Revamp (topic ordered, not date ordered)
- Exam Focus Map (High, Medium, Low)
- Concept Deep Dives
- Consolidated Exercises and Solutions
- Glossary
- Common Mistakes and Fixes
- Study Plan and Tips
- Sources and Traceability

## UI Elements
- Exam scope selector
- Coverage and confidence indicators
- Gaps banner (always visible)

## Trust Requirements
- Every key point includes a source reference
- If a point is inferred, it must be labeled as inference
- Missing sources are highlighted in the Gaps section

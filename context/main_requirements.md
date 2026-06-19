# Study Material & Quiz Requirements

## Overview

The application combines Pomodoro focus sessions, study materials, and AI-generated quizzes into a single study platform.

## Study Materials

Users can:

* Upload study materials
* View materials inside the application
* Organize materials for future study sessions

### Supported File Types

Initial Version:

* PDF
* TXT
* DOCX

Future Versions:

* PPTX
* PNG
* JPG
* EPUB

---

## Study Mode

Study Mode provides a dedicated workspace for reading and studying uploaded materials.

When enabled:

* The selected document becomes the primary content on screen
* The timer is minimized but remains visible
* Focus sessions continue running in the background
* Users can study without leaving the application

### Minimized Timer

The timer should:

* Display remaining time
* Show current session state (Work or Break)
* Allow pause, resume, skip, and reset actions
* Remain accessible at all times

---

## Pomodoro Sessions

Each timer mode contains:

* Work Duration
* Break Duration

Behavior:

* Break sessions start automatically after a work session ends
* The interface should clearly indicate whether the current session is Work or Break
* The next session and duration should always be visible
* By default, the timer stops after a break and waits for user action

Track:

* Total study time
* Completed focus sessions
* Daily statistics
* Weekly statistics

---

## AI Quiz Generator

Users can generate quizzes from uploaded study materials.

### Quiz Configuration

Before generating a quiz, users select:

* Difficulty

  * Easy
  * Medium
  * Hard

* Question Type

  * Multiple Choice
  * Identification

* Number of Questions

* Quiz Label

Examples:

* Biology
* Programming
* Midterm Review
* Final Exam

---

## Quiz Structure

Each generated quiz contains:

* Title
* Label
* Difficulty
* Question Type
* Questions
* Answers
* Explanations

### Question Feedback

When a user answers incorrectly:

* The correct answer should be shown
* An explanation should be displayed
* Feedback should be immediate

---

## Quiz Attempts

Users can retake quizzes unlimited times.

Track:

* Number of attempts
* Attempt history
* Score per attempt
* Completion date

Example:

* Attempt 1 → 6/10
* Attempt 2 → 8/10
* Attempt 3 → 10/10

---

## Analytics

Track:

* Quiz scores
* Accuracy percentage
* Total quizzes completed
* Total study time
* Focus sessions completed

Future analytics:

* Frequently missed topics
* Progress trends
* Weak subject areas

---

## Future Features

* AI Flashcards
* AI Summaries
* AI Study Assistant
* Multi-device Sync
* Study Groups

## Goal

Create a study platform where users can:

* Focus using Pomodoro sessions
* Manage study materials
* Generate AI-powered quizzes
* Track learning progress

without needing multiple applications.

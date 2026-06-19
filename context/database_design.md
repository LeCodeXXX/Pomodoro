# Database Design (Updated MVP)

## Overview

```text
User
├── Documents
├── Quizzes
│   ├── Questions
│   └── Quiz Attempts
│       └── User Answers
└── Pomodoro Sessions
```

---

# User

Stores account information.

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| email         | String    |
| password_hash | String    |
| name          | String    |
| created_at    | Timestamp |

---

# Document

Stores uploaded PDFs or study materials.

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| title      | String    |
| file_url   | String    |
| created_at | Timestamp |

---

# Quiz

Represents an AI-generated quiz.

| Field           | Type      |
| --------------- | --------- |
| id              | UUID      |
| user_id         | UUID      |
| document_id     | UUID      |
| title           | String    |
| label           | String    |
| difficulty      | Enum      |
| question_type   | Enum      |
| total_questions | Integer   |
| created_at      | Timestamp |

### Difficulty

```text
EASY
MEDIUM
HARD
```

### Question Type

```text
MULTIPLE_CHOICE
IDENTIFICATION
```

### Label Examples

```text
Biology
Programming
Math
History
Midterm Review
Final Exam Review
```

---

# Question

Stores generated questions.

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| quiz_id     | UUID      |
| question    | Text      |
| answer      | Text      |
| explanation | Text      |
| created_at  | Timestamp |

### Example

```text
Question:
What is the powerhouse of the cell?

Answer:
Mitochondria

Explanation:
Mitochondria produce ATP, which supplies energy to the cell.
```

The explanation is shown whenever the user answers incorrectly.

---

# Question Option

Only used for Multiple Choice quizzes.

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| question_id | UUID    |
| option_text | Text    |
| is_correct  | Boolean |

---

# Quiz Attempt

Stores every quiz retake.

| Field           | Type      |
| --------------- | --------- |
| id              | UUID      |
| user_id         | UUID      |
| quiz_id         | UUID      |
| score           | Integer   |
| total_questions | Integer   |
| completed_at    | Timestamp |

### Example

```text
Attempt 1 → 7/10
Attempt 2 → 9/10
Attempt 3 → 10/10
```

This allows unlimited retakes while preserving history.

---

# User Answer

Stores answers for each attempt.

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| attempt_id  | UUID    |
| question_id | UUID    |
| user_answer | Text    |
| is_correct  | Boolean |

This allows:

* Review incorrect answers
* Show explanations
* Track weak areas
* Analyze improvement over time

---

# Pomodoro Session

Stores completed study sessions.

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| duration   | Integer   |
| completed  | Boolean   |
| created_at | Timestamp |

---

# Supported Features

✅ Upload PDF

✅ Generate Quiz

✅ Choose Difficulty (Easy / Medium / Hard)

✅ Choose Question Type (Multiple Choice / Identification)

✅ Add Custom Quiz Label

✅ Show Explanation on Wrong Answers

✅ Retake Quiz Unlimited Times

✅ Save Attempt History

✅ Track Scores Across Attempts

✅ Pomodoro Tracking

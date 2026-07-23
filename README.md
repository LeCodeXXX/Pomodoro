# Pomodoro Study App

 A full-stack study application that combines a Pomodoro timer with study-material management, AI-generated quizzes, and learning statistics.

 ## What the app does

 - Run focus and break sessions with three timer modes:
	 - Relaxed: 45 minutes work, 15 minutes break
	 - Standard: 25 minutes work, 5 minutes break
	 - Locked In: 50 minutes work, 10 minutes break
 - Customize the work and break times for each mode.
 - Create an account with email and password, or sign in with Google OAuth.
 - Upload PDF, DOCX, or TXT study materials.
 - Read uploaded materials in the browser.
 - Generate quizzes from study materials using Google Gemini.
 - Choose quiz difficulty, question type, number of questions, label, and optional focus topics.
 - Take quizzes and review explanations and previous attempts.
 - Track focus time, break time, completed sessions, study streaks, uploaded materials, and average quiz score.

 ## How it works

 The project has three services:

 ```text
 React/Vite frontend 
			|
			v
 Express/Prisma backend  ---- PostgreSQL database
			|
			v
 FastAPI AI service ---- Google Gemini API
 ```

 The frontend communicates with the backend. The backend handles authentication, user data, uploaded documents, quiz records, and statistics. When a quiz is requested, the backend sends document content to the AI service, which extracts text and generates quiz questions with Gemini.

 ## Project structure

 ```text
 pomodoro/
 ├── frontend/       React + TypeScript + Vite user interface
 ├── backend/        Express + TypeScript + Prisma API
 ├── ai-service/     FastAPI document processor and quiz generator
 ├── context/        Project requirements and development context
 └── docs/           Project documentation
 ```

 ## Requirements

 Install these tools before starting:

 - Node.js and npm
 - Python 3.10 or newer
 - PostgreSQL
 - A Google Gemini API key
 - A Supabase project for file storage

 Google OAuth is optional. It is only needed if users should be able to sign in with Google.

 ## Local setup

 ### 1. Configure the AI service

 Open a terminal in `ai-service` and create a `.env` file from `.env.example`:

 ```powershell
 cd ai-service
 Copy-Item .env.example .env
 ```

 Set at least these values in `ai-service/.env`:

 ```env
 ENVIRONMENT=development
 FASTAPI_PORT=8000
 LOG_LEVEL=info
 GEMINI_API_KEY=your_gemini_api_key
 GEMINI_MODEL=gemini-2.5-flash
 AI_SERVICE_API_KEY=dev_shared_api_key_pomodoro_2026
 MAX_FILE_SIZE_MB=50
 CHUNK_SIZE=1000
 CHUNK_OVERLAP=200
 ```

 Create a virtual environment and install the Python dependencies:

 ```powershell
 python -m venv venv
 .\venv\Scripts\activate
 pip install -r requirements.txt
 ```

 If PowerShell blocks activation, run the commands from Command Prompt instead:

 ```cmd
 venv\Scripts\activate
 ```

 ### 2. Configure the backend

 Open a second terminal in `backend` and create the environment file:

 ```powershell
 cd backend
 Copy-Item .env.example .env
 ```

 Set the values required for a local setup:

 ```env
 PORT=3000
 DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/pomodoro
 JWT_SECRET=replace_with_a_long_random_secret
 JWT_EXPIRES_IN=7d
 FRONTEND_URL=http://localhost:5173
 AI_SERVICE_URL=http://localhost:8000
 AI_SERVICE_API_KEY=dev_shared_api_key_pomodoro_2026
 SUPABASE_URL=https://your-project.supabase.co
 SUPABASE_KEY=your_supabase_key
 SUPABASE_BUCKET=documents
 ```

 `AI_SERVICE_API_KEY` must have the same value in both the backend and AI-service `.env` files.

 Install the backend packages, generate the Prisma client, and apply the database migrations:

 ```powershell
 npm install
 npx prisma generate
 npx prisma migrate deploy
 ```

 The database must exist before running the migrations. To inspect the database during development, use:

 ```powershell
 npx prisma studio
 ```

 ### 3. Configure the frontend

 Open a third terminal in `frontend`:

 ```powershell
 cd frontend
 Copy-Item .env.example .env
 ```

 Set the backend URL in `frontend/.env`:

 ```env
 BACKEND_URL=http://localhost:3000
 ```

 Install the frontend packages:

 ```powershell
 npm install
 ```

 ### 4. Start all services

 Run each service in its own terminal.

 **AI service**

 ```powershell
 cd ai-service
 .\venv\Scripts\Activate.ps1
 uvicorn app.main:app --reload --port 8000
 ```

 **Backend**

 ```powershell
 cd backend
 npm run dev
 ```

 **Frontend**

 ```powershell
 cd frontend
 npm run dev
 ```

 Open the URL printed by Vite, normally [http://localhost:5173](http://localhost:5173).

 ## Typical user flow

 1. Register or sign in.
 2. Start a Pomodoro session from the timer page.
 3. Open **Study Materials** and upload a PDF, DOCX, or TXT file.
 4. Select the uploaded material and choose **Generate Quiz**.
 5. Select the difficulty, question type, question count, and optional focus topics.
 6. Complete the quiz and check the answers.
 7. Open quiz history to review previous attempts.
 8. Open **Stats** to view focus activity, study streaks, charts, and quiz performance.

 Completed focus sessions and quiz attempts are saved to the backend only when the user is signed in.

 ## Supported quiz options

 - Difficulty: `EASY`, `MEDIUM`, or `HARD`
 - Question types: multiple choice, identification, and true/false
 - Number of questions: 1 to 50

 ## Main API routes

 All backend routes use the `/api` prefix.

 | Area | Routes | Purpose |
 | --- | --- | --- |
 | Authentication | `POST /auth/register`, `POST /auth/login` | Create an account or sign in |
 | Google OAuth | `GET /auth/google`, `GET /auth/google/callback` | Google sign-in flow |
 | Documents | `POST /documents/upload`, `GET /documents`, `GET /documents/:id`, `DELETE /documents/:id` | Manage study materials |
 | Quizzes | `GET /quiz/health`, `POST /quiz/generate` | Check AI availability and generate quizzes |
 | Quiz history | `GET /quiz/document/:documentId`, `POST /quiz/:quizId/attempts`, `GET /quiz/:quizId/attempts` | Load saved quizzes and attempts |
 | Timer and statistics | `GET /users/stats`, `GET /users/chart-data`, `POST /users/pomodoro-session` | Save sessions and load progress |
 | Timer settings | `GET /users/timer-settings`, `PUT /users/timer-settings` | Read and update timer durations |

 The AI service exposes its own protected endpoints under `/api`:

 - `GET /api/health`
 - `POST /api/documents/process`
 - `POST /api/quiz/generate`

 These endpoints require the `X-API-Key` header and are normally called by the backend, not directly by the frontend.

 ## Useful commands

 ### Frontend

 ```powershell
 npm run dev       # Start the Vite development server
 npm run build     # Type-check and create a production build
 npm run lint      # Run ESLint
 npm run preview   # Preview the production build
 ```

 ### Backend

 ```powershell
 npm run dev       # Start the development API with reload
 npm run build     # Compile TypeScript
 npm start         # Start the compiled API
 ```

 ### AI service

 ```powershell
 uvicorn app.main:app --reload --port 8000
 python run_tests.py
 ```

 `run_tests.py` starts the AI service and checks health, document processing, and quiz generation. It requires a working AI-service `.env` and Gemini API key.

 ## Future Features

 The following features are planned for future versions. They are ideas for the product roadmap and are not all implemented yet.

 ### More quiz question types

 The quiz generator will support more ways to test understanding, especially for technical, engineering, and formula-heavy subjects:

 - Modified true or false questions, where the learner corrects a false statement.
 - Formula-based questions for engineering, mathematics, science, and other subjects that use calculations.
 - Matching questions for connecting terms, definitions, steps, symbols, or concepts.
 - Image-recognition questions that extract relevant images from study materials and ask the learner to identify or interpret them.
 - Better subject-aware generation so the question format matches the uploaded material.

 ### Quiz hints and learning support

 Quizzes will include an optional hint feature. Hints should help the learner think through a question without immediately revealing the answer. Planned hint behavior includes:

 - A hint button for supported questions.
 - Progressive hints, from a small clue to a more detailed explanation.
 - Hint usage tracking so learners can see which topics require the most support.
 - Explanations after submission that connect the answer to the source material.

 ### Ultra Focus mode

 An optional **Ultra Focus** timer mode will support longer, uninterrupted study blocks:

 - The learner sets a required study duration in hours.
 - The session has no restart or redo option once it begins.
 - The learner cannot finish the session early through the normal timer controls.
 - Progress and completion are recorded as a dedicated Ultra Focus session.
 - The user receives a clear warning and confirmation before starting because the mode is intentionally strict.

 A website cannot completely prevent a user from closing a browser, switching applications, losing power, or ending a process. The app can discourage accidental exits with a confirmation prompt, visibility-change detection, and a clear warning, but it cannot guarantee that the user remains on the site. Ultra Focus should therefore be designed to encourage commitment without pretending to enforce something the browser cannot enforce.

 ### Personalized analytics and recommendations

 Analytics will become more detailed and personalized over time:

 - Track performance for every quiz, question type, subject, difficulty, and topic.
 - Show the quizzes and subjects where the learner performs best.
 - Identify repeated mistakes, weak topics, slow responses, and improvement trends.
 - Compare performance over time instead of showing only a single average score.
 - Recommend what to study next based on quiz results, hints used, missed questions, and time spent.
 - Suggest study schedules and focus-session lengths that match the learner's behavior.
 - Provide AI-generated feedback on study habits and practical ways to improve.
 - Project possible areas of academic or career strength from quiz performance and subject interests.

 Career projections will be presented as guidance rather than guaranteed predictions. They should explain which quiz results support a recommendation, show confidence and uncertainty, and remind learners that interests, experience, projects, and human career guidance also matter.
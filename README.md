# Interview Master - AI-Powered Interview Preparation Platform

An end-to-end full-stack web application that generates personalized interview preparation strategies, tailored technical and behavioral questions with model answers, gap analysis, preparation roadmaps, and ATS-friendly resume PDFs using Gemini AI.

## Features

- **Personalized Interview Strategy**: Analyzes job descriptions alongside resumes or candidate profiles.
- **Tailored Question Bank**:
  - Technical questions with interviewers' intentions and model answers
  - Behavioral questions with STAR method guidance
- **Preparation Road Map**: Structured multi-day study schedule.
- **Skill Gap Analysis**: Highlights missing or weak skills with severity tags (High, Medium, Low).
- **ATS Resume Generation**: Generates customized resume PDFs tailored specifically to the target role.
- **Secure Authentication**: JWT-based session authentication with cookie handling.

## Tech Stack

### Frontend
- React 19
- React Router v7
- Sass / SCSS
- Axios
- Vite

### Backend
- Node.js & Express 5
- MongoDB & Mongoose
- Google GenAI SDK (Gemini AI Models)
- Puppeteer (PDF generation)
- pdf-parse (Resume text extraction)
- JWT & bcryptjs

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd fullStackProject1
```

### 2. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in `Backend/` based on `.env.example`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```
Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
npm run dev
```
Open `http://localhost:5173` or `http://localhost:5174` in your browser.

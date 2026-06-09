# WeBAR Backend

Scalable, intelligent backend service for university admissions.

## Tech Stack
- **Node.js** & **Express.js**
- **MongoDB Atlas** (Mongoose)
- **Groq AI** (Llama 3)
- **JWT** Authentication
- **Multer** & **Sharp** for file processing

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Groq API Key

### Installation
1. `cd server`
2. `npm install`
3. Create a `.env` file based on `.env.example`
4. `npm run dev` (uses nodemon)

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/profile`
- `PUT /api/users/update-profile`

### Educational Data
- `GET /api/universities`
- `GET /api/courses`

### AI & Recommendations
- `GET /api/recommendations`
- `POST /api/ai/chat`
- `POST /api/ai/career-guidance`

### Applications
- `GET /api/applications`
- `POST /api/applications/apply`

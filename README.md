# Hackathon
Skill Swap Platform
🤝 Overview
Skill Swap is a community-driven platform designed to connect individuals who want to exchange knowledge and skills. Whether you're looking to learn a new skill or share your expertise, Skill Swap provides an intuitive interface to find your perfect learning/teaching partner.

A core feature of this platform is its AI-Powered Skill Matchmaking, which intelligently suggests compatible users for skill exchange.

✨ Features
User Authentication: Secure registration and login system.

User Profiles: Create and manage personal profiles including name, location, availability, and profile visibility.

Skill Management: List skills you offer and skills you want to learn.

Browse Users: Explore profiles of other public users and their listed skills.

AI-Powered Skill Matchmaking: Our intelligent backend, powered by a local Large Language Model (LLM) via Ollama, analyzes user skill sets to suggest the best potential skill swap partners. It even provides a concise reasoning for each match!

🚀 Technologies Used
Frontend:

HTML5

CSS3 (Custom styling)

JavaScript (Vanilla JS for dynamic content and API interactions)

Backend:

Node.js

Express.js (Web framework)

SQLite3 (Database for user data)

bcryptjs (Password hashing)

jsonwebtoken (JWT for authentication)

AI Integration:

Ollama: A powerful tool for running large language models locally.

gemma3:1b model: A lightweight and efficient LLM from Google, suitable for local inference on systems with limited memory.

⚙️ Setup and Local Development
Follow these steps to get the Skill Swap application running on your local machine.

Prerequisites
Before you begin, ensure you have the following installed:

Git: For cloning the repository.

Download Git

Node.js & npm: For running the backend server and managing dependencies.

Download Node.js (npm is included)

Ollama: For running the local AI model used in matchmaking.

Download Ollama

Installation Steps
Clone the Repository:
Open your terminal or command prompt and clone the project:

git clone https://github.com/Shub-2006/Hackathon.git
cd Hackathon

(Replace https://github.com/Shub-2006/Hackathon.git with your actual repository URL if different.)

Backend Setup:
Navigate into the backend directory and install the necessary Node.js packages:

cd backend
npm install

This will set up your Express server dependencies and create the skillswap.db SQLite database if it doesn't already exist.

Ollama Model Setup:
This is crucial for the AI matchmaking feature.

Start Ollama Server: Open a new, separate terminal window (do not use the one for your backend) and run:

ollama serve

Keep this window open as long as you want the AI feature to work.

Pull the Model: In another new terminal window, download the gemma3:1b model:

ollama pull gemma3:1b

Wait for the download to complete. This model is chosen for its small size (~815 MB) to accommodate systems with limited memory.

Frontend Setup:
While the frontend is mostly static HTML/CSS/JS, ensure you are in the correct directory:

cd ../frontend
# If you have a package.json for frontend dependencies (e.g., for a build step), run:
# npm install

Configure Frontend API URL:
Open frontend/script.js in your code editor. Ensure the API_BASE_URL is set to http://localhost:3000/api for local development:

const API_BASE_URL = 'http://localhost:3000/api';

Save the file.

Running the Application
Start the Backend Server:
Open a new, separate terminal window (different from the Ollama server window).
Navigate to your backend directory:

cd Hackathon/backend
node server.js

You should see Backend server running on http://localhost:3000. Keep this window open.

Access the Frontend:
Open your web browser and navigate directly to your frontend/index.html file.
You can usually do this by going to your file explorer, finding Hackathon/frontend/index.html, and double-clicking it.

🧠 How the AI Matchmaking Works
The AI matchmaking is implemented in the backend (backend/server.js) and utilizes Ollama to perform local inference:

When a logged-in user clicks "Find New Matches" on the frontend, a request is sent to the backend's /api/matchmaking/:userId endpoint.

The backend retrieves the current user's skills (offered and wanted) and the skills of all other public users from the SQLite database.

It then dynamically constructs a detailed prompt that includes all this user data. This prompt instructs the LLM (Large Language Model) to act as a matchmaking agent, prioritizing mutual skill exchanges.

The backend sends this prompt to the locally running Ollama server (http://localhost:11434/api/generate) using the gemma3:1b model.

Ollama processes the prompt using the gemma3:1b model and returns a response, which includes a JSON array of suggested matches with a user_id, user_name, and a reasoning explaining the match.

The backend parses this JSON response and sends it back to the frontend.

The frontend then displays these AI-generated matches to the user.

This approach ensures that the AI processing happens locally on your machine, providing privacy and avoiding external API costs, while still delivering intelligent matchmaking capabilities.

# Hackathon
Skill Swap Platform
-> Overview
Skill Swap is a community-driven platform designed to connect individuals who want to exchange knowledge and skills. Whether you're looking to learn a new skill or share your expertise, Skill Swap provides an intuitive interface to find your perfect learning/teaching partner.

A core feature of this platform is its AI-Powered Skill Matchmaking, which intelligently suggests compatible users for skill exchange based on their actual profiles.

-> Features
User Authentication: Secure registration and login system.

Comprehensive User Profiles: Create and manage detailed personal profiles, including your name, email, location, availability, and profile photo. Your skills (both offered and wanted) are now managed directly within your dedicated Profile page, accessible from the top navigation.

Browse Users: Explore profiles of other public users and their listed skills to find potential connections.

AI-Powered Skill Matchmaking: Our intelligent backend, powered by a local Large Language Model (LLM) via Ollama, analyzes your skills and those of other real, available users in the database to suggest the best potential skill swap partners. It provides a concise reasoning for each match, ensuring relevant connections.

Connection Requests & Notifications:

Send connection requests to suggested matches.

Receive real-time notifications for incoming connection requests via a bell icon in the top navigation bar.

Accept or decline connection requests directly from your notifications.

Integrated Chat System: Once a connection request is accepted, a chat conversation is automatically enabled, allowing connected users to communicate directly within the platform.

-> Technologies Used
Frontend:

HTML5

CSS3 (Custom styling)

JavaScript (Vanilla JS for dynamic content and API interactions)

Font Awesome (for icons)

Backend:

Node.js

Express.js (Web framework)

SQLite3 (Database for user data, connections, and messages)

bcryptjs (Password hashing)

jsonwebtoken (JWT for authentication)

AI Integration:

Ollama: A powerful tool for running large language models locally.

gemma3:1b model: A lightweight and efficient LLM from Google, suitable for local inference on systems with limited memory, used for intelligent matchmaking.

-> Setup and Local Development
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

This will set up your Express server dependencies and create the skillswap.db SQLite database (with users, connections, and messages tables) if it doesn't already exist.

Ollama Model Setup:
This is crucial for the AI matchmaking feature.

Start Ollama Server: Open a new, separate terminal window (do not use the one for your backend) and run:

ollama serve

Keep this window open as long as you want the AI feature to work.

Pull the Model: In another new terminal window, download the gemma3:1b model:

ollama pull gemma3:1b

Wait for the download to complete. This model is chosen for its small size (~815 MB) to accommodate systems with limited memory.

Configure Frontend API URL (if accessing from another device):

If you are running the backend on one machine (e.g., your laptop) and accessing the frontend from another (e.g., your friend's laptop), you need to update the API_BASE_URL in the frontend.

On the machine running the backend: Find your local IP address (e.g., using ipconfig on Windows or ifconfig on macOS/Linux).

On the machine running the frontend: Open frontend/script.js in your code editor. Change the API_BASE_URL to your backend machine's IP address:

const API_BASE_URL = 'http://YOUR_BACKEND_IP_ADDRESS:3000/api';

Replace YOUR_BACKEND_IP_ADDRESS with the actual IP address you found.

If running frontend and backend on the same machine, keep it as:

const API_BASE_URL = 'http://localhost:3000/api';

Save the frontend/script.js file.

Running the Application
Start the Backend Server:
Open a new, separate terminal window (different from the Ollama server window).
Navigate to your backend directory:

cd Hackathon/backend
node server.js

You should see Backend server running on http://localhost:3000. Keep this window open.

Access the Frontend:
Open your web browser and navigate to the backend server's address. The backend is now configured to serve the frontend files directly.

If running on the same machine:
http://localhost:3000/

If accessing from another machine (e.g., friend's laptop):
http://YOUR_BACKEND_IP_ADDRESS:3000/
(Replace YOUR_BACKEND_IP_ADDRESS with the actual IP address of the machine running the backend).

-> How the AI Matchmaking Works
The AI matchmaking is implemented in the backend (backend/server.js) and utilizes Ollama to perform local inference:

When a logged-in user clicks "Find New Matches" on the frontend, a request is sent to the backend's /api/matchmaking/:userId endpoint.

The backend retrieves the current user's skills (offered and wanted) and the skills of all other eligible public users from the SQLite database. It also filters out users with whom a connection is already pending or accepted.

It then dynamically constructs a detailed prompt that includes all this real user data (including their actual IDs and usernames). This prompt instructs the LLM (gemma3:1b) to act as a matchmaking agent, prioritizing mutual skill exchanges.

The backend sends this prompt to the locally running Ollama server (http://localhost:11434/api/generate).

Ollama processes the prompt and returns a response, which is expected to be a JSON array of suggested matches with user_id, user_name, and reasoning.

Crucially, the backend then filters and validates these AI-suggested matches:

It checks if the user_id returned by the AI corresponds to an actual user ID that was sent in the original prompt from the database.

It replaces any AI-generated user_name with the actual username from the database, ensuring that only real users are displayed.

The filtered and validated matches are then sent back to the frontend for display.

This approach ensures that the AI processing happens locally on your machine, providing privacy and avoiding external API costs, while still delivering intelligent and accurate matchmaking capabilities based on your actual user data.

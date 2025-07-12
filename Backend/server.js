const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000; // Our backend will run on port 3000
const SECRET_KEY = 'your_secret_key_for_jwt'; // **CHANGE THIS TO A STRONG, UNIQUE KEY IN PRODUCTION!**

// Middleware
app.use(cors()); // Allow cross-origin requests from frontend

// Increase the body parser limit for JSON and URL-encoded bodies
// This is crucial for handling potentially large profile data, especially base64 image strings
app.use(express.json({ limit: '50mb' })); // Allows JSON bodies up to 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Allows URL-encoded bodies up to 50MB

// Initialize SQLite database
const db = new sqlite3.Database('./skillswap.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the skillswap database.');
        console.log('Attempting to create/check users table...'); // Added log
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                skills_offer TEXT, -- Store as JSON string or comma-separated
                skills_want TEXT,    -- Store as JSON string or comma-separated
                profile_json TEXT    -- New column for name, email, location, availability, visibility, photo_url
            )
        `, (createErr) => {
            if (createErr) {
                console.error('Error creating users table:', createErr.message);
            } else {
                console.log('Users table checked/created successfully.'); // Updated log
            }
        });
    }
});

// Helper function to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // No token provided

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Token not valid
        req.user = user; // Attach user info from token to request
        next();
    });
};

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Skill Swap Backend API is running!');
});

// User Registration (UPDATED to include profile data)
app.post('/api/register', async (req, res) => {
    const { username, password, name, email, location, skills, availability, profileVisibility } = req.body;

    if (!username || !password || !skills) { // Skills is now required for registration
        return res.status(400).json({ message: 'Username, password, and skills are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password

        // Convert skills textarea to array for skills_offer
        const skillsOfferArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const skillsOfferJson = JSON.stringify(skillsOfferArray);

        // Store other profile data as JSON string
        const profileData = {
            name: name || '',
            email: email || '',
            location: location || '',
            availability: availability || '',
            profileVisibility: profileVisibility || 'public',
            profilePhotoUrl: 'placeholder.jpg' // Placeholder, actual photo not uploaded to server
        };
        const profileJson = JSON.stringify(profileData);

        db.run(
            'INSERT INTO users (username, password, skills_offer, profile_json) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, skillsOfferJson, profileJson],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ message: 'Username already exists' });
                    }
                    console.error('Error during registration:', err.message);
                    return res.status(500).json({ message: 'Server error during registration' });
                }
                res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
            }
        );
    } catch (error) {
        console.error('Error hashing password or processing data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Error during login query:', err.message);
            return res.status(500).json({ message: 'Server error during login' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully', token, user: { id: user.id, username: user.username } });
    });
});

// Get User Profile (protected) - UPDATED to include profile_json
app.get('/api/users/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;

    // Ensure the logged-in user can only access their own profile
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: 'Unauthorized access to user profile' });
    }

    db.get('SELECT id, username, skills_offer, skills_want, profile_json FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user profile:', err.message);
            return res.status(500).json({ message: 'Server error fetching profile' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Parse skills from string to array (if stored as JSON string)
        user.skills_offer = user.skills_offer ? JSON.parse(user.skills_offer) : [];
        user.skills_want = user.skills_want ? JSON.parse(user.skills_want) : [];
        user.profile_data = user.profile_json ? JSON.parse(user.profile_json) : {}; // Parse profile_json
        delete user.profile_json; // Remove raw json string from response
        res.json(user);
    });
});

// Update User Skills (protected)
app.put('/api/users/:id/skills', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const { skills_offer, skills_want } = req.body; // Expect arrays

    // Ensure the logged-in user can only update their own profile
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: 'Unauthorized to update user skills' });
    }

    // Convert arrays to JSON strings for SQLite storage
    const skillsOfferJson = JSON.stringify(skills_offer || []);
    const skillsWantJson = JSON.stringify(skills_want || []);

    db.run(
        'UPDATE users SET skills_offer = ?, skills_want = ? WHERE id = ?',
        [skillsOfferJson, skillsWantJson, userId],
        function(err) {
            if (err) {
                console.error('Error updating user skills:', err.message);
                return res.status(500).json({ message: 'Server error updating skills' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'Skills updated successfully' });
            }
    );
});

// NEW: Update User Profile Data (protected)
app.put('/api/users/:id/profile', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const { name, email, location, availability, profileVisibility, profilePhotoUrl } = req.body;

    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: 'Unauthorized to update user profile data' });
    }

    // Fetch existing profile_json to merge updates
    db.get('SELECT profile_json FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error('Error fetching existing profile_json:', err.message);
            return res.status(500).json({ message: 'Server error updating profile data' });
        }
        
        let existingProfileData = row && row.profile_json ? JSON.parse(row.profile_json) : {};

        // Merge new data with existing
        const updatedProfileData = {
            ...existingProfileData,
            name: name !== undefined ? name : existingProfileData.name,
            email: email !== undefined ? email : existingProfileData.email,
            location: location !== undefined ? location : existingProfileData.location,
            availability: availability !== undefined ? availability : existingProfileData.availability,
            profileVisibility: profileVisibility !== undefined ? profileVisibility : existingProfileData.profileVisibility,
            profilePhotoUrl: profilePhotoUrl !== undefined ? profilePhotoUrl : existingProfileData.profilePhotoUrl
        };

        const updatedProfileJson = JSON.stringify(updatedProfileData);

        db.run(
            'UPDATE users SET profile_json = ? WHERE id = ?',
            [updatedProfileJson, userId],
            function(updateErr) {
                if (updateErr) {
                    console.error('Error updating profile_json:', updateErr.message);
                    return res.status(500).json({ message: 'Server error updating profile data' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json({ message: 'Profile data updated successfully' });
            }
        );
    });
});


// Get all users (for browsing, potentially simplified data) - UPDATED to include profile_json
app.get('/api/users', authenticateToken, (req, res) => {
    // For privacy, only return public info, not passwords
    db.all('SELECT id, username, skills_offer, skills_want, profile_json FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error fetching all users:', err.message);
            return res.status(500).json({ message: 'Server error fetching users' });
        }
        // Parse skills for each user
        const users = rows.map(user => {
            const profileData = user.profile_json ? JSON.parse(user.profile_json) : {};
            return {
                id: user.id,
                username: user.username,
                skills_offer: user.skills_offer ? JSON.parse(user.skills_offer) : [],
                skills_want: user.skills_want ? JSON.parse(user.skills_want) : [],
                name: profileData.name || '',
                location: profileData.location || '',
                profileVisibility: profileData.profileVisibility || 'public'
            };
        }).filter(user => user.profileVisibility === 'public' || user.id === req.user.id); // Only show public profiles or own profile
        res.json(users);
    });
});

// Matchmaking Endpoint (protected)
app.get('/api/matchmaking/:userId', authenticateToken, async (req, res) => {
    const targetUserId = req.params.userId;

    if (req.user.id !== parseInt(targetUserId)) {
        return res.status(403).json({ message: 'Unauthorized to request matches for another user' });
    }

    try {
        const currentUser = await new Promise((resolve, reject) => {
            db.get('SELECT id, username, skills_offer, skills_want, profile_json FROM users WHERE id = ?', [targetUserId], (err, row) => {
                if (err) reject(err);
                else if (!row) reject(new Error('Current user not found.'));
                else {
                    row.skills_offer = row.skills_offer ? JSON.parse(row.skills_offer) : [];
                    row.skills_want = row.skills_want ? JSON.parse(row.skills_want) : [];
                    row.profile_data = row.profile_json ? JSON.parse(row.profile_json) : {};
                    resolve(row);
                }
            });
        });

        if (currentUser.skills_offer.length === 0 && currentUser.skills_want.length === 0) {
            return res.status(400).json({ message: 'Please add skills you offer or want in your profile to find matches.' });
        }

        const otherUsers = await new Promise((resolve, reject) => {
            db.all('SELECT id, username, skills_offer, skills_want, profile_json FROM users WHERE id != ?', [targetUserId], (err, rows) => {
                if (err) reject(err);
                else {
                    const users = rows.map(user => {
                        const profileData = user.profile_json ? JSON.parse(user.profile_json) : {};
                        return {
                            id: user.id,
                            username: user.username,
                            skills_offer: user.skills_offer ? JSON.parse(user.skills_offer) : [],
                            skills_want: user.skills_want ? JSON.parse(user.skills_want) : [],
                            profileVisibility: profileData.profileVisibility || 'public'
                        };
                    }).filter(user => user.profileVisibility === 'public');
                    resolve(users);
                }
            });
        });

        if (otherUsers.length === 0) {
            return res.json({ matches: [], message: 'No other public users to match with yet.' });
        }

        const prompt = `
            You are an intelligent skill swap matchmaking agent. Your goal is to find the best skill exchange partners for the 'current user' from a list of 'other users'.

            Prioritize mutual exchanges where both users offer a skill the other wants.
            Then consider matches where one user offers a skill the other wants.

            Here is the current user's profile:
            Name: ${currentUser.username}
            Skills Offered: ${currentUser.skills_offer.join(', ') || 'None'}
            Skills Wanted: ${currentUser.skills_want.join(', ') || 'None'}

            Here are other users' profiles:
            ${otherUsers.map(user => `
            ID: ${user.id}
            Name: ${user.username}
            Skills Offered: ${user.skills_offer.join(', ') || 'None'}
            Skills Wanted: ${user.skills_want.join(', ') || 'None'}
            `).join('\n\n')}

            Analyze these profiles and suggest potential skill swap partners for ${currentUser.username}.
            For each suggested partner, provide their ID, Name, and a concise explanation (1-2 sentences) of why they are a good match, focusing on the skill overlaps or complementary needs.

            Format your output as a JSON array of objects. Each object should have 'user_id', 'user_name', and 'reasoning'.
            Example:
            [
              { "user_id": 101, "user_name": "Alice", "reasoning": "Alice offers Graphic Design which you want, and you offer Python which she wants." },
              { "user_id": 105, "user_name": "Bob", "reasoning": "Bob offers Web Development which you want to learn." }
            ]
            If no good matches are found, return an empty array [].
            `;

        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemma3:1b', // Changed to the gemma3:1b model
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                },
            }),
        });

        if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            console.error('Ollama API error:', ollamaResponse.status, errorText);
            throw new Error(`Failed to get response from Ollama API: ${errorText}`);
        }

        const data = await ollamaResponse.json();
        let matches = [];
        try {
            const jsonString = data.response.substring(data.response.indexOf('[') , data.response.lastIndexOf(']') + 1);
            matches = JSON.parse(jsonString);
        } catch (parseError) {
            console.warn('Failed to parse LLM response as JSON. Response:', data.response);
            matches = [];
        }

        res.json({ matches });

    } catch (error) {
        console.error('Matchmaking error:', error);
        res.status(500).json({ message: 'Server error during matchmaking: ' + error.message });
    }
});

// --- Global State & Utility Functions ---
const API_BASE_URL = 'http://localhost:3000/api';
console.log('Frontend attempting to connect to backend at:', API_BASE_URL); // Added for debugging
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
    updateNavigation();
    // Scroll to top when page changes (useful for mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const displayMessage = (elementId, message, type) => {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}-message`;
    element.style.display = 'block';
};

const clearMessage = (elementId) => {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.className = 'message';
    element.style.display = 'none';
};

const updateNavigation = () => {
    const nav = document.getElementById('main-nav');
    nav.innerHTML = ''; // Clear existing nav

    const headerElement = document.querySelector('header');
    if (headerElement) {
        const headerHeight = headerElement.offsetHeight;
        console.log('Calculated Header offsetHeight:', headerHeight); // Log header height for debugging
        document.body.style.paddingTop = headerHeight + 'px';
    } else {
        console.warn('Header element not found when updating navigation. Using default padding from CSS.');
        // Fallback padding is now primarily handled by CSS body { padding-top: 80px; }
    }

    if (authToken) {
        const username = currentUser ? currentUser.username : 'Guest';
        nav.innerHTML = `
            <span>Welcome, ${username}!</span> |
            <a href="#" id="nav-dashboard">Dashboard</a> |
            <a href="#" id="nav-logout">Logout</a>
        `;
        document.getElementById('nav-dashboard').onclick = () => showPage('dashboard-page');
        document.getElementById('nav-logout').onclick = logout;
    } else {
        nav.innerHTML = `
            <a href="#" id="nav-home">Home</a> |
            <a href="#" id="nav-login">Login</a> |
            <a href="#" id="nav-register">Register</a>
        `;
        document.getElementById('nav-home').onclick = (e) => { e.preventDefault(); showPage('home-page'); };
        document.getElementById('nav-login').onclick = (e) => { e.preventDefault(); showPage('auth-page'); showAuthView('login'); };
        document.getElementById('nav-register').onclick = (e) => { e.preventDefault(); showPage('auth-page'); showAuthView('register'); };
    }
};

// Function to switch between login and register forms within the auth-page
const showAuthView = (view) => {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    if (view === 'login') {
        loginView.style.display = 'block';
        registerView.style.display = 'none';
        clearMessage('register-message'); // Clear message when switching views
    } else {
        loginView.style.display = 'none';
        registerView.style.display = 'block';
        clearMessage('login-message'); // Clear message when switching views
    }
};

const checkAuthAndRedirect = () => {
    if (authToken && currentUser) {
        showPage('dashboard-page');
        document.getElementById('dashboard-welcome').textContent = `Welcome to your Dashboard, ${currentUser.username}!`;
    } else {
        showPage('home-page'); // Show the new homepage if not authenticated
    }
};

const logout = () => {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Logged out successfully!');
    checkAuthAndRedirect();
};

// --- Authentication (Login/Register) ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage('login-message');
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            alert('Login successful!');
            checkAuthAndRedirect();
        } else {
            displayMessage('login-message', data.message || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        // More informative message for network errors
        displayMessage('login-message', 'Network error or server unavailable. Please ensure the backend server is running and accessible at ' + API_BASE_URL, 'error');
    }
});

// Register & Create Profile Form Submission
document.getElementById('register-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage('register-message');

    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const location = document.getElementById('register-location').value;
    const skills = document.getElementById('register-skills').value; // Textarea for skills
    const availability = document.getElementById('register-availability').value;
    const profileVisibility = document.querySelector('input[name="registerProfileVisibility"]:checked').value;
    const profilePhotoInput = document.getElementById('register-profilePhoto');
    let profilePhotoUrl = 'placeholder.jpg'; // Default

    // Client-side photo preview logic (photo not sent to server)
    if (profilePhotoInput && profilePhotoInput.files && profilePhotoInput.files[0]) {
        const file = profilePhotoInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('register-photoPreview').src = e.target.result;
            // You could store this base64 in localStorage if you want it to persist client-side
            // localStorage.setItem('registerPhotoPreview', e.target.result);
        };
        reader.readAsDataURL(file);
        // Note: profilePhotoUrl sent to backend will still be 'placeholder.jpg' or a generic URL
        // unless you implement a proper image upload service.
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                name,
                email,
                location,
                skills, // Send as textarea string
                availability,
                profileVisibility,
                profilePhotoUrl // This will be 'placeholder.jpg' or a default
            })
        });
        const data = await response.json();

        if (response.ok) {
            displayMessage('register-message', data.message || 'Registration successful! Please login.', 'success');
            document.getElementById('register-profile-form').reset();
            document.getElementById('register-photoPreview').src = 'placeholder.jpg'; // Reset photo preview
            showAuthView('login'); // Redirect to login view after successful registration
        } else {
            displayMessage('register-message', data.message || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        // More informative message for network errors
        displayMessage('register-message', 'Network error or server unavailable. Please ensure the backend server is running and accessible at ' + API_BASE_URL, 'error');
    }
});

// Photo preview for Register page
document.getElementById('register-profilePhoto')?.addEventListener('change', function() {
    const file = this.files[0];
    const photoPreview = document.getElementById('register-photoPreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            photoPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        photoPreview.src = 'placeholder.jpg'; // Reset to placeholder if no file
    }
});
document.querySelector('#register-view .photo-preview-container')?.addEventListener('click', () => {
    document.getElementById('register-profilePhoto').click();
});


document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthView('register');
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthView('login');
});

// --- Homepage buttons ---
document.getElementById('home-login-btn')?.addEventListener('click', () => {
    showPage('auth-page');
    showAuthView('login');
});

document.getElementById('home-register-btn')?.addEventListener('click', () => {
    showPage('auth-page');
    showAuthView('register');
});


// --- Dashboard Navigation ---
document.getElementById('show-profile').addEventListener('click', () => {
    showPage('profile-page');
    loadUserProfile();
});
document.getElementById('show-browse-skills').addEventListener('click', () => {
    showPage('browse-skills-page');
    loadAllUsers();
});
document.getElementById('show-matches').addEventListener('click', () => {
    showPage('matches-page');
    findMatches(); // Automatically find matches when page is shown
});

// --- Profile Page Logic (for editing after registration) ---
let userSkillsOffer = [];
let userSkillsWant = [];
let currentProfileData = {}; // To store other profile details

const renderSkills = (type) => {
    const container = document.getElementById(`skills-${type}-tags`);
    if (!container) return;
    container.innerHTML = '';
    const skillsArray = type === 'offer' ? userSkillsOffer : userSkillsWant;
    skillsArray.forEach((skill, index) => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.innerHTML = `${skill} <button data-type="${type}" data-index="${index}">x</button>`;
        container.appendChild(span);
    });
};

const addSkill = (type) => {
    const input = document.getElementById(`new-skill-${type}`);
    if (!input) return;
    const skillText = input.value.trim();
    if (skillText) {
        const skillsArray = type === 'offer' ? userSkillsOffer : userSkillsWant;
        if (!skillsArray.includes(skillText)) {
            skillsArray.push(skillText);
            renderSkills(type);
            input.value = '';
        }
    }
};

const removeSkill = (type, index) => {
    const skillsArray = type === 'offer' ? userSkillsOffer : userSkillsWant;
    skillsArray.splice(index, 1);
    renderSkills(type);
};

// Event listeners for adding skills
document.getElementById('add-skill-offer')?.addEventListener('click', () => addSkill('offer'));
document.getElementById('new-skill-offer')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') addSkill('offer');
});
document.getElementById('add-skill-want')?.addEventListener('click', () => addSkill('want'));
document.getElementById('new-skill-want')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') addSkill('want');
});

// Event listeners for removing skills
document.getElementById('skills-offer-tags')?.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        removeSkill(e.target.dataset.type, parseInt(e.target.dataset.index));
    }
});
document.getElementById('skills-want-tags')?.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        removeSkill(e.target.dataset.type, parseInt(e.target.dataset.index));
    }
});

// Photo preview for Edit Profile page
document.getElementById('edit-profilePhoto')?.addEventListener('change', function() {
    const file = this.files[0];
    const photoPreview = document.getElementById('edit-photoPreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            photoPreview.src = e.target.result;
            // Store base64 string in currentProfileData for potential saving
            currentProfileData.profilePhotoUrl = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        photoPreview.src = 'placeholder.jpg'; // Reset to placeholder if no file
        currentProfileData.profilePhotoUrl = 'placeholder.jpg';
    }
});
document.querySelector('#profile-page .photo-preview-container')?.addEventListener('click', () => {
    document.getElementById('edit-profilePhoto').click();
});


const loadUserProfile = async () => {
    clearMessage('edit-profile-details-message');
    clearMessage('edit-skills-message');
    if (!authToken || !currentUser) {
        displayMessage('edit-profile-details-message', 'Please log in to view your profile.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (response.ok) {
            // Populate profile details
            currentProfileData = data.profile_data || {};
            document.getElementById('edit-name').value = currentProfileData.name || '';
            document.getElementById('edit-email').value = currentProfileData.email || '';
            document.getElementById('edit-location').value = currentProfileData.location || '';
            document.getElementById('edit-availability').value = currentProfileData.availability || '';
            document.querySelector(`input[name="editProfileVisibility"][value="${currentProfileData.profileVisibility || 'public'}"]`).checked = true;
            document.getElementById('edit-photoPreview').src = currentProfileData.profilePhotoUrl || 'placeholder.jpg';

            // Populate skills
            userSkillsOffer = data.skills_offer || [];
            userSkillsWant = data.skills_want || [];
            renderSkills('offer');
            renderSkills('want');
        } else {
            displayMessage('edit-profile-details-message', data.message || 'Failed to load profile.', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        displayMessage('edit-profile-details-message', 'Network error or server unavailable. Please ensure the backend is running.', 'error');
    }
};

// Save Profile Details (Name, Email, Location, etc.)
document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage('edit-profile-details-message');
    if (!authToken || !currentUser) {
        displayMessage('edit-profile-details-message', 'Please log in to save your profile details.', 'error');
        return;
    }

    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const location = document.getElementById('edit-location').value;
    const availability = document.getElementById('edit-availability').value;
    const profileVisibility = document.querySelector('input[name="editProfileVisibility"]:checked').value;
    const profilePhotoUrl = document.getElementById('edit-photoPreview').src; // Get current src

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                email,
                location,
                availability,
                profileVisibility,
                profilePhotoUrl
            })
        });
        const data = await response.json();

        if (response.ok) {
            displayMessage('edit-profile-details-message', data.message || 'Profile details saved successfully!', 'success');
            // Update currentUser in localStorage to reflect changes immediately
            currentUser.profile_data = { ...currentUser.profile_data, name, email, location, availability, profileVisibility, profilePhotoUrl };
            localStorage.setItem('user', JSON.stringify(currentUser));
        } else {
            displayMessage('edit-profile-details-message', data.message || 'Failed to save profile details.', 'error');
        }
    } catch (error) {
        console.error('Error saving profile details:', error);
        displayMessage('edit-profile-details-message', 'Network error or server unavailable. Please ensure the backend is running.', 'error');
    }
});

// Save Skills (Offer/Want)
document.getElementById('editSkillsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage('edit-skills-message');
    if (!authToken || !currentUser) {
        displayMessage('edit-skills-message', 'Please log in to save your skills.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/skills`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                skills_offer: userSkillsOffer,
                skills_want: userSkillsWant
            })
        });
        const data = await response.json();

        if (response.ok) {
            displayMessage('edit-skills-message', data.message || 'Skills saved successfully!', 'success');
        } else {
            displayMessage('edit-skills-message', data.message || 'Failed to save skills.', 'error');
        }
    } catch (error) {
        console.error('Error saving skills:', error);
        displayMessage('edit-skills-message', 'Network error or server unavailable. Please ensure the backend is running.', 'error');
    }
});


// --- Browse Skills Page Logic ---
const loadAllUsers = async () => {
    const userListDiv = document.getElementById('browse-skills-list');
    const loadingSpinner = document.getElementById('browse-loading');
    const loadingText = document.getElementById('browse-loading-text');
    const errorDiv = document.getElementById('browse-error');
    const noUsersDiv = document.getElementById('browse-no-users');

    userListDiv.innerHTML = ''; // Clear previous users
    loadingSpinner.style.display = 'block';
    loadingText.style.display = 'block';
    errorDiv.style.display = 'none';
    noUsersDiv.style.display = 'none';

    if (!authToken) {
        displayMessage('browse-error', 'Please log in to browse skills.', 'error');
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (response.ok) {
            const otherUsers = data.filter(user => user.id !== currentUser.id); // Exclude current user
            if (otherUsers.length === 0) {
                noUsersDiv.style.display = 'block';
            } else {
                otherUsers.forEach(user => {
                    const userCard = document.createElement('div');
                    userCard.className = 'user-card';
                    userCard.innerHTML = `
                        <h3>${user.name || user.username}</h3>
                        <p><strong>Location:</strong> ${user.location || 'N/A'}</p>
                        <p><strong>Offers:</strong> 
                            ${user.skills_offer && user.skills_offer.length > 0
                                ? user.skills_offer.map(s => `<span class="skill-tag-small">${s}</span>`).join('')
                                : 'No skills offered yet.'}
                        </p>
                        <p><strong>Wants:</strong> 
                            ${user.skills_want && user.skills_want.length > 0
                                ? user.skills_want.map(s => `<span class="skill-tag-small want-tag">${s}</span>`).join('')
                                : 'No skills wanted yet.'}
                        </p>
                        <p><strong>Availability:</strong> ${user.availability || 'N/A'}</p>
                    `;
                    userListDiv.appendChild(userCard);
                });
            }
        } else {
            displayMessage('browse-error', data.message || 'Failed to load users.', 'error');
        }
    } catch (error) {
        console.error('Error loading all users:', error);
        displayMessage('browse-error', 'Network error or server unavailable. Please ensure the backend is running.', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
    }
};

// --- Matches Page Logic (AI Integration) ---
const findMatches = async () => {
    const matchesListDiv = document.getElementById('matches-list');
    const loadingSpinner = document.getElementById('matches-loading');
    const loadingText = document.getElementById('matches-loading-text');
    const errorDiv = document.getElementById('matches-error');
    const noMatchesDiv = document.getElementById('matches-no-matches');
    const findMatchesButton = document.getElementById('find-matches-button');

    matchesListDiv.innerHTML = ''; // Clear previous matches
    loadingSpinner.style.display = 'block';
    loadingText.style.display = 'block';
    errorDiv.style.display = 'none';
    noMatchesDiv.style.display = 'none';
    findMatchesButton.disabled = true; // Disable button while loading

    if (!authToken || !currentUser) {
        displayMessage('matches-error', 'Please log in to find matches.', 'error');
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
        findMatchesButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/matchmaking/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        // Log the full response for debugging
        console.log('Matchmaking API Response:', response.status, data);

        if (response.ok) {
            if (data.matches && data.matches.length > 0) {
                data.matches.forEach(match => {
                    const matchCard = document.createElement('div');
                    matchCard.className = 'match-card';
                    matchCard.innerHTML = `
                        <h3>${match.user_name}</h3>
                        <p><strong>Reason for Match:</strong> ${match.reasoning}</p>
                    `;
                    matchesListDiv.appendChild(matchCard);
                });
            } else {
                noMatchesDiv.textContent = data.message || 'No matches found yet. Make sure you have skills listed in your profile!';
                noMatchesDiv.style.display = 'block';
            }
        } else {
            // Specific handling for authentication errors
            if (response.status === 401 || response.status === 403) {
                displayMessage('matches-error', 'Session expired or unauthorized. Please log in again.', 'error');
                logout(); // Explicitly log out the user
            } else {
                displayMessage('matches-error', data.message || 'Failed to find matches. Is Ollama running and the model loaded?', 'error');
            }
        }
    } catch (error) {
        console.error('Error finding matches:', error);
        displayMessage('matches-error', 'Network error or server unavailable. Please ensure the backend and Ollama are running.', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
        findMatchesButton.disabled = false;
    }
};


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRedirect(); // Check if user is logged in and show appropriate page
    updateNavigation(); // Call once immediately
    // Add a slight delay to ensure header height is fully rendered before calculating padding
    setTimeout(updateNavigation, 100); 
    window.addEventListener('resize', updateNavigation); // Re-adjust on resize
});

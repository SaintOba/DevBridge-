// Skills Page JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    if (window.AppReady) {
        await window.AppReady;
    }

    // Load and display skills
    displaySkills();
    updateSkillsCount();
    
    // Form submission
    const form = document.getElementById('add-skill-form');
    if (form) {
        form.addEventListener('submit', handleAddSkill);
    }
    
    // Search and filter
    const searchInput = document.getElementById('search-skills');
    const filterCategory = document.getElementById('filter-category');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterSkills);
    }
    
    if (filterCategory) {
        filterCategory.addEventListener('change', filterSkills);
    }
});

async function handleAddSkill(e) {
    e.preventDefault();

    if (typeof Auth === 'undefined' || !Auth.isLoggedIn()) {
        alert('Please log in to add skills.');
        window.location.href = 'login.html';
        return;
    }
    
    const skillName = document.getElementById('skill-name').value.trim();
    const skillCategory = document.getElementById('skill-category').value;
    const skillLevel = document.getElementById('skill-level').value;
    const skillSource = document.getElementById('skill-source').value.trim();
    const skillDescription = document.getElementById('skill-description').value.trim();

    try {
        const session = Auth.getSession();
        const response = await fetch('https://fsuhpjlyzojioezdjjld.supabase.co/rest/v1/skills', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdWhwamx5em9qaW9lemRqamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjIxNDksImV4cCI6MjA5Mjc5ODE0OX0.IkNVBJrpPKCuW9cKfuRNMWCa2mqjuerYWNUhuDdunlM',
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: AppData.user.id,
                name: skillName,
                category: skillCategory,
                level: skillLevel,
                source: skillSource,
                description: skillDescription
            })
        });

        if (!response.ok) {
            console.error('Failed to save skill:', await response.text());
            alert('Failed to add skill. Please try again.');
            return;
        }

        const [saved] = await response.json();
        AppData.skills.push({
            id: saved.id,
            name: saved.name,
            category: saved.category,
            level: saved.level,
            source: saved.source,
            description: saved.description,
            dateAdded: saved.created_at
        });
        Storage.calculateMatches();

        e.target.reset();
        displaySkills();
        updateSkillsCount();
        Utils.showNotification('Skill added successfully!');
    } catch (error) {
        console.error('Error adding skill:', error);
        alert('Failed to add skill. Please check your connection and try again.');
    }
}

function displaySkills(skillsToShow = null) {
    const container = document.getElementById('skills-container');
    const skills = skillsToShow || AppData.skills;
    
    if (skills.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No skills added yet</h3>
                <p>Add your first skill above to get matched with opportunities!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = skills.map(skill => `
        <div class="skill-card" data-skill-id="${skill.id}">
            <div class="skill-card-header">
                <div>
                    <h3>${skill.name}</h3>
                    <span class="skill-category">${skill.category}</span>
                    <span class="skill-level">${skill.level}</span>
                </div>
            </div>
            ${skill.source ? `<p class="skill-source">📖 Learned from: ${skill.source}</p>` : ''}
            ${skill.description ? `<p class="skill-description">${skill.description}</p>` : ''}
            <div class="skill-actions">
                <button class="btn-delete" onclick="deleteSkill('${skill.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteSkill(skillId) {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
        const session = Auth.getSession();
        const response = await fetch(`https://fsuhpjlyzojioezdjjld.supabase.co/rest/v1/skills?id=eq.${skillId}`, {
            method: 'DELETE',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdWhwamx5em9qaW9lemRqamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjIxNDksImV4cCI6MjA5Mjc5ODE0OX0.IkNVBJrpPKCuW9cKfuRNMWCa2mqjuerYWNUhuDdunlM',
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!response.ok) {
            alert('Failed to delete skill. Please try again.');
            return;
        }

        AppData.skills = AppData.skills.filter(s => s.id !== skillId);
        Storage.calculateMatches();
        displaySkills();
        updateSkillsCount();
        Utils.showNotification('Skill deleted successfully!');
    } catch (error) {
        console.error('Error deleting skill:', error);
        alert('Failed to delete skill. Please check your connection and try again.');
    }
}

function filterSkills() {
    const searchTerm = document.getElementById('search-skills').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    
    let filtered = AppData.skills;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(skill => 
            skill.name.toLowerCase().includes(searchTerm) ||
            skill.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    if (categoryFilter) {
        filtered = filtered.filter(skill => skill.category === categoryFilter);
    }
    
    displaySkills(filtered);
}

function updateSkillsCount() {
    const countElement = document.getElementById('skills-count');
    if (countElement) {
        countElement.textContent = AppData.skills.length;
    }
}
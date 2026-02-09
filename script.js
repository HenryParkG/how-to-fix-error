// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Check if postsData is loaded from data/posts.js
    if (typeof postsData === 'undefined') {
        console.error('Data file not loaded properly.');
        return;
    }

    const postsGrid = document.getElementById('postsGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('postModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');

    let currentFilter = 'all';

    // Initial Render
    renderPosts(postsData);

    // Event Listeners
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter logic
            const filter = btn.getAttribute('data-filter');
            currentFilter = filter;
            handleSearch(searchInput.value); // Re-apply search with new filter
        });
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for transition
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });

    // Functions
    function renderPosts(posts) {
        postsGrid.innerHTML = '';

        if (posts.length === 0) {
            postsGrid.innerHTML = `<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fa-solid fa-ghost" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No error solutions found matching your criteria.</p>
            </div>`;
            return;
        }

        posts.forEach((post, index) => {
            const card = document.createElement('div');
            card.classList.add('post-card');
            // Staggered animation delay
            card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
            card.style.opacity = '0'; // Start invisible for animation

            // Generate HTML for card
            card.innerHTML = `
                <div class="card-header">
                    <span class="lang-badge" style="color: ${getLangColor(post.language)}">${post.language}</span>
                    <div class="status-indicator" title="Solved"></div>
                </div>
                <div class="card-content">
                    <span class="error-code">${post.code}</span>
                    <h3>${post.title}</h3>
                    <p>${post.description}</p>
                </div>
                <div class="card-footer">
                    <div class="date">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${post.date}</span>
                    </div>
                    <div class="views">
                        <i class="fa-regular fa-eye"></i>
                        <span>${post.views}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openModal(post));
            postsGrid.appendChild(card);
        });
    }

    function handleSearch(query) {
        const lowerQuery = query.toLowerCase();

        const filtered = postsData.filter(post => {
            // Check language filter
            if (currentFilter !== 'all' && post.language.toLowerCase() !== currentFilter) {
                return false;
            }

            // Check search query
            const matchesTitle = post.title.toLowerCase().includes(lowerQuery);
            const matchesCode = post.code.toLowerCase().includes(lowerQuery);
            const matchesTags = post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

            return matchesTitle || matchesCode || matchesTags;
        });

        renderPosts(filtered);
    }

    function openModal(post) {
        modalBody.innerHTML = `
            <div class="modal-header">
                <span class="lang-badge" style="color: ${getLangColor(post.language)}; margin-bottom: 1rem; display: inline-block;">${post.language}</span>
                <h2>${post.title}</h2>
                <span class="error-code">${post.code}</span>
            </div>
            
            <div class="modal-main-content">
                <p style="margin-top: 1rem; line-height: 1.6; color: #ccc;">${post.description}</p>
                
                <h3 style="margin-top: 2rem; color: #ff6b6b;">The Problem</h3>
                <div class="code-block">
                    <pre><code>${escapeHtml(post.snippet)}</code></pre>
                </div>
                
                <div class="solution-section">
                    <h3>The Solution</h3>
                    <p style="margin-bottom: 1rem;">${post.solution}</p>
                    <div class="code-block" style="border-color: var(--primary-color);">
                        <pre><code>${escapeHtml(post.fix)}</code></pre>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('show');
    }

    // Helper: Escape HTML to preventing injection (basic)
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper: Get color based on language
    function getLangColor(lang) {
        switch (lang.toLowerCase()) {
            case 'javascript': return '#f7df1e';
            case 'python': return '#3776ab';
            case 'c++': return '#00599c';
            case 'react': return '#61dafb';
            default: return '#ffffff';
        }
    }

    // Define keyframes for animation dynamically
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(styleSheet);
});

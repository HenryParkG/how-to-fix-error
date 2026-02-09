// script.js (Refactored)

document.addEventListener('DOMContentLoaded', async () => {
    const postsGrid = document.getElementById('postsGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('postModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');

    let postsIndex = []; // Holds lightweight metadata
    let currentFilter = 'all';

    // 1. Load the Index
    try {
        const response = await fetch('data/index.json');
        if (!response.ok) throw new Error("Failed to load index.");
        postsIndex = await response.json();

        // Sort by date desc
        postsIndex.sort((a, b) => new Date(b.date) - new Date(a.date));

        renderPosts(postsIndex);
    } catch (err) {
        console.error(err);
        postsGrid.innerHTML = `<div class="error-msg">Failed to load error database. Please try again later.</div>`;
    }

    // Event Listeners
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            handleSearch(searchInput.value);
        });
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });

    // Functions
    function renderPosts(posts) {
        postsGrid.innerHTML = '';

        if (posts.length === 0) {
            postsGrid.innerHTML = `<div class="no-results">No error solutions found.</div>`;
            return;
        }

        posts.forEach((post, index) => {
            const card = document.createElement('div');
            card.classList.add('post-card');
            card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
            card.style.opacity = '0';

            // Generate Card HTML (using metadata)
            card.innerHTML = `
                <div class="card-header">
                    <span class="lang-badge" style="color: ${getLangColor(post.language)}">${post.language}</span>
                    <div class="status-indicator" title="Solved"></div>
                </div>
                <div class="card-content">
                    <span class="error-code">${post.code}</span>
                    <h3>${post.title}</h3>
                    <p class="meta-desc">Click to view detailed analysis & solution...</p>
                </div>
                <div class="card-footer">
                    <div class="date">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${post.date}</span>
                    </div>
                </div>
            `;

            // On click, fetch full content
            card.addEventListener('click', () => loadAndOpenPost(post));
            postsGrid.appendChild(card);
        });
    }

    async function loadAndOpenPost(meta) {
        // Show loading state in modal?
        modalBody.innerHTML = `<div class="loading">Loading content...</div>`;
        modal.style.display = 'flex';
        modal.classList.add('show');

        try {
            const res = await fetch(meta.path);
            if (!res.ok) throw new Error("Content not found");
            const fullPost = await res.json();

            renderModalContent(fullPost);
        } catch (e) {
            modalBody.innerHTML = `<div class="error">Failed to load details.</div>`;
        }
    }

    function renderModalContent(post) {
        // Updated for richer content structure
        modalBody.innerHTML = `
            <div class="modal-header">
                <span class="lang-badge" style="color: ${getLangColor(post.language)}">${post.language}</span>
                <h2>${post.title}</h2>
                <div class="tags-container">
                    ${post.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
                </div>
            </div>
            
            <div class="modal-main-content">
                <section class="analysis-section">
                    <h3>🧐 Analysis</h3>
                    <p>${post.analysis}</p>
                </section>

                <section class="cause-section">
                    <h3>❌ The Problem (Root Cause)</h3>
                    <p>${post.root_cause}</p>
                    <div class="code-block bug">
                        <pre><code>${escapeHtml(post.bad_code)}</code></pre>
                    </div>
                </section>
                
                <section class="solution-section">
                    <h3>✅ The Solution (Best Practice)</h3>
                    <p>${post.solution_desc}</p>
                    <div class="code-block fix">
                        <pre><code>${escapeHtml(post.good_code)}</code></pre>
                    </div>
                </section>

                <section class="verification-section">
                     <h3>🛡️ Verification & Tips</h3>
                     <p>${post.verification}</p>
                </section>
            </div>
        `;
    }

    function handleSearch(query) {
        const lowerQuery = query.toLowerCase();

        const filtered = postsIndex.filter(post => {
            if (currentFilter !== 'all' && post.language.toLowerCase() !== currentFilter) return false;

            return post.title.toLowerCase().includes(lowerQuery) ||
                post.code.toLowerCase().includes(lowerQuery) ||
                post.tags.some(t => t.toLowerCase().includes(lowerQuery));
        });

        renderPosts(filtered);
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function getLangColor(lang) {
        switch (lang.toLowerCase()) {
            case 'javascript': return '#f7df1e';
            case 'python': return '#3776ab';
            case 'c++': return '#00599c';
            case 'java': return '#b07219';
            case 'korean': return '#ff6b6b';
            default: return '#ffffff';
        }
    }
});

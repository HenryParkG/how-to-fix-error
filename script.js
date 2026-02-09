// script.js (Ver 3.7 - Logic & Visibility Fix)

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('postsGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('postModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');

    let data = [];
    let currentFilter = 'all';

    // --- 데이터 로드 핸들러 (JSONP) ---
    window.onPostDataLoaded = (postContent) => {
        renderModalContent(postContent);
    };

    // 1. 초기 데이터 설정
    if (window.postsIndex) {
        data = [...window.postsIndex];
        renderPosts(data);
    }

    // 2. 카테고리 필터 이벤트 연동
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            handleSearch(searchInput?.value || "");

            // 필터 클릭 시 목록 상단으로 부드럽게 이동
            window.scrollTo({ top: document.getElementById('recent').offsetTop - 50, behavior: 'smooth' });
        });
    });

    // 3. 검색 이벤트 연동
    searchInput?.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    function renderPosts(posts) {
        if (!postsGrid) return;
        postsGrid.innerHTML = '';

        if (posts.length === 0) {
            postsGrid.innerHTML = '<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">검색 결과가 없습니다.</div>';
            return;
        }

        posts.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.05}s`;

            card.innerHTML = `
                <div class="card-header">
                    <span class="lang-badge">${post.language}</span>
                    <div class="status-indicator"></div>
                </div>
                <div class="card-content">
                    <span class="error-code">${post.code}</span>
                    <h3>${post.title}</h3>
                </div>
                <div class="card-footer">
                    <span><i class="fa-regular fa-calendar"></i> ${post.date}</span>
                </div>
            `;
            card.onclick = () => loadPost(post);
            postsGrid.appendChild(card);
        });
    }

    function handleSearch(query) {
        const lowerQuery = query.toLowerCase();
        const filtered = data.filter(post => {
            // 카테고리 필터 (부분 일치로 변경)
            const langMatch = currentFilter === 'all' || post.language.toLowerCase().includes(currentFilter);
            if (!langMatch) return false;

            // 검색어 필터
            return post.title.toLowerCase().includes(lowerQuery) ||
                post.code.toLowerCase().includes(lowerQuery) ||
                post.tags.some(t => t.toLowerCase().includes(lowerQuery));
        });
        renderPosts(filtered);
    }

    function loadPost(meta) {
        modalBody.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> 로딩 중...</div>';
        modal.style.display = 'flex';
        modal.classList.add('show');

        // .json 파일은 fetch, .js 파일은 script 삽입
        if (meta.path.endsWith('.json')) {
            fetch(meta.path)
                .then(r => r.json())
                .then(d => renderModalContent(d))
                .catch(() => {
                    modalBody.innerHTML = '<div class="error-msg">로컬 보안 정책으로 인해 상세 내용을 가져올 수 없습니다. <b>GitHub Pages</b>에서 확인해주세요.</div>';
                });
        } else {
            const script = document.createElement('script');
            script.src = meta.path;
            script.onload = () => script.remove();
            document.body.appendChild(script);
        }
    }

    function renderModalContent(post) {
        modalBody.innerHTML = `
            <div class="modal-header">
                <span class="lang-tag">${post.language}</span>
                <h2>${post.title}</h2>
                <div class="tags-container">${(post.tags || []).map(t => `<span class="tag">#${t}</span>`).join('')}</div>
            </div>
            
            <div class="modal-main-content">
                <section class="content-section">
                    <h3><i class="fa-solid fa-magnifying-glass-chart"></i> Analysis</h3>
                    <div class="rich-text">${post.analysis}</div>
                </section>

                <section class="content-section cau">
                    <h3><i class="fa-solid fa-circle-xmark"></i> Root Cause</h3>
                    <div class="rich-text">${post.root_cause}</div>
                    <div class="code-header"><i class="fa-solid fa-bug"></i> Buggy Code</div>
                    <div class="code-block bug"><pre><code>${escapeHtml(post.bad_code)}</code></pre></div>
                </section>
                
                <section class="content-section sol">
                    <h3><i class="fa-solid fa-circle-check"></i> Solution</h3>
                    <div class="rich-text">${post.solution_desc}</div>
                    <div class="code-header"><i class="fa-solid fa-wand-magic-sparkles"></i> Fixed Code</div>
                    <div class="code-block fix"><pre><code>${escapeHtml(post.good_code)}</code></pre></div>
                </section>

                <section class="content-section ver">
                     <h3><i class="fa-solid fa-shield-halved"></i> Verification & Tips</h3>
                     <div class="rich-text">${post.verification}</div>
                </section>
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    const hideModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    };

    closeModal?.addEventListener('click', hideModal);
    window.onclick = (e) => { if (e.target === modal) hideModal(); };
});

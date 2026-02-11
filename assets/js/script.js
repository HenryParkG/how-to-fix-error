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
        handleSearch(""); // 초기 로드 시에도 필터 적용 (트렌드 배제)
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

    // 3. 검색 및 필터 초기화
    searchInput?.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // URL 파라미터(search=...)가 있으면 자동 검색 실행
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('search');
    if (initialQuery && searchInput) {
        searchInput.value = initialQuery;
        handleSearch(initialQuery);
    }

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
            const tags = (post.tags || []).map(t => t.toLowerCase());
            const isTrend = tags.includes('tech trend') || tags.includes('github');
            if (isTrend) return false;

            const matchCat = currentFilter === 'all' ||
                post.language.toLowerCase() === currentFilter ||
                (post.tags && post.tags.map(t => t.toLowerCase()).includes(currentFilter));

            const matchSearch = post.title.toLowerCase().includes(lowerQuery) ||
                post.code.toLowerCase().includes(lowerQuery) ||
                post.language.toLowerCase().includes(lowerQuery);

            return matchCat && matchSearch;
        });
        renderPosts(filtered);
    }

    function loadPost(meta) {
        // 모달 대신 전용 상세 페이지로 이동 (SEO & AdSense 최적화)
        window.location.href = `/pages/post.html?id=${meta.id}`;
    }

    function renderModalContent(post) {
        // 관련 게시물 찾기
        const related = getRelatedPosts(post);
        
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
                    <div class="code-header" style="justify-content: space-between; display: flex;">
                        <span><i class="fa-solid fa-wand-magic-sparkles"></i> Fixed Code</span>
                        <button onclick="copyCode(this)" class="copy-btn" title="Copy Code"><i class="fa-regular fa-copy"></i></button>
                    </div>
                    <div class="code-block fix"><pre><code>${escapeHtml(post.good_code)}</code></pre></div>
                </section>

                <section class="content-section ver">
                     <h3><i class="fa-solid fa-shield-halved"></i> Verification & Tips</h3>
                     <div class="rich-text">${post.verification}</div>
                </section>

                ${related.length > 0 ? `
                <section class="content-section related">
                    <h3 style="margin-top:2rem; border-top:1px solid var(--glass-border); padding-top:1rem;">
                        <i class="fa-solid fa-link"></i> Related Error Fixes
                    </h3>
                    <div class="related-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-top:1rem;">
                        ${related.map(p => `
                            <a href="/pages/post.html?id=${p.id}" class="related-card" style="text-decoration:none; color:inherit; background:rgba(255,255,255,0.03); padding:1rem; border-radius:8px; border:1px solid var(--glass-border); transition:0.2s;">
                                <div style="font-size:0.8rem; color:var(--primary-color); margin-bottom:0.5rem;">${p.language}</div>
                                <div style="font-weight:600; font-size:0.9rem; line-height:1.4;">${p.title}</div>
                            </a>
                        `).join('')}
                    </div>
                </section>
                ` : ''}
            </div>
        `;
    }

    // 전역 함수로 등록 (onclick 작동용)
    window.copyCode = (btn) => {
        const codeBlock = btn.parentElement.nextElementSibling.querySelector('code');
        const text = codeBlock.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const icon = btn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            setTimeout(() => icon.className = 'fa-regular fa-copy', 2000);
        });
    };

    function getRelatedPosts(currentPost) {
        if (!window.postsIndex) return [];
        // 같은 언어이거나 태그가 하나라도 겹치는 글 (자기 자신 제외)
        return window.postsIndex
            .filter(p => p.id !== currentPost.id)
            .filter(p => p.language === currentPost.language || 
                        (p.tags && currentPost.tags && p.tags.some(t => currentPost.tags.includes(t))))
            .slice(0, 3); // 최대 3개
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

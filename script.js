// script.js (Ver 3.6 - The "Just Works" System)

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('postsGrid');
    const modal = document.getElementById('postModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');

    let data = [];

    // --- 포스트 데이터 로드 핸들러 (전역) ---
    // .js 파일을 로드하면 이 함수가 자동으로 호출됨
    window.onPostDataLoaded = (postContent) => {
        renderModalContent(postContent);
    };

    // 1. 목록 데이터 로드
    if (window.postsIndex) {
        data = [...window.postsIndex];
        renderPosts(data);
    }

    function renderPosts(posts) {
        if (!postsGrid) return;
        postsGrid.innerHTML = '';
        posts.forEach((post) => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="card-header"><span class="lang-badge">${post.language}</span></div>
                <div class="card-content">
                    <span class="error-code">${post.code}</span>
                    <h3>${post.title}</h3>
                    <p class="meta-desc">분석 및 해결 방법 보기...</p>
                </div>
                <div class="card-footer"><span>${post.date}</span></div>
            `;
            card.onclick = () => loadPost(post);
            postsGrid.appendChild(card);
        });
    }

    function loadPost(meta) {
        modalBody.innerHTML = '<div class="loading">콘텐츠 로딩 중...</div>';
        modal.style.display = 'flex';
        modal.classList.add('show');

        // [핵심] fetch 대신 script 태그 사용 (CORS 우회)
        // 만약 예전 글 (.json) 이면 경고 출력
        if (meta.path.endsWith('.json')) {
            modalBody.innerHTML = '<div class="error-msg">이 글은 예전 형식(.json)이라 로컬에서 열 수 없습니다. 깃허브 페이지에서 확인해주세요.</div>';
            return;
        }

        const script = document.createElement('script');
        script.src = meta.path;
        // 로드 완료 후 태그 삭제 (깔끔하게)
        script.onload = () => script.remove();
        document.body.appendChild(script);
    }

    function renderModalContent(post) {
        modalBody.innerHTML = `
            <div class="modal-header">
                <h2>${post.title}</h2>
                <div class="tags-container">${(post.tags || []).map(t => `<span class="tag">#${t}</span>`).join('')}</div>
            </div>
            <div class="modal-main-content">
                <section><h3>🧐 Analysis</h3><div>${post.analysis}</div></section>
                <section><h3>❌ Root Cause</h3><div>${post.root_cause}</div><div class="code-block bug"><pre><code>${escapeHtml(post.bad_code)}</code></pre></div></section>
                <section><h3>✅ Solution</h3><div>${post.solution_desc}</div><div class="code-block fix"><pre><code>${escapeHtml(post.good_code)}</code></pre></div></section>
                <section><h3>🛡️ Verification</h3><div>${post.verification}</div></section>
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    closeModal?.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });
});

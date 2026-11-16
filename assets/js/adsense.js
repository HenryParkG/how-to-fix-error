/**
 * Google AdSense 중앙 관리 스크립트 (ErrorLog)
 *
 * [사용 방법]
 * 1. 자동 광고(Auto Ads)만 사용하려면 아래 AD_SLOTS 값을 모두 빈 문자열("")로 두세요.
 *    - HTML <head>에 이미 삽입된 adsbygoogle.js 스크립트가 자동으로 광고를 배치합니다.
 *    - 빈 광고 박스는 화면에 표시되지 않습니다.
 * 2. 수동 광고(디스플레이 광고 단위)를 원하는 위치에 표시하려면
 *    애드센스 대시보드 [광고 > 광고 단위 기준 > 디스플레이 광고]에서 발급받은
 *    10자리 슬롯 ID(data-ad-slot)를 아래에 입력하세요.
 *    - 모든 위치에 동일한 반응형 슬롯을 쓰려면 defaultSlot에만 입력해도 됩니다.
 */
(function () {
    const AD_CLIENT = "ca-pub-5494146787928941";

    const AD_SLOTS = {
        // 공통 슬롯 ID (개별 위치가 비어 있을 때 기본으로 사용됨)
        defaultSlot: "",

        // 위치별 개별 슬롯 ID (원하는 위치만 다르게 지정 가능)
        top: "",     // 포스트 상세 상단 (pages/post.html)
        middle: "",  // 포스트 본문 중간 (pages/post.html)
        bottom: "",  // 포스트 상세 하단 (pages/post.html)
        hero: "",    // Solutions / Trends 목록 상단 (pages/solutions.html, pages/trends.html)
        home: ""     // 메인 페이지 하단 (index.html)
    };

    /**
     * 지정된 루트 요소 내의 `.ad-slot[data-ad-position]` 요소를 찾아 AdSense 광고를 렌더링합니다.
     * 슬롯 ID가 설정되지 않은 경우에는 요소를 숨겨 빈 박스가 보이지 않도록 처리합니다.
     *
     * @param {ParentNode} [root=document] - 광고 슬롯을 탐색할 기준 DOM 노드
     */
    window.renderAdSlots = function renderAdSlots(root = document) {
        if (!root || typeof root.querySelectorAll !== "function") return;

        const slots = root.querySelectorAll(".ad-slot[data-ad-position]");
        slots.forEach((el) => {
            const position = el.getAttribute("data-ad-position");
            const hasPosKey = position && Object.prototype.hasOwnProperty.call(AD_SLOTS, position);
            const posSlot = hasPosKey && typeof AD_SLOTS[position] === "string" ? AD_SLOTS[position].trim() : "";
            const fallbackSlot = typeof AD_SLOTS.defaultSlot === "string" ? AD_SLOTS.defaultSlot.trim() : "";
            const slotId = posSlot || fallbackSlot;

            if (!slotId) {
                el.style.display = "none";
                return;
            }

            if (el.dataset.adInitialized === "true") {
                return;
            }
            el.dataset.adInitialized = "true";
            el.style.display = "block";

            const ins = document.createElement("ins");
            ins.className = "adsbygoogle";
            ins.style.display = "block";
            ins.setAttribute("data-ad-client", AD_CLIENT);
            ins.setAttribute("data-ad-slot", slotId);
            ins.setAttribute("data-ad-format", "auto");
            ins.setAttribute("data-full-width-responsive", "true");

            el.innerHTML = "";
            el.appendChild(ins);

            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.warn("AdSense push error:", e);
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            window.renderAdSlots(document);
        });
    } else {
        window.renderAdSlots(document);
    }
})();

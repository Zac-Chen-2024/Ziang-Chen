/* ==========================================================================
   MusicBackdrop：播放音乐时的页面背景
   - 底层：圆点均衡器（连续亮度、快起慢落、邻列平滑、每列归一化、底噪门限），
     叠加一道横向流动的波，亮点颜色在三种绿之间缓慢漂移，副歌时浪尖带一点杏色
   - 上层：提词器式歌词（逐字点亮，整列平滑上移）
   - 只在播放时运行；暂停后回到静态点阵；系统“减少动态效果”时完全不启用
   ========================================================================== */
(function () {
    'use strict';
    const SE = window.SoundEngine;
    if (!SE || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cv = document.getElementById('bgfx');
    const lyr = document.getElementById('bgLyr');
    const lyrTrack = document.getElementById('bgLyrTrack');
    if (!cv || !lyr || !lyrTrack) return;
    const g = cv.getContext('2d');
    document.body.classList.add('fx');

    const SAGE = [164, 200, 173];
    const GREENS = [[66, 156, 90], [47, 154, 126], [106, 168, 74]];   // 叶绿 / 青绿 / 黄绿（色相都在绿色带内）
    const APRICOT = [244, 162, 84];
    const BG = [217, 236, 220], BG_WARM = [234, 230, 207];
    const GAP = 22, HOP_MS = 33;

    let W = 0, H = 0, DPR = 1, cols = 0, rows = 0;
    let colVal = [], colMax = [], colColor = [];
    function resize() {
        DPR = Math.min(1.5, window.devicePixelRatio || 1);
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        g.setTransform(DPR, 0, 0, DPR, 0, 0);
        cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1;
        colVal = new Array(cols).fill(0); colMax = new Array(cols).fill(0.25); colColor = new Array(cols);
        idleDrawn = false;
    }

    function bandValues(n) {
        const spec = SE.spectrum(), out = new Array(n);
        for (let c = 0; c < n; c++) {
            const lo = Math.floor(Math.pow(c / n, 2.1) * 520) + 2;
            const hi = Math.floor(Math.pow((c + 1) / n, 2.1) * 520) + 3;
            let s = 0;
            for (let k = lo; k < hi; k++) s += spec[k];
            out[c] = Math.min(1, s / ((hi - lo) * 255) * 1.25);
        }
        return out;
    }
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

    // 段落能量：慢平均响度相对最近峰值的位置，0 主歌 → 1 副歌
    let playAmt = 0, sectionE = 0, levelSlow = 0, levelMax = 0.2;

    function draw(now) {
        const t = now / 1000;
        const amt = playAmt;
        const b = SE.bands();
        // 背景底色：副歌时微微变暖
        g.fillStyle = rgb(mix(BG, BG_WARM, Math.min(0.6, sectionE * amt)));
        g.fillRect(0, 0, W, H);

        const raw = amt > 0.01 ? bandValues(cols) : null;
        const norm = new Array(cols);
        for (let c = 0; c < cols; c++) {
            const v = raw ? raw[c] : 0;
            colMax[c] = Math.max(colMax[c] * 0.996, v, 0.12);
            norm[c] = Math.max(0, (v / colMax[c] - 0.12) / 0.88) * amt;
        }
        let sm = norm;
        for (let pass = 0; pass < 2; pass++) {
            const nx = new Array(cols);
            for (let c = 0; c < cols; c++) nx[c] = (sm[Math.max(0, c - 1)] + 2 * sm[c] + sm[Math.min(cols - 1, c + 1)]) / 4;
            sm = nx;
        }
        for (let c = 0; c < cols; c++) {
            const rel = 0.07 - 0.035 * (c / cols);
            colVal[c] += (sm[c] - colVal[c]) * (sm[c] > colVal[c] ? 0.35 : rel);
            // 颜色：沿横向和时间缓慢漂移，在三种绿之间插值
            const ph = (Math.sin(c * 0.07 + t * 0.18) + 1) / 2, ph2 = (Math.sin(c * 0.035 - t * 0.11 + 1.3) + 1) / 2;
            colColor[c] = mix(mix(GREENS[0], GREENS[1], ph), GREENS[2], ph2 * 0.6);
        }

        const swell = 2 + 7 * b.bass * amt;              // 波的起伏幅度随低音变化
        const FEATHER = 0.14;
        for (let r = 0; r < rows; r++) {
            const fromBottom = 1 - r / rows;
            for (let c = 0; c < cols; c++) {
                const x0 = c * GAP + 11, y0 = r * GAP + 11;
                // 横向传播的波：点阵整体起伏，近底部更明显
                const wave = Math.sin(x0 * 0.011 - t * 1.3 + r * 0.05) * swell * (0.35 + 0.65 * (1 - fromBottom)) * amt;
                // 浪峰：顶部边缘再叠一道流动的波
                const crest = 0.07 * amt * Math.sin(c * 0.2 - t * 1.8);
                const v = Math.max(0, colVal[c] * 0.92 + crest * colVal[c]);
                let f = (v - fromBottom) / FEATHER + 0.5;
                f = f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f);
                const rad = 1.4 + f * (1.4 + 2.2 * v);
                const y = y0 + wave;
                g.globalAlpha = 1; g.fillStyle = rgb(SAGE);
                g.beginPath(); g.arc(x0, y, rad, 0, 6.2832); g.fill();
                if (f > 0.02) {
                    // 浪尖（亮区最上沿）在副歌时带一点杏色
                    const edge = Math.max(0, 1 - Math.abs(v - fromBottom) / 0.08);
                    const col = mix(colColor[c], APRICOT, edge * 0.45 * sectionE * amt);
                    g.globalAlpha = f * (0.55 + 0.35 * fromBottom);
                    g.fillStyle = rgb(col);
                    g.beginPath(); g.arc(x0, y, rad, 0, 6.2832); g.fill();
                }
            }
        }
        g.globalAlpha = 1;
    }

    /* ---------- 提词器歌词 ---------- */
    let built = '', lineEls = [], wordEls = [], curIdx = -2;
    function buildLyrics() {
        const tr = SE.track;
        lyrTrack.textContent = ''; lineEls = []; wordEls = []; curIdx = -2; built = tr.id;
        (tr.words || []).forEach((ws) => {
            const ln = document.createElement('p'); ln.className = 'ln';
            wordEls.push(ws.map((w) => { const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = w[2]; ln.appendChild(sp); return sp; }));
            lyrTrack.appendChild(ln); lineEls.push(ln);
        });
        lyrTrack.style.transform = 'translateY(0px)';
    }
    function updateLyrics() {
        const tr = SE.track;
        if (!tr.words) return;
        if (built !== tr.id) buildLyrics();
        const idx = SE.lyric().index;
        if (idx !== curIdx) {
            curIdx = idx;
            lineEls.forEach((el, i) => {
                const d = i - idx;
                el.className = 'ln' + (d === 0 ? ' cur' : Math.abs(d) === 1 ? ' near' : '') + (d < 0 ? ' past' : '');
            });
            const target = lineEls[Math.max(0, idx)];
            if (target) lyrTrack.style.transform = `translateY(${-(target.offsetTop - lyr.clientHeight * 0.36)}px)`;
        }
        if (idx >= 0 && wordEls[idx]) {
            const time = SE.position().time;
            tr.words[idx].forEach((w, j) => {
                const on = time >= w[0] - 0.04, el = wordEls[idx][j];
                if (el.classList.contains('on') !== on) el.classList.toggle('on', on);
            });
        }
    }

    /* ---------- 主循环：播放时 30fps；暂停后淡出，然后只画一次静态点阵 ---------- */
    let last = 0, idleDrawn = false;
    function frame(now) {
        requestAnimationFrame(frame);
        if (document.hidden || now - last < HOP_MS) return;
        last = now;
        const target = SE.playing ? 1 : 0;
        playAmt += (target - playAmt) * 0.08;
        if (SE.playing) {
            const lv = SE.bands().level;
            levelSlow += (lv - levelSlow) * 0.02;
            levelMax = Math.max(levelMax * 0.9995, levelSlow);
            sectionE += (Math.max(0, (levelSlow / levelMax - 0.72) / 0.28) - sectionE) * 0.04;
        }
        const active = SE.playing || playAmt > 0.01;
        document.body.classList.toggle('fx-playing', SE.playing);
        if (active) { idleDrawn = false; draw(now); updateLyrics(); }
        else if (!idleDrawn) { playAmt = 0; draw(now); idleDrawn = true; }
    }

    SE.on('track', () => { built = ''; sectionE = 0; levelSlow = 0; levelMax = 0.2; });
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
})();

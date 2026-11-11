/* ==========================================================================
   MusicBackdrop：播放音乐时的页面背景
   - 底层：圆点均衡器（连续亮度、快起慢落、邻列平滑、每列归一化、底噪门限），
     叠加一道横向流动的波，亮点颜色在三种绿之间缓慢漂移，副歌时浪尖带一点杏色
   - 部分歌曲有专属场景：Even Now → 布鲁克林大桥（缆索流光、副歌烟花、水面倒影）；
     Say Less → 海浪（副歌时海平面上涨）。均衡器在所有歌曲里都正常显示（大桥下方除外）
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

    const FOREST = '#11422c', MOSS = '#236b3f', LEAF = '#429c5a', APRICOT_HEX = '#f4a254', PAPER = '#f3f8ee';
    let W = 0, H = 0, DPR = 1, cols = 0, rows = 0;
    let colVal = [], colMax = [], colColor = [];
    function resize() {
        DPR = Math.min(1.5, window.devicePixelRatio || 1);
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        g.setTransform(DPR, 0, 0, DPR, 0, 0);
        cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1;
        colVal = new Array(cols).fill(0); colMax = new Array(cols).fill(0.25); colColor = new Array(cols);
        bridge = null;
        idleDrawn = false;
    }

    /* ---------- Even Now：布鲁克林大桥（静态层与倒影层各预渲染一次） ---------- */
    let bridge = null, bursts = [], lastBurst = 0;
    function mkCanvas() {
        const c = document.createElement('canvas'); c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
        const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return [c, x];
    }
    function buildBridge() {
        const SC = window.ZIANG_SCENES;
        if (!SC || !SC.bridge) return null;
        const [RW, , RB] = SC.ref;
        const top = Math.min(...SC.bridge.map((d) => d[1]));
        const k = Math.min(W / RW, (H * 0.66) / (RB - top));
        const ox = (W - RW * k) / 2, base = H * 0.74;
        const pts = SC.bridge.map((d) => [ox + d[0] * k, base - (RB - d[1]) * k, Math.max(0.6, d[2] * k), d[3]]);
        const colTop = new Array(cols).fill(base);
        pts.forEach((p) => { const c = Math.floor(p[0] / GAP); if (c >= 0 && c < cols) colTop[c] = Math.min(colTop[c], p[1] - 10); });
        const [sc, sx] = mkCanvas(), [rc, rx] = mkCanvas();
        pts.forEach((p) => { sx.fillStyle = FOREST; sx.beginPath(); sx.arc(p[0], p[1], p[2], 0, 6.2832); sx.fill(); });
        sx.fillStyle = FOREST; sx.fillRect(0, base + 1, W, 2);
        pts.forEach((p, i) => {
            const d = base - p[1];
            if (p[3] === 2 || i % 2 || d > 240 * k) return;
            rx.globalAlpha = Math.max(0, 0.4 - d / (240 * k)); rx.fillStyle = MOSS;
            rx.beginPath(); rx.arc(p[0], base + d + 4, p[2] * 0.7, 0, 6.2832); rx.fill();
        });
        return { base, colTop, cable: pts.filter((p) => p[3] === 2), static: sc, refl: rc };
    }
    function drawBridge(t, now, amt, b) {
        if (!bridge) bridge = buildBridge();
        if (!bridge) return;
        g.globalAlpha = amt;
        const sw = bridge.refl.width / W, wob = 1.5 + b.bass * 6 * amt;
        for (let y = bridge.base; y < H; y += 6) g.drawImage(bridge.refl, 0, y * sw, bridge.refl.width, 6 * sw, Math.sin(y * 0.07 + t * 2.4) * wob, y, W, 6);
        g.drawImage(bridge.static, 0, 0, W, H);
        // 缆索灯串：亮光沿缆索流动，亮度跟着响度
        const lv = b.level * amt;
        g.fillStyle = APRICOT_HEX;
        for (const p of bridge.cable) {
            const glow = Math.max(0, Math.sin(p[0] * 0.02 - t * 3)) * (0.25 + 1.4 * lv) * amt;
            if (glow < 0.05) continue;
            g.globalAlpha = Math.min(1, glow);
            g.beginPath(); g.arc(p[0], p[1], p[2] * 1.2, 0, 6.2832); g.fill();
        }
        // 副歌强拍的点阵烟花：1.6s 内扩散、淡出（只做透明度渐变，不闪）
        bursts = bursts.filter((bu) => now - bu.t < 1600);
        for (const bu of bursts) {
            const kk = (now - bu.t) / 1600, rad = 18 + kk * 110, fade = (1 - kk) * amt;
            g.fillStyle = bu.hue;
            for (let a = 0; a < 28; a++) {
                const ang = a / 28 * 6.2832;
                for (let s2 = 0; s2 < 3; s2++) {
                    const rr = rad * (0.55 + s2 * 0.22);
                    g.globalAlpha = fade * (0.9 - s2 * 0.25);
                    g.beginPath(); g.arc(bu.x + Math.cos(ang) * rr, bu.y + Math.sin(ang) * rr + kk * kk * 30, 2.4 - s2 * 0.5, 0, 6.2832); g.fill();
                }
            }
        }
        g.globalAlpha = 1;
    }
    SE.on('beat', () => {
        const now = performance.now();
        if (SE.track.id === 'even-now' && sectionE > 0.35 && now - lastBurst > 1400) {
            lastBurst = now;
            bursts.push({ x: W * (0.12 + Math.random() * 0.76), y: H * (0.1 + Math.random() * 0.2), t: now, hue: Math.random() < 0.5 ? APRICOT_HEX : PAPER });
            if (bursts.length > 4) bursts.shift();
        }
    });

    /* ---------- Say Less：海浪（6 条正弦线，低音推高浪头，副歌时海平面上涨） ---------- */
    function drawSea(now, amt, b) {
        const level = H * (0.66 - 0.12 * sectionE * amt);
        for (let i = 0; i < 6; i++) {
            const y = level + i * 26, amp = 6 + i * 2 + b.bass * 22 * amt;
            const k = 0.012 - i * 0.0012, sp = 0.0012 - i * 0.00012;
            g.globalAlpha = (1 - i * 0.12) * amt; g.lineWidth = i === 0 ? 3 : 2; g.strokeStyle = i === 0 ? MOSS : LEAF;
            g.beginPath();
            for (let x = -10; x <= W + 10; x += 8) {
                const yy = y + Math.sin(x * k + now * sp + i) * amp + Math.sin(x * k * 2.3 + now * sp * 1.7) * amp * 0.3;
                x < 0 ? g.moveTo(x, yy) : g.lineTo(x, yy);
            }
            g.stroke();
        }
        g.globalAlpha = 1;
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
        const id = SE.track.id;
        const isBridge = id === 'even-now' && amt > 0.01, isSea = id === 'say-less';
        if (isBridge && !bridge) bridge = buildBridge();
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
                if (isBridge && bridge && amt > 0.5 && y0 > bridge.colTop[c]) continue;   // 大桥下方不画天空均衡器
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
        if (isBridge) drawBridge(t, now, amt, b);
        else if (isSea && amt > 0.01) drawSea(now, amt, b);
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

    SE.on('track', () => { built = ''; sectionE = 0; levelSlow = 0; levelMax = 0.2; bursts = []; });
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
})();

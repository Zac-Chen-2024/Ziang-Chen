/* ==========================================================================
   SoundEngine：所有风格原型共用的音频引擎
   - 内置 3 首 Web Audio 实时合成的示范曲（无需任何音频文件）
   - 可载入本地音频文件 / URL，走同一个 AnalyserNode，做真实频谱分析
   - 提供 bands()/spectrum()/waveform()/节拍事件 给各个视觉方案使用
   ========================================================================== */
(function () {
    'use strict';

    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    // 示范曲：和弦用 MIDI 音高，每小节一个和弦
    const DEMO_TRACKS = [
        {
            title: '夜行 Night Drive',
            artist: 'Demo Synth',
            bpm: 100,
            color: '#ff5a36',
            chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
            kick: [0, 4, 8, 12],
            snare: [4, 12],
            hat: [2, 6, 10, 14],
            arp: false,
            lyrics: ['路灯一盏一盏往后退', '耳机里只剩下低音', '城市在后视镜里发光', '我们开往没有名字的地方']
        },
        {
            title: '晴 Clear Sky',
            artist: 'Demo Synth',
            bpm: 120,
            color: '#3aa0ff',
            chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
            kick: [0, 4, 8, 12],
            snare: [4, 12],
            hat: [0, 2, 4, 6, 8, 10, 12, 14],
            arp: true,
            lyrics: ['把窗户推开一点', '风把草稿吹满桌面', '今天的论文先放一边', '先听完这一遍']
        },
        {
            title: 'Lo-fi 房间 Room 214',
            artist: 'Demo Synth',
            bpm: 78,
            color: '#c58cff',
            chords: [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 60, 64, 67]],
            kick: [0, 10],
            snare: [8],
            hat: [0, 3, 6, 8, 11, 14],
            arp: false,
            lyrics: ['凌晨两点的实验室', '屏幕的光像一盏台灯', '代码跑着 我在发呆', '鼓点慢慢地 慢慢地']
        }
    ];

    let ctx = null;
    let bus, analyser, out, freqData, waveData, noiseBuf;
    let volume = 0.9;
    let mediaEl = null;
    let mediaSrc = null;

    // 页面先引入 shared/tracks.js 时播放真实曲目，否则退回合成示范曲
    const REAL_TRACKS = (window.ZIANG_TRACKS || []).map((t) => Object.assign(
        { type: 'media', lyrics: [] }, t, { url: (window.ZIANG_AUDIO_BASE || '') + t.file }
    ));
    const tracks = REAL_TRACKS.length ? REAL_TRACKS : DEMO_TRACKS.map((t) => Object.assign({ type: 'synth' }, t));
    let current = 0;
    let playing = false;

    // 合成器调度状态
    let schedTimer = null;
    let nextStepTime = 0;
    let step = 0;
    let synthStart = 0;
    let synthOffset = 0; // 暂停时累积的播放时长（秒）

    // 平滑后的频段与节拍检测
    const smooth = { bass: 0, mid: 0, treble: 0, level: 0 };
    let bassAvg = 0;
    let lastBeat = 0;
    let rafId = null;

    const listeners = {};
    function emit(type, detail) {
        (listeners[type] || []).forEach((fn) => {
            try { fn(detail); } catch (e) { console.error(e); }
        });
    }

    function ensureContext() {
        if (ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        bus = ctx.createGain();
        bus.gain.value = 0.8;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.78;
        // 音量节点放在分析器之后：调音量不影响可视化读数
        out = ctx.createGain();
        out.gain.value = volume;
        bus.connect(analyser);
        analyser.connect(out);
        out.connect(ctx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
        waveData = new Uint8Array(analyser.fftSize);

        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }

    function ensureMedia() {
        if (mediaEl) return;
        mediaEl = new Audio();
        mediaEl.crossOrigin = 'anonymous';
        mediaEl.preload = 'auto';
        mediaSrc = ctx.createMediaElementSource(mediaEl);
        mediaSrc.connect(bus);
        mediaEl.addEventListener('ended', () => next());
        mediaEl.addEventListener('loadedmetadata', () => emit('track', api.track));
        mediaEl.addEventListener('error', () => {
            console.warn('音频加载失败（本地预览请用 http 服务器打开，不要直接双击文件）：', mediaEl.src);
            emit('error', { track: api.track });
        });
    }

    /* ---------------- 合成器乐器 ---------------- */

    function kick(t) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        g.gain.setValueAtTime(1.0, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + 0.42);
    }

    function noiseHit(t, type, freq, dur, vol) {
        const s = ctx.createBufferSource();
        s.buffer = noiseBuf;
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        s.connect(f).connect(g).connect(bus);
        s.start(t, Math.random() * 0.5);
        s.stop(t + dur + 0.02);
    }

    function tone(t, midi, dur, type, vol, cutoff) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = mtof(midi);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = cutoff;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.08, dur * 0.2));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f).connect(g).connect(bus);
        o.start(t);
        o.stop(t + dur + 0.05);
    }

    function scheduleStep(tr, s, t) {
        const inBar = s % 16;
        const bar = Math.floor(s / 16) % tr.chords.length;
        const chord = tr.chords[bar];
        const sixteenth = 60 / tr.bpm / 4;

        if (tr.kick.includes(inBar)) kick(t);
        if (tr.snare.includes(inBar)) noiseHit(t, 'bandpass', 1800, 0.18, 0.45);
        if (tr.hat.includes(inBar)) noiseHit(t, 'highpass', 7000, 0.05, 0.18);

        if (inBar === 0) {
            chord.forEach((n) => tone(t, n, sixteenth * 16, 'triangle', 0.07, 2200));
        }
        if (inBar % 4 === 0 || inBar === 7 || inBar === 14) {
            tone(t, chord[0] - 24, sixteenth * 2.5, 'sawtooth', 0.16, 420);
        }
        if (tr.arp && inBar % 2 === 0) {
            const n = chord[(inBar / 2) % chord.length] + 12;
            tone(t, n, sixteenth * 1.6, 'square', 0.035, 3200);
        }
    }

    function scheduler() {
        const tr = tracks[current];
        const sixteenth = 60 / tr.bpm / 4;
        while (nextStepTime < ctx.currentTime + 0.12) {
            scheduleStep(tr, step, nextStepTime);
            nextStepTime += sixteenth;
            step++;
        }
    }

    function startSynth() {
        step = 0;
        nextStepTime = ctx.currentTime + 0.05;
        synthStart = ctx.currentTime + 0.05;
        synthOffset = 0;
        schedTimer = setInterval(scheduler, 25);
        scheduler();
    }


    // 从指定秒数开始调度（用于进度跳转）
    function startSynthAt(sec) {
        const tr = tracks[current];
        const sixteenth = 60 / tr.bpm / 4;
        step = Math.floor(sec / sixteenth);
        nextStepTime = ctx.currentTime + 0.05;
        synthStart = nextStepTime - step * sixteenth;
        schedTimer = setInterval(scheduler, 25);
        scheduler();
    }

    function stopSynth() {
        if (schedTimer) clearInterval(schedTimer);
        schedTimer = null;
        synthOffset = Math.max(0, ctx.currentTime - synthStart);
    }

    /* ---------------- 分析 ---------------- */

    function bandAvg(lo, hi) {
        const binHz = ctx.sampleRate / analyser.fftSize;
        const a = Math.max(1, Math.floor(lo / binHz));
        const b = Math.min(freqData.length - 1, Math.ceil(hi / binHz));
        let sum = 0;
        for (let i = a; i <= b; i++) sum += freqData[i];
        return sum / ((b - a + 1) * 255);
    }

    function tick() {
        rafId = requestAnimationFrame(tick);
        if (!ctx) return;
        analyser.getByteFrequencyData(freqData);
        const raw = {
            bass: bandAvg(20, 160),
            mid: bandAvg(160, 2000),
            treble: bandAvg(2000, 10000)
        };
        raw.level = raw.bass * 0.5 + raw.mid * 0.35 + raw.treble * 0.15;
        for (const k in raw) {
            const rate = raw[k] > smooth[k] ? 0.55 : 0.12;
            smooth[k] += (raw[k] - smooth[k]) * rate;
        }
        bassAvg += (raw.bass - bassAvg) * 0.05;
        const now = performance.now();
        if (playing && raw.bass > 0.28 && raw.bass > bassAvg * 1.18 && now - lastBeat > 280) {
            lastBeat = now;
            emit('beat', { strength: raw.bass });
        }
    }

    /* ---------------- 播放控制 ---------------- */

    function play(index) {
        ensureContext();
        if (ctx.state === 'suspended') ctx.resume();
        if (typeof index === 'number' && index !== current) {
            stopAll();
            current = (index + tracks.length) % tracks.length;
            synthOffset = 0;
            if (mediaEl) mediaEl.currentTime = 0;
            emit('track', api.track);
        } else if (playing) {
            return;
        }
        const tr = tracks[current];
        if (tr.type === 'synth') {
            if (synthOffset > 0) { stopSynthTimerOnly(); startSynthAt(synthOffset); } else startSynth();
        } else {
            ensureMedia();
            loadMedia(tr);
            mediaEl.play().catch((e) => console.warn('无法播放该音频：', e));
        }
        playing = true;
        if (!rafId) tick();
        emit('state', { playing });
    }

    function loadMedia(tr) {
        if (mediaEl.src !== tr.url) mediaEl.src = tr.url;
    }

    function stopSynthTimerOnly() {
        if (schedTimer) clearInterval(schedTimer);
        schedTimer = null;
    }

    function stopAll() {
        if (schedTimer) stopSynth();
        if (mediaEl) mediaEl.pause();
    }

    function pause() {
        if (!playing) return;
        stopAll();
        playing = false;
        emit('state', { playing });
    }

    function toggle() { playing ? pause() : play(); }

    // 跳转到第 sec 秒；合成曲按循环长度取模
    function seek(sec) {
        const tr = tracks[current];
        const dur = position().duration;
        if (!dur) return;
        sec = Math.max(0, Math.min(sec, dur - 0.05));
        if (tr.type === 'synth') {
            ensureContext();
            if (playing) {
                if (schedTimer) clearInterval(schedTimer);
                schedTimer = null;
                startSynthAt(sec);
            } else {
                const sixteenth = 60 / tr.bpm / 4;
                synthOffset = Math.floor(sec / sixteenth) * sixteenth;
            }
        } else {
            ensureContext();
            ensureMedia();
            loadMedia(tr);
            mediaEl.currentTime = sec;
        }
        emit('seek', { time: sec });
    }

    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
        if (out) out.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
        emit('volume', { volume });
    }
    function next() { const was = playing; play(current + 1); if (!was) pause(); }
    function prev() { const was = playing; play(current - 1); if (!was) pause(); }

    function addFiles(fileList) {
        const added = [];
        Array.from(fileList || []).forEach((f) => {
            if (!f.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(f.name)) return;
            tracks.push({
                type: 'media',
                title: f.name.replace(/\.[^.]+$/, ''),
                artist: '本地音频',
                url: URL.createObjectURL(f),
                color: '#ffffff',
                lyrics: []
            });
            added.push(tracks.length - 1);
        });
        emit('tracks', tracks);
        if (added.length) play(added[0]);
        return added;
    }

    function addUrl(url, title, artist) {
        tracks.push({ type: 'media', title: title || url, artist: artist || '', url, color: '#ffffff', lyrics: [] });
        emit('tracks', tracks);
        return tracks.length - 1;
    }

    // 打开系统文件选择框，载入本地音频
    let picker = null;
    function pickFiles() {
        if (!picker) {
            picker = document.createElement('input');
            picker.type = 'file';
            picker.accept = 'audio/*';
            picker.multiple = true;
            picker.hidden = true;
            picker.addEventListener('change', () => { addFiles(picker.files); picker.value = ''; });
            document.body.appendChild(picker);
        }
        picker.click();
    }

    // 当前播放位置（秒）与时长；合成曲按 8 小节一轮循环
    function position() {
        const tr = tracks[current];
        if (tr.type === 'synth') {
            const loop = (60 / tr.bpm) * 4 * 8;
            const t = !ctx ? 0 : playing ? ctx.currentTime - synthStart : synthOffset;
            return { time: Math.max(0, t) % loop, duration: loop };
        }
        const loaded = mediaEl && mediaEl.src === tr.url;
        return {
            time: loaded ? mediaEl.currentTime || 0 : 0,
            duration: (loaded && isFinite(mediaEl.duration) && mediaEl.duration) || tr.duration || 0
        };
    }

    // 示范歌词：每 2 小节一句
    function lyric() {
        const tr = tracks[current];
        if (!tr.lyrics || !tr.lyrics.length || tr.type !== 'synth') return { index: -1, text: '', lines: tr.lyrics || [] };
        const barSec = (60 / tr.bpm) * 4;
        const idx = Math.floor(position().time / (barSec * 2)) % tr.lyrics.length;
        return { index: idx, text: tr.lyrics[idx], lines: tr.lyrics };
    }

    function spectrum() {
        if (ctx) analyser.getByteFrequencyData(freqData);
        return freqData || new Uint8Array(1024);
    }

    function waveform() {
        if (ctx) analyser.getByteTimeDomainData(waveData);
        return waveData || new Uint8Array(2048).fill(128);
    }

    const api = {
        get tracks() { return tracks; },
        get current() { return current; },
        get track() { return tracks[current]; },
        get playing() { return playing; },
        get context() { return ctx; },
        play, pause, toggle, next, prev, seek, setVolume,
        get volume() { return volume; },
        addFiles, addUrl, pickFiles,
        position, lyric, spectrum, waveform,
        bands: () => Object.assign({}, smooth),
        on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); return api; },
        // 低音频段的“伪节拍”值 0..1，即使未播放也有微弱呼吸，方便做 idle 动画
        pulse(t) { return playing ? smooth.bass : 0.06 + 0.04 * Math.sin((t || performance.now()) / 900); }
    };

    window.SoundEngine = api;
})();

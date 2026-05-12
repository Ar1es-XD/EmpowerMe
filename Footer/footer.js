(() => {
    'use strict';

    const body = document.body;
    const storedTheme = localStorage.getItem('empowerme-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    body.classList.toggle('dark', theme === 'dark');

    const ROWS = 15;
    const RADIUS = 3.2;
    const BASE_A = 0.12;
    const CURSOR_R = 160;
    const DISPLAY_MS = 3800;
    const FADE_MS = 950;

    const footer = document.querySelector('.site-footer');
    const canvas = document.getElementById('dot-canvas');
    if (!footer || !canvas) return;

    const ctx = canvas.getContext('2d');

    let dots = [];
    let mouse = { x: -9999, y: -9999 };
    let brightnessMaps = [];
    let curIdx = 0;
    let nextIdx = 1;
    let fadeT = 1;
    let lastSwitch = 0;
    let started = false;
    let color = { r: 31, g: 111, b: 235 };

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    function parseColor(value) {
        const trimmed = value.trim();
        if (trimmed.startsWith('rgb')) {
            const nums = trimmed.match(/\d+/g) || [];
            return {
                r: Number(nums[0] || 31),
                g: Number(nums[1] || 111),
                b: Number(nums[2] || 235)
            };
        }
        if (trimmed.startsWith('#')) {
            let hex = trimmed.slice(1);
            if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
            const num = parseInt(hex, 16);
            return {
                r: (num >> 16) & 255,
                g: (num >> 8) & 255,
                b: num & 255
            };
        }
        return { r: 31, g: 111, b: 235 };
    }

    function syncDotColor() {
        const dotColor = getComputedStyle(footer).getPropertyValue('--dot-color') || '#1f6feb';
        color = parseColor(dotColor);
    }

    function getXY(nx, ny) {
        const x = (nx - 0.5) * 2.0;
        const y = (ny - 0.5) * 2.0;
        return { x, y };
    }

    const procs = [
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const head = Math.abs(x - 0.35) < 0.2 && Math.abs(y + 0.1) < 0.12;
            const handle = Math.abs(y - 0.22) < 0.08 && x > -0.7 && x < 0.18;
            const grip = (x + 0.65) ** 2 + (y - 0.22) ** 2 < 0.03;
            return (head || handle || grip) ? 1 : 0;
        },
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const stem = Math.abs(x) < 0.06 && y > -0.5 && y < 0.65;
            const beam = Math.abs(y + 0.3) < 0.07 && Math.abs(x) < 0.65;
            const panLeft = (x + 0.5) ** 2 + (y + 0.1) ** 2 < 0.09;
            const panRight = (x - 0.5) ** 2 + (y + 0.1) ** 2 < 0.09;
            return (stem || beam || panLeft || panRight) ? 1 : 0;
        },
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const left = x > -0.75 && x < -0.05 && y > -0.6 && y < 0.6;
            const right = x > 0.05 && x < 0.75 && y > -0.6 && y < 0.6;
            const spine = Math.abs(x) < 0.08 && y > -0.6 && y < 0.6;
            return (left || right || spine) ? 1 : 0;
        },
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const sx = x * 1.1;
            const sy = y * 1.1;
            const heart = Math.pow(sx * sx + sy * sy - 1, 3) - sx * sx * sy * sy * sy;
            return heart <= 0 ? 1 : 0;
        },
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const head = x * x + (y + 0.6) * (y + 0.6) < 0.08;
            const body = Math.abs(x) < 0.28 && y > -0.35 && y < 0.6;
            const skirt = Math.abs(x) + (y - 0.6) * 0.8 < 0.55;
            const sword = Math.abs(x - 0.55) < 0.05 && y > -0.55 && y < 0.7;
            return (head || body || skirt || sword) ? 1 : 0;
        }
    ];

    function mapFromProc(fn) {
        const map = new Float32Array(dots.length);
        dots.forEach((dot, i) => { map[i] = fn(dot.nx, dot.ny); });
        return map;
    }

    function buildAllMaps() {
        brightnessMaps = [];
        procs.forEach((fn) => brightnessMaps.push(mapFromProc(fn)));
        curIdx = 0;
        nextIdx = 1 % brightnessMaps.length;
        fadeT = 1;
        lastSwitch = performance.now();
        started = true;
    }

    function setupCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight || 280;
        dots = [];

        const rows = ROWS;
        const spacing = canvas.height / (rows + 1);
        const cols = Math.max(12, Math.floor(canvas.width / spacing) - 1);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dots.push({
                    x: (c + 1) * spacing,
                    y: (r + 1) * spacing,
                    nx: (c + 1) / (cols + 1),
                    ny: (r + 1) / (rows + 1)
                });
            }
        }

        buildAllMaps();
    }

    function getBrightness(i) {
        const a = brightnessMaps[curIdx] ? brightnessMaps[curIdx][i] : 0;
        const b = brightnessMaps[nextIdx] ? brightnessMaps[nextIdx][i] : 0;
        return a * (1 - fadeT) + b * fadeT;
    }

    function draw(ts) {
        requestAnimationFrame(draw);
        if (!started || !dots.length) return;

        const elapsed = ts - lastSwitch;
        if (elapsed > DISPLAY_MS) {
            curIdx = nextIdx;
            nextIdx = (nextIdx + 1) % brightnessMaps.length;
            lastSwitch = ts;
            fadeT = 0;
        } else if (elapsed > DISPLAY_MS - FADE_MS) {
            fadeT = clamp((elapsed - (DISPLAY_MS - FADE_MS)) / FADE_MS, 0, 1);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const mx = mouse.x;
        const my = mouse.y;

        for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            const dx = dot.x - mx;
            const dy = dot.y - my;
            const dist = Math.hypot(dx, dy);
            const cf = dist < CURSOR_R ? Math.pow(1 - dist / CURSOR_R, 2) : 0;
            const pf = getBrightness(i);
            const alpha = Math.min(1, BASE_A + cf * 0.9 + pf * 0.85);
            const dotRadius = Math.max(1.2, RADIUS * (1 - cf * 0.6));

            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setupCanvas();
            syncDotColor();
        }, 120);
    });

    syncDotColor();
    setupCanvas();
    requestAnimationFrame(draw);
})();

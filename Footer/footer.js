(() => {
    'use strict';

    const body = document.body;
    const storedTheme = localStorage.getItem('empowerme-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    body.classList.toggle('dark', theme === 'dark');

    const ROWS = 20;
    const RADIUS = 4.1;
    const BASE_A = 0.16;
    const CURSOR_R = 190;
    const DISPLAY_MS = 4200;
    const FADE_MS = 2400;

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

    function easeInOut(t) {
        return t * t * (3 - 2 * t);
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
        // Scales
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const stem = Math.abs(x) < 0.07 && y > -0.7 && y < 0.75;
            const beam = Math.abs(y + 0.3) < 0.08 && Math.abs(x) < 0.75;
            const panLeft = (x + 0.58) ** 2 + (y + 0.05) ** 2 < 0.13;
            const panRight = (x - 0.58) ** 2 + (y + 0.05) ** 2 < 0.13;
            const base = Math.abs(y - 0.75) < 0.07 && Math.abs(x) < 0.3;
            return (stem || beam || panLeft || panRight) ? 1 : 0;
        },
        // Shield
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const top = Math.abs(y + 0.62) < 0.1 && Math.abs(x) < 0.5;
            const sides = Math.abs(x) < 0.5 && y > -0.6 && y < 0.35;
            const tip = Math.abs(x) + (y - 0.62) * 1.25 < 0.5;
            return top || (sides && y < 0.35) || tip ? 1 : 0;
        },
        // Torch
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const flame = (x * x) / 0.14 + ((y + 0.65) * (y + 0.65)) / 0.18 < 1;
            const flameTip = (x * x) / 0.08 + ((y + 0.78) * (y + 0.78)) / 0.08 < 1;
            const neck = Math.abs(y + 0.22) < 0.07 && Math.abs(x) < 0.18;
            const handle = Math.abs(x) < 0.09 && y > -0.05 && y < 0.75;
            const base = Math.abs(y - 0.05) < 0.08 && Math.abs(x) < 0.24;
            return flame || flameTip || neck || handle || base ? 1 : 0;
        },
        // Network nodes
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const core = x * x + y * y < 0.14;
            const tl = (x + 0.45) ** 2 + (y + 0.45) ** 2 < 0.08;
            const tr = (x - 0.45) ** 2 + (y + 0.45) ** 2 < 0.08;
            const bl = (x + 0.45) ** 2 + (y - 0.45) ** 2 < 0.08;
            const br = (x - 0.45) ** 2 + (y - 0.45) ** 2 < 0.08;
            const linkH = Math.abs(y) < 0.07 && Math.abs(x) < 0.45;
            const linkV = Math.abs(x) < 0.07 && Math.abs(y) < 0.45;
            return core || tl || tr || bl || br || linkH || linkV ? 1 : 0;
        },
        // Open door
        function (nx, ny) {
            const { x, y } = getXY(nx, ny);
            const left = Math.abs(x + 0.45) < 0.09 && y > -0.75 && y < 0.75;
            const top = Math.abs(y + 0.75) < 0.07 && x > -0.45 && x < 0.45;
            const base = Math.abs(y - 0.75) < 0.07 && x > -0.45 && x < 0.45;
            const door = x > -0.05 && x < 0.5 && y > -0.6 && y < 0.6;
            const gap = x > -0.05 && x < 0.12 && y > -0.6 && y < 0.6;
            const knob = (x + 0.02) ** 2 + (y - 0.05) ** 2 < 0.02;
            return left || top || base || (door && !gap) || knob ? 1 : 0;
        }
    ];

    const CENTER_BOUNDS = {
        xMin: 0.34,
        xMax: 0.66,
        yMin: 0.2,
        yMax: 0.8
    };

    function mapFromProc(fn) {
        const map = new Float32Array(dots.length);
        const width = CENTER_BOUNDS.xMax - CENTER_BOUNDS.xMin;
        const height = CENTER_BOUNDS.yMax - CENTER_BOUNDS.yMin;
        dots.forEach((dot, i) => {
            if (
                dot.nx < CENTER_BOUNDS.xMin || dot.nx > CENTER_BOUNDS.xMax ||
                dot.ny < CENTER_BOUNDS.yMin || dot.ny > CENTER_BOUNDS.yMax
            ) {
                map[i] = 0;
                return;
            }
            const nx = (dot.nx - CENTER_BOUNDS.xMin) / width;
            const ny = (dot.ny - CENTER_BOUNDS.yMin) / height;
            map[i] = fn(nx, ny);
        });
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
        const cols = Math.max(16, Math.floor(canvas.width / spacing) - 1);

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
            const rawT = clamp((elapsed - (DISPLAY_MS - FADE_MS)) / FADE_MS, 0, 1);
            fadeT = easeInOut(rawT);
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
            const alpha = Math.min(1, BASE_A + cf * 0.5 + pf * 0.85);
            const dotRadius = Math.max(1.6, RADIUS * (1 - cf * 0.45));

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

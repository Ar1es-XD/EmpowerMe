(() => {
    'use strict';

    const body = document.body;
    const storedTheme = localStorage.getItem('empowerme-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    body.classList.toggle('dark', theme === 'dark');

    const SPACING = 20;
    const DOT_SIZE = 7.6;
    const RADIUS = DOT_SIZE / 2;
    const BASE_A = 0.16;
    const CURSOR_R = 170;
    const DISPLAY_MS = 4000;
    const FADE_MS = 900;

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

    const SVG_SPACING = 20;
    const SVG_ORIGIN_X = 20;
    const SVG_ORIGIN_Y = 40;
    const SVG_COLS = 78;
    const SVG_ROWS = 16;
    let gridCols = 0;
    let gridRows = 0;

    function toGrid(x, y) {
        const col = Math.round((x - SVG_ORIGIN_X) / SVG_SPACING);
        const row = Math.round((y - SVG_ORIGIN_Y) / SVG_SPACING);
        return { col, row };
    }

    function makeShape(points) {
        const cols = points.map((p) => p.col);
        const rows = points.map((p) => p.row);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);
        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);
        return {
            points,
            centerX: (minCol + maxCol) / 2,
            centerY: (minRow + maxRow) / 2
        };
    }

    const shapes = [
        makeShape([
            toGrid(720, 120), toGrid(760, 100), toGrid(800, 90), toGrid(840, 100), toGrid(880, 120),
            toGrid(700, 140), toGrid(740, 140), toGrid(780, 140), toGrid(820, 140), toGrid(860, 140), toGrid(900, 140),
            toGrid(700, 180), toGrid(740, 180), toGrid(780, 180), toGrid(820, 180), toGrid(860, 180), toGrid(900, 180),
            toGrid(720, 220), toGrid(760, 220), toGrid(800, 220), toGrid(840, 220), toGrid(880, 220),
            toGrid(740, 260), toGrid(780, 260), toGrid(820, 260), toGrid(860, 260),
            toGrid(760, 300), toGrid(800, 300), toGrid(840, 300),
            toGrid(800, 340)
        ]),
        makeShape([
            toGrid(800, 90),
            toGrid(700, 130), toGrid(740, 130), toGrid(780, 130), toGrid(820, 130), toGrid(860, 130), toGrid(900, 130),
            toGrid(800, 170), toGrid(800, 210), toGrid(800, 250), toGrid(800, 290),
            toGrid(740, 170), toGrid(720, 210),
            toGrid(860, 170), toGrid(880, 210),
            toGrid(680, 250), toGrid(720, 250), toGrid(760, 250),
            toGrid(700, 290), toGrid(720, 290), toGrid(740, 290),
            toGrid(840, 250), toGrid(880, 250), toGrid(920, 250),
            toGrid(860, 290), toGrid(880, 290), toGrid(900, 290),
            toGrid(760, 340), toGrid(800, 340), toGrid(840, 340)
        ]),
        makeShape([
            toGrid(820, 90),
            toGrid(800, 110), toGrid(840, 110),
            toGrid(780, 140), toGrid(820, 140), toGrid(850, 140),
            toGrid(790, 170), toGrid(820, 170), toGrid(850, 170),
            toGrid(790, 210), toGrid(820, 210), toGrid(850, 210),
            toGrid(800, 250), toGrid(790, 290), toGrid(780, 330)
        ]),
        makeShape([
            toGrid(800, 220),
            toGrid(740, 170),
            toGrid(860, 150),
            toGrid(920, 220),
            toGrid(860, 310),
            toGrid(700, 270)
        ]),
        makeShape([
            toGrid(740, 120), toGrid(780, 120), toGrid(820, 120), toGrid(860, 120),
            toGrid(740, 160), toGrid(740, 200), toGrid(740, 240), toGrid(740, 280),
            toGrid(860, 160), toGrid(860, 200), toGrid(860, 240), toGrid(860, 280),
            toGrid(820, 160), toGrid(840, 190), toGrid(840, 230), toGrid(820, 260),
            toGrid(830, 210)
        ])
    ];

    function mapFromShape(shape) {
        const map = new Float32Array(dots.length);
        const scaleX = (gridCols - 1) / (SVG_COLS - 1);
        const scaleY = (gridRows - 1) / (SVG_ROWS - 1);
        const scaledPoints = shape.points.map((p) => ({
            col: Math.round(p.col * scaleX),
            row: Math.round(p.row * scaleY)
        }));
        const cols = scaledPoints.map((p) => p.col);
        const rows = scaledPoints.map((p) => p.row);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);
        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);
        const centerX = (minCol + maxCol) / 2;
        const centerY = (minRow + maxRow) / 2;
        const offsetX = Math.round((gridCols - 1) / 2 - centerX);
        const offsetY = Math.round((gridRows - 1) / 2 - centerY);
        const keySet = new Set(scaledPoints.map((p) => `${p.col},${p.row}`));

        dots.forEach((dot, i) => {
            const key = `${dot.col - offsetX},${dot.row - offsetY}`;
            map[i] = keySet.has(key) ? 1 : 0;
        });
        return map;
    }

    function buildAllMaps() {
        brightnessMaps = [];
        shapes.forEach((shape) => brightnessMaps.push(mapFromShape(shape)));
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

        const padding = Math.max(6, RADIUS + 2);
        const usableHeight = Math.max(1, canvas.height - padding * 2);
        const usableWidth = Math.max(1, canvas.width - padding * 2);
        const rows = Math.max(2, Math.floor(usableHeight / SPACING) + 1);
        const cols = Math.max(16, Math.floor(usableWidth / SPACING) + 1);
        gridRows = rows;
        gridCols = cols;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dots.push({
                    x: padding + c * SPACING,
                    y: padding + r * SPACING,
                    col: c,
                    row: r,
                    nx: cols > 1 ? c / (cols - 1) : 0.5,
                    ny: rows > 1 ? r / (rows - 1) : 0.5
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
            const cf = CURSOR_R > 0 && dist < CURSOR_R ? Math.pow(1 - dist / CURSOR_R, 2) : 0;
            const pf = getBrightness(i);
            const dotRadius = RADIUS;

            const baseAlpha = Math.min(1, BASE_A + cf * 0.28);
            ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            if (pf > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, pf + cf * 0.25).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
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

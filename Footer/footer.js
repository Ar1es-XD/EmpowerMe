(() => {
    'use strict';

    const body = document.body;
    const storedTheme = localStorage.getItem('empowerme-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    body.classList.toggle('dark', theme === 'dark');

    const SPACING   = 20;
    const DOT_SIZE  = 7.6;
    const RADIUS    = DOT_SIZE / 2;
    const BASE_A    = 0.16;
    const CURSOR_R  = 170;
    const SCROLL_SPEED = 0.014; // cols per ms  (≈ 1 col per 25ms → smooth)

    const footer = document.querySelector('.site-footer');
    const canvas = document.getElementById('dot-canvas');
    if (!footer || !canvas) return;
    const ctx = canvas.getContext('2d');

    let dots       = [];
    let mouse      = { x: -9999, y: -9999 };
    let gridCols   = 0;
    let gridRows   = 0;
    // scrollX: fractional column offset. Content is painted at col = contentCol - scrollX
    let scrollX    = 0;
    let lastTs     = null;

    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    // ─── 5×7 dot-font glyphs (col-major bitmask, 5 cols × 7 rows) ────────────
    // Each glyph is an array of 5 numbers, one per column.
    // Bit 0 = top row, bit 6 = bottom row.
    const GLYPH_H = 9; // rows used by font
    const GLYPH_W = 5; // cols per glyph
    const GLYPH_GAP = 1; // cols between glyphs

    // 9-row bitmask font  (bit0 = row0 = top)
    const FONT = {
        'E': [0b111111111, 0b100000001, 0b100000001, 0b111110001, 0b100000001, 0b100000001, 0b111111111],
        // Wait - let me use row-based: each char = array of 9 row strings of width 5
        // Actually use a simple per-row approach below
    };

    // Simple 5-wide × 9-tall pixel font, row strings
    const FONT5 = {
        'E': ['#####','#....','#....','####.','#....','#....','#####','#....','#....'].slice(0,9),
        'M': ['#...#','##.##','#.#.#','#...#','#...#','#...#','#...#','#...#','#...#'],
        'p': ['#####','#...#','#...#','#####','#....','#....','#....','#....','#....'],
        'o': ['.###.','#...#','#...#','#...#','#...#','#...#','.###.','#...#','#...#'],
        'w': ['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#','#...#','#...#'],
        'e': ['.###.','#...#','#...#','#####','#....','#....','.###.','#...#','#...#'],
        'r': ['#.###','##...','#....','#....','#....','#....','#....','#....','#....'],
        'M2':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#','#...#','#...#'],
    };

    // Better approach: define each letter as array of row strings (5 wide, 9 tall)
    const LETTERS = {
        'E': [
            '#####',
            '#....',
            '#....',
            '####.',
            '#....',
            '#....',
            '#####',
            '.....',
            '.....',
        ],
        'm': [
            '.....',
            '.....',
            '#.#.#', // wait - 'm' is lowercase, 5 wide is tricky
            '##.##',
            '#.#.#',
            '#.#.#',
            '#.#.#',
            '.....',
            '.....',
        ],
        'p': [
            '.....',
            '.....',
            '####.',
            '#...#',
            '#...#',
            '####.',
            '#....',
            '#....',
            '#....',
        ],
        'o': [
            '.....',
            '.....',
            '.###.',
            '#...#',
            '#...#',
            '#...#',
            '.###.',
            '.....',
            '.....',
        ],
        'w': [
            '.....',
            '.....',
            '#...#',
            '#...#',
            '#.#.#',
            '##.##',
            '#...#',
            '.....',
            '.....',
        ],
        'e': [
            '.....',
            '.....',
            '.###.',
            '#...#',
            '#####',
            '#....',
            '.###.',
            '.....',
            '.....',
        ],
        'r': [
            '.....',
            '.....',
            '#.##.',
            '##...',
            '#....',
            '#....',
            '#....',
            '.....',
            '.....',
        ],
        'M': [
            '#...#',
            '##.##',
            '#.#.#',
            '#...#',
            '#...#',
            '#...#',
            '#...#',
            '.....',
            '.....',
        ],
        'v': [
            '.....',
            '.....',
            '#...#',
            '#...#',
            '#...#',
            '.#.#.',
            '..#..',
            '.....',
            '.....',
        ],
    };

    // Build a glyph bitmap: array of {dc, dr} offsets (top-left = 0,0)
    function glyphDots(char) {
        const rows = LETTERS[char];
        if (!rows) return [];
        const pts = [];
        rows.forEach((row, r) => {
            for (let c = 0; c < row.length; c++)
                if (row[c] === '#') pts.push({ dc: c, dr: r });
        });
        return pts;
    }

    // ─── Scales of justice shape ───────────────────────────────────────────────
    // Defined as {dc, dr} offsets within a bounding box.
    // We'll make it roughly 13 cols wide × 13 rows tall.
    // The canvas grid has ~21 rows; we want to vertically centre the content.

    const SCALES_W = 13; // cols wide
    const SCALES_H = 13; // rows tall (will be centred vertically)

    function buildScalesDots() {
        const pts = [];

        // Helper to add filled rect within scales coords
        function rect(c0, r0, c1, r1) {
            for (let r = r0; r <= r1; r++)
                for (let c = c0; c <= c1; c++)
                    pts.push({ dc: c, dr: r });
        }
        function ellipse(cx, cy, rx, ry) {
            const c0 = Math.floor(cx - rx), c1 = Math.ceil(cx + rx);
            const r0 = Math.floor(cy - ry), r1 = Math.ceil(cy + ry);
            for (let r = r0; r <= r1; r++)
                for (let c = c0; c <= c1; c++) {
                    const dx = (c - cx) / (rx || 0.5), dy = (r - cy) / (ry || 0.5);
                    if (dx * dx + dy * dy <= 1.0) pts.push({ dc: c, dr: r });
                }
        }
        function line(c0, r0, c1, r1, hw) {
            const steps = Math.ceil(Math.hypot(c1 - c0, r1 - r0) * 3);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const c = Math.round(c0 + (c1 - c0) * t);
                const r = Math.round(r0 + (r1 - r0) * t);
                for (let dr = -hw; dr <= hw; dr++)
                    for (let dc = -hw; dc <= hw; dc++)
                        pts.push({ dc: c + dc, dr: r + dr });
            }
        }

        // Pivot knob (top centre)
        ellipse(6, 0.5, 1.2, 0.8);

        // Horizontal beam
        rect(0, 1, 12, 2);

        // Centre pole
        rect(5, 2, 7, 8);

        // Left chain: from (3,2) down to (2,5)
        line(3, 2, 2, 5, 0);

        // Right chain: from (9,2) down to (10,5)
        line(9, 2, 10, 5, 0);

        // Left pan
        rect(0, 5, 4, 6);
        ellipse(2, 6.5, 2, 0.7);

        // Right pan
        rect(8, 5, 12, 6);
        ellipse(10, 6.5, 2, 0.7);

        // Base
        rect(3, 8, 9, 9);
        rect(2, 9, 10, 10);

        // Deduplicate
        const seen = new Set();
        return pts.filter(p => {
            const k = `${p.dc},${p.dr}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    }

    const SCALES_DOTS = buildScalesDots();

    // ─── Build the full marquee content strip ──────────────────────────────────
    // Content: [scales] [gap] [E][m][p][o][w][e][r][M][e] [gap] [scales]
    // Each element: { dots: [{dc,dr}], width: cols }

    const GAP = 3; // cols between elements
    const FONT_ROW_OFFSET = 2; // push font down to vertically align with scales

    function buildContentStrip() {
        // segments: array of { dots: [{dc,dr}], width }
        const segments = [];

        // Scales
        segments.push({ dots: SCALES_DOTS, width: SCALES_W });
        segments.push({ dots: [], width: GAP });

        // Text: "EmpowerMe"
        // Use our LETTERS map; key per character
        const text = ['E', 'm', 'p', 'o', 'w', 'e', 'r', 'M', 'e'];
        text.forEach(ch => {
            const glyph = glyphDots(ch);
            // shift glyph down so it's vertically centred relative to scales
            const shifted = glyph.map(p => ({ dc: p.dc, dr: p.dr + FONT_ROW_OFFSET }));
            segments.push({ dots: shifted, width: GLYPH_W });
            segments.push({ dots: [], width: GLYPH_GAP });
        });

        segments.push({ dots: [], width: GAP });

        // Second scales
        segments.push({ dots: SCALES_DOTS, width: SCALES_W });

        // Trailing gap so repeat joins smoothly
        segments.push({ dots: [], width: GAP + 4 });

        // Flatten to a single list of {dc, dr} with cumulative column offset
        const allDots = [];
        let col = 0;
        segments.forEach(seg => {
            seg.dots.forEach(p => allDots.push({ dc: p.dc + col, dr: p.dr }));
            col += seg.width;
        });

        return { dots: allDots, totalWidth: col };
    }

    let strip = null; // { dots, totalWidth }

    // ─── Canvas setup ──────────────────────────────────────────────────────────

    function setupCanvas() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight || 280;
        dots = [];

        const padding  = Math.max(6, RADIUS + 2);
        const usableH  = Math.max(1, canvas.height - padding * 2);
        const usableW  = Math.max(1, canvas.width  - padding * 2);
        const rows = Math.max(2, Math.floor(usableH / SPACING) + 1);
        const cols = Math.max(16, Math.floor(usableW / SPACING) + 1);
        gridRows = rows;
        gridCols = cols;

        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                dots.push({
                    x: padding + c * SPACING,
                    y: padding + r * SPACING,
                    col: c, row: r,
                });

        strip = buildContentStrip();
        // Start scrollX so content begins just off the left edge
        scrollX = 0;
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    // Vertical centre offset: place content in middle of grid rows
    function getRowOffset() {
        // content height: scales is 11 rows, font is 9 rows — max ~11
        const contentH = SCALES_H;
        return Math.max(0, Math.round((gridRows - contentH) / 2));
    }

    function draw(ts) {
        requestAnimationFrame(draw);
        if (!strip) return;

        // Advance scroll
        if (lastTs !== null) {
            const dt = ts - lastTs;
            scrollX += SCROLL_SPEED * dt;
            if (scrollX >= strip.totalWidth) scrollX -= strip.totalWidth; // seamless loop
        }
        lastTs = ts;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const mx = mouse.x, my = mouse.y;
        const rowOff = getRowOffset();

        // Build a Set of lit (col, row) for this frame
        const litSet = new Set();
        const sw = strip.totalWidth;

        strip.dots.forEach(p => {
            // Draw at two positions for seamless loop: current and current+totalWidth
            for (let repeat = 0; repeat < 2; repeat++) {
                const gc = Math.round(p.dc - scrollX + repeat * sw);
                const gr = rowOff + p.dr;
                if (gc >= 0 && gc < gridCols && gr >= 0 && gr < gridRows)
                    litSet.add(`${gc},${gr}`);
            }
        });

        for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            const dist = Math.hypot(dot.x - mx, dot.y - my);
            const cf   = CURSOR_R > 0 && dist < CURSOR_R
                ? Math.pow(1 - dist / CURSOR_R, 2) : 0;
            const lit  = litSet.has(`${dot.col},${dot.row}`) ? 1 : 0;

            const baseA = Math.min(1, BASE_A + cf * 0.28);
            ctx.fillStyle = `rgba(255,255,255,${baseA.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
            ctx.fill();

            if (lit > 0) {
                const a = Math.min(1, 1.0 + cf * 0.25);
                ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { setupCanvas(); lastTs = null; }, 120);
    });

    setupCanvas();
    requestAnimationFrame(draw);
})();
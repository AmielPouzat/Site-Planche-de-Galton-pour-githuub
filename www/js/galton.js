(function initGaltonModule(globalScope) {
    const EPSILON = 1e-12;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function binomialCoefficient(n, k) {
        const kk = Math.min(k, n - k);
        if (kk < 0) return 0;

        let result = 1;
        for (let i = 1; i <= kk; i += 1) {
            result = result * (n - kk + i) / i;
        }
        return result;
    }

    function binomialProbability(n, k, p) {
        if (k < 0 || k > n) return 0;
        if (p <= 0) return k === 0 ? 1 : 0;
        if (p >= 1) return k === n ? 1 : 0;
        return binomialCoefficient(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }

    function erf(value) {
        const sign = value < 0 ? -1 : 1;
        const x = Math.abs(value);
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const t = 1 / (1 + 0.3275911 * x);
        const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    function normalCdf(value, meanValue = 0, standardDeviation = 1) {
        if (standardDeviation <= 0) {
            return value < meanValue ? 0 : 1;
        }
        return 0.5 * (1 + erf((value - meanValue) / (standardDeviation * Math.SQRT2)));
    }

    function normalIntervalProbability(n, k, p) {
        const meanValue = n * p;
        const variance = n * p * (1 - p);
        const standardDeviation = Math.sqrt(variance);
        const left = k === 0 ? -Infinity : k - 0.5;
        const right = k === n ? Infinity : k + 0.5;
        return normalCdf(right, meanValue, standardDeviation) - normalCdf(left, meanValue, standardDeviation);
    }

    function normalExpectedCounts(n, p, ballCount) {
        const raw = Array.from({ length: n + 1 }, (_, k) => normalIntervalProbability(n, k, p) * ballCount);
        const total = raw.reduce((sum, value) => sum + value, 0);
        if (total <= 0) return raw;
        return raw.map((value) => value * ballCount / total);
    }

    function expectedCounts(n, p, ballCount, model = 'binomial') {
        if (model === 'normal') {
            return normalExpectedCounts(n, p, ballCount);
        }
        return Array.from({ length: n + 1 }, (_, k) => binomialProbability(n, k, p) * ballCount);
    }

    function slotIntervalLabel(n, slot) {
        if (slot === 0) return ']-∞ ; 0,5]';
        if (slot === n) return `[${n - 0.5} ; +∞[`;
        return `[${slot - 0.5} ; ${slot + 0.5}]`;
    }

    function simulateSlot(n, p, random = Math.random) {
        let rights = 0;
        const choices = [];
        for (let i = 0; i < n; i += 1) {
            const right = random() < p;
            if (right) rights += 1;
            choices.push(right ? 1 : 0);
        }
        return { rights, choices };
    }

    function simulateCounts(n, p, ballCount, random = Math.random) {
        const counts = Array(n + 1).fill(0);
        for (let i = 0; i < ballCount; i += 1) {
            counts[simulateSlot(n, p, random).rights] += 1;
        }
        return counts;
    }

    function mean(values) {
        const total = values.reduce((sum, value) => sum + value, 0);
        return total / values.length;
    }

    function readParams(inputs) {
        return {
            rows: clamp(Math.round(Number(inputs.rows.value) || 10), 1, 24),
            probability: clamp(Number(String(inputs.probability.value).replace(',', '.')) || 0.5, 0.01, 0.99),
            ballCount: clamp(Math.round(Number(inputs.balls.value) || 160), 1, 1000),
            speed: clamp(Number(inputs.speed.value) || 1.4, 0.5, 5),
            model: inputs.model.value === 'normal' ? 'normal' : 'binomial',
            instant: inputs.instant.checked
        };
    }

    function syncInputs(inputs, params) {
        inputs.rows.value = params.rows;
        inputs.probability.value = Number(params.probability.toFixed(3)).toString();
        inputs.balls.value = params.ballCount;
        inputs.model.value = params.model;
    }

    function resizeCanvas(canvas, ctx) {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * ratio));
        canvas.height = Math.max(1, Math.floor(rect.height * ratio));
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        return { width: rect.width, height: rect.height };
    }

    function geometry(size, rows) {
        const padding = 36;
        const boardTop = 62;
        const boardBottom = size.height - 94;
        const boardHeight = Math.max(260, boardBottom - boardTop);
        const boardWidth = Math.min(size.width - padding * 2, Math.max(360, rows * 44));
        const centerX = size.width / 2;
        const left = centerX - boardWidth / 2;
        const rowGap = Math.min(38, (boardHeight - 150) / Math.max(rows, 1));
        const colGap = boardWidth / Math.max(rows + 1, 2);
        const pegRadius = clamp(colGap / 10, 3.8, 6);
        const ballRadius = clamp(colGap / 9, 4.5, 7);
        const slotTop = boardTop + rows * rowGap + 46;
        const slotBottom = boardBottom - 6;

        return {
            centerX,
            left,
            right: centerX + boardWidth / 2,
            boardTop,
            boardBottom,
            boardWidth,
            rowGap,
            colGap,
            pegRadius,
            ballRadius,
            slotTop,
            slotBottom,
            slotWidth: boardWidth / (rows + 1)
        };
    }

    function pegPosition(g, row, rights) {
        return {
            x: g.centerX + (rights - row / 2) * g.colGap,
            y: g.boardTop + row * g.rowGap
        };
    }

    function slotCenter(g, rows, slot) {
        return {
            x: g.left + (slot + 0.5) * g.slotWidth,
            y: g.slotBottom - 14
        };
    }

    function createBall(index, params, g) {
        const simulated = simulateSlot(params.rows, params.probability);
        const points = [{ x: g.centerX, y: g.boardTop - 48 }];
        let rights = 0;

        simulated.choices.forEach((choice, row) => {
            const peg = pegPosition(g, row, rights);
            const direction = choice ? 1 : -1;
            points.push({
                x: peg.x + direction * (g.pegRadius + g.ballRadius + 3),
                y: peg.y + 2
            });
            rights += choice;
            points.push({
                x: g.centerX + (rights - (row + 1) / 2) * g.colGap,
                y: g.boardTop + (row + 1) * g.rowGap - 5
            });
        });

        points.push(slotCenter(g, params.rows, simulated.rights));

        return {
            points,
            slot: simulated.rights,
            delay: index * 0.018 / params.speed,
            color: index % 7 === 0 ? '#f59f00' : '#2f80ed'
        };
    }

    function positionOnPath(points, progress) {
        const segments = [];
        let total = 0;
        for (let i = 1; i < points.length; i += 1) {
            const length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
            segments.push(length);
            total += length;
        }

        let target = clamp(progress, 0, 1) * total;
        for (let i = 0; i < segments.length; i += 1) {
            if (target <= segments[i]) {
                const a = points[i];
                const b = points[i + 1];
                const u = target / Math.max(segments[i], EPSILON);
                return {
                    x: a.x + (b.x - a.x) * u,
                    y: a.y + (b.y - a.y) * u
                };
            }
            target -= segments[i];
        }
        return points[points.length - 1];
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        }
    }

    function drawBall(ctx, x, y, radius, color) {
        const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.45, 1, x, y, radius * 1.25);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.25, color);
        gradient.addColorStop(1, '#17202f');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawScene(ctx, size, params, balls, elapsed) {
        const g = geometry(size, params.rows);
        const expected = expectedCounts(params.rows, params.probability, params.ballCount, params.model);
        const observed = Array(params.rows + 1).fill(0);
        const active = [];
        const duration = 1.9 / params.speed;

        balls.forEach((ball) => {
            const age = elapsed - ball.delay;
            if (params.instant || age >= duration) {
                observed[ball.slot] += 1;
            } else if (age >= 0) {
                active.push({ ball, progress: age / duration });
            }
        });

        ctx.clearRect(0, 0, size.width, size.height);
        const background = ctx.createLinearGradient(0, 0, 0, size.height);
        background.addColorStop(0, '#fffdf8');
        background.addColorStop(1, '#eef5f6');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size.width, size.height);

        ctx.strokeStyle = '#d9ccba';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(g.left - 18, g.boardTop - 34);
        ctx.lineTo(g.left - 18, g.slotBottom + 24);
        ctx.moveTo(g.right + 18, g.boardTop - 34);
        ctx.lineTo(g.right + 18, g.slotBottom + 24);
        ctx.moveTo(g.left - 18, g.slotBottom + 24);
        ctx.lineTo(g.right + 18, g.slotBottom + 24);
        ctx.stroke();

        for (let row = 0; row < params.rows; row += 1) {
            for (let rights = 0; rights <= row; rights += 1) {
                const peg = pegPosition(g, row, rights);
                ctx.fillStyle = '#17202f';
                ctx.beginPath();
                ctx.arc(peg.x, peg.y, g.pegRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let slot = 0; slot <= params.rows + 1; slot += 1) {
            const x = g.left + slot * g.slotWidth;
            ctx.strokeStyle = '#d9ccba';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, g.slotTop);
            ctx.lineTo(x, g.slotBottom + 24);
            ctx.stroke();
        }

        const maxCount = Math.max(1, ...expected, ...observed);
        const barMaxHeight = Math.max(90, g.slotBottom - g.slotTop - 24);

        expected.forEach((value, slot) => {
            const h = value / maxCount * barMaxHeight;
            const x = g.left + slot * g.slotWidth + g.slotWidth * 0.18;
            ctx.fillStyle = 'rgba(201, 42, 42, 0.12)';
            ctx.strokeStyle = 'rgba(201, 42, 42, 0.72)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            drawRoundedRect(ctx, x, g.slotBottom - h, g.slotWidth * 0.64, h, 5);
            ctx.fill();
            ctx.stroke();
        });

        observed.forEach((count, slot) => {
            const center = slotCenter(g, params.rows, slot);
            const columns = Math.max(1, Math.floor((g.slotWidth - 8) / (g.ballRadius * 2 + 1)));
            for (let i = 0; i < count; i += 1) {
                const col = i % columns;
                const row = Math.floor(i / columns);
                const x = center.x + (col - (columns - 1) / 2) * (g.ballRadius * 2 + 1);
                const y = g.slotBottom - 10 - row * (g.ballRadius * 2 + 1);
                if (y > g.slotTop - 12) drawBall(ctx, x, y, g.ballRadius, i % 7 === 0 ? '#f59f00' : '#2f80ed');
            }
        });

        active.forEach((item) => {
            const p = positionOnPath(item.ball.points, item.progress);
            drawBall(ctx, p.x, p.y, g.ballRadius, item.ball.color);
        });

        ctx.fillStyle = '#617086';
        ctx.font = '12px Arial, sans-serif';
        ctx.textAlign = 'center';
        for (let slot = 0; slot <= params.rows; slot += 1) {
            const center = slotCenter(g, params.rows, slot);
            ctx.fillText(String(slot), center.x, g.slotBottom + 44);
            ctx.fillStyle = '#17202f';
            ctx.font = `${params.rows > 16 ? 10 : 11}px Arial, sans-serif`;
            ctx.fillText(`${observed[slot]} / ${formatCount(expected[slot])}`, center.x, g.slotBottom + 62);
            ctx.fillStyle = '#617086';
            ctx.font = '12px Arial, sans-serif';
        }

        return { observed, expected, activeCount: active.length };
    }

    function formatCount(value) {
        if (Math.abs(value - Math.round(value)) < 0.05) return Math.round(value).toString();
        return value.toFixed(1);
    }

    function renderStats(container, params, observed) {
        const observedValues = [];
        observed.forEach((count, slot) => {
            for (let i = 0; i < count; i += 1) observedValues.push(slot);
        });

        const observedMean = observedValues.length ? mean(observedValues) : 0;
        const expectedMean = params.rows * params.probability;
        const expectedVariance = params.rows * params.probability * (1 - params.probability);

        container.innerHTML = '';
        [
            ['rangées', params.rows],
            ['billes', params.ballCount],
            ['p droite', params.probability],
            ['modèle', params.model === 'normal' ? 'normale' : 'binomiale'],
            ['moy. obs.', observedMean],
            ['var. th.', expectedVariance]
        ].forEach(([label, value]) => {
            const item = document.createElement('div');
            item.className = 'stat-card';
            item.innerHTML = `<span>${label}</span><strong>${typeof value === 'number' ? Number(value.toFixed(4)).toString() : value}</strong>`;
            container.appendChild(item);
        });
        container.dataset.expectedMean = expectedMean.toString();
    }

    function renderCounts(container, params, observed, expected) {
        if (!container) return;

        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'galton-counts__header';
        header.innerHTML = '<span>Case</span><span>Intervalle</span><span>Observé / théorique</span>';
        container.appendChild(header);

        observed.forEach((count, slot) => {
            const row = document.createElement('div');
            row.className = 'galton-counts__row';
            row.innerHTML = `
                <span>${slot}</span>
                <span>${slotIntervalLabel(params.rows, slot)}</span>
                <strong>${count} / ${formatCount(expected[slot])}</strong>
            `;
            container.appendChild(row);
        });
    }

    function setupPage() {
        const form = document.getElementById('galton-form');
        const canvas = document.getElementById('galton-canvas');
        if (!form || !canvas) return;

        const ctx = canvas.getContext('2d');
        const inputs = {
            rows: document.getElementById('galton-rows'),
            probability: document.getElementById('galton-probability'),
            balls: document.getElementById('galton-balls'),
            speed: document.getElementById('galton-speed'),
            model: document.getElementById('galton-model'),
            instant: document.getElementById('galton-instant')
        };
        const stats = document.getElementById('galton-stats');
        const counts = document.getElementById('galton-counts');

        let params = readParams(inputs);
        let size = resizeCanvas(canvas, ctx);
        let balls = [];
        let start = performance.now();
        let animation = 0;

        function restart() {
            params = readParams(inputs);
            syncInputs(inputs, params);
            size = resizeCanvas(canvas, ctx);
            const g = geometry(size, params.rows);
            balls = Array.from({ length: params.ballCount }, (_, index) => createBall(index, params, g));
            start = performance.now();
            window.cancelAnimationFrame(animation);
            animation = window.requestAnimationFrame(tick);
        }

        function tick(now) {
            const elapsed = (now - start) / 1000;
            const scene = drawScene(ctx, size, params, balls, elapsed);
            renderStats(stats, params, scene.observed);
            renderCounts(counts, params, scene.observed, scene.expected);

            const lastDelay = balls.length ? balls[balls.length - 1].delay : 0;
            if (!params.instant && elapsed < lastDelay + 2.1 / params.speed + 0.1) {
                animation = window.requestAnimationFrame(tick);
            }
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            restart();
        });

        Object.values(inputs).forEach((input) => {
            input.addEventListener(input.type === 'range' ? 'input' : 'change', restart);
        });

        window.addEventListener('resize', restart);
        window.addEventListener('pagehide', () => window.cancelAnimationFrame(animation));
        restart();
    }

    const api = {
        binomialCoefficient,
        binomialProbability,
        normalCdf,
        normalIntervalProbability,
        normalExpectedCounts,
        expectedCounts,
        slotIntervalLabel,
        simulateSlot,
        simulateCounts
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    globalScope.PouzatGalton = api;

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', setupPage);
    }
})(typeof window !== 'undefined' ? window : globalThis);

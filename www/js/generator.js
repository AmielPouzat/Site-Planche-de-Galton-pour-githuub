(function initGeneratorModule(globalScope) {
    function nextSuiteValue(u, l) {
        return (l - 1) / (u + 1) + 1;
    }

    function isPerfectSquare(value) {
        const root = Math.sqrt(value);
        return root === Math.floor(root);
    }

    function rawGenerator(m, l, count, options = {}) {
        const max = Math.floor(m);
        const parameter = Math.floor(l);
        const targetCount = Math.floor(count);
        const ensureCount = options.ensureCount === true;
        const startIndex = Math.max(0, Math.floor(options.startIndex || 0));

        if (max < 2 || parameter < 2 || targetCount < 1) {
            throw new Error('Paramètres invalides.');
        }

        let u = Math.sqrt(l);
        const values = [];
        const digits = Math.floor(Math.log(max) / Math.log(10)) + 1;
        let z = startIndex;
        let guard = 0;

        while (ensureCount ? values.length < targetCount : z < startIndex + targetCount) {
            z += 1;
            guard += 1;

            if (guard > targetCount * 10000) {
                throw new Error('Génération interrompue : trop de rejets.');
            }

            for (let k = 0; k < digits; k += 1) {
                u = nextSuiteValue(u, parameter);
            }

            const scale = Math.pow(10, digits * (z - 1) + 6);
            if (!Number.isFinite(scale)) {
                throw new Error('Précision insuffisante pour extraire autant de chiffres avec ces paramètres.');
            }

            const fragment = u * scale - Math.floor(u * scale);
            const b = Math.floor(fragment * Math.pow(10, digits));
            const acceptedLimit = max * Math.floor(Math.pow(10, digits) / max);

            if (b < acceptedLimit) {
                values.push(b % max);
            }
        }

        return values;
    }

    function toyParameters(i) {
        const a = 16807;
        const b = 0;
        const c = Math.pow(2, 31) - 1;
        const d = 1000;
        const e = 22695477;
        const f = 1;
        const g = Math.pow(2, 32) - 1;
        const h = Math.pow(2, 16);

        return {
            m: Math.floor(((a * i + b) % c) + d),
            l: Math.floor(((e * i + f) % g + h) / Math.pow(2, 16))
        };
    }

    function generator1(count, options = {}) {
        const requested = Math.floor(count);
        const maxLoop = Math.floor(requested + Math.sqrt(requested) + 1);
        const startIndex = Math.max(0, Math.floor(options.startIndex || 0));
        const values = [];
        const borne = Math.pow(2, 16);

        for (let i = startIndex + 1; i <= startIndex + maxLoop; i += 1) {
            const { m, l } = toyParameters(i);
            if (!isPerfectSquare(l)) {
                const raw = rawGenerator(m, l, 1)[0];
                if (raw !== undefined) {
                    values.push(((raw * raw) % borne) / borne);
                }
            }
        }

        return values;
    }

    function generator2(count, options = {}) {
        const requested = Math.floor(count);
        const startIndex = Math.max(0, Math.floor(options.startIndex || 0));
        const values = [];
        const borne = Math.pow(2, 16);
        let i = startIndex;

        while (values.length < requested) {
            i += 1;
            const { m, l } = toyParameters(i);
            if (!isPerfectSquare(l)) {
                const raw = rawGenerator(m, l, 1)[0];
                if (raw !== undefined) {
                    values.push(((raw * raw) % borne) / borne);
                }
            }
        }

        return values;
    }

    function generateValues(options) {
        if (options.kind === 'raw') {
            return rawGenerator(options.max, options.l, options.count, {
                ensureCount: true,
                startIndex: options.startIndex
            });
        }

        if (options.kind === 'generator1') {
            return generator1(options.count, { startIndex: options.startIndex });
        }

        return generator2(options.count, { startIndex: options.startIndex });
    }

    function timeStartIndex(now = Date.now()) {
        const seconds = Math.floor(now / 1000);
        return seconds % 1000000;
    }

    function stats(values) {
        const n = values.length;
        const mean = values.reduce((sum, value) => sum + value, 0) / n;
        const sumSquaredDeviation = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0);
        const populationVariance = sumSquaredDeviation / n;
        const sampleVariance = n > 1 ? sumSquaredDeviation / (n - 1) : 0;
        return {
            count: n,
            min: Math.min(...values),
            max: Math.max(...values),
            mean,
            populationVariance,
            sampleVariance
        };
    }

    function toCsv(values) {
        return ['index,value']
            .concat(values.map((value, index) => `${index + 1},${value}`))
            .join('\n');
    }

    function formatNumber(value) {
        if (!Number.isFinite(value)) return '';
        return Math.abs(value) >= 1000 ? value.toFixed(0) : Number(value.toFixed(6)).toString();
    }

    function renderStats(container, result) {
        container.innerHTML = '';
        [
            ['n', result.count],
            ['min', result.min],
            ['max', result.max],
            ['moyenne', result.mean],
            ['var. pop.', result.populationVariance],
            ['var. corr.', result.sampleVariance]
        ].forEach(([label, value]) => {
            const item = document.createElement('div');
            item.className = 'stat-card';
            item.innerHTML = `<span>${label}</span><strong>${formatNumber(value)}</strong>`;
            container.appendChild(item);
        });
    }

    function downloadCsv(values) {
        const blob = new Blob([toCsv(values)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'generateur_pouzat.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function setupPage() {
        const form = document.getElementById('generator-form');
        if (!form) return;

        const countInput = document.getElementById('generator-count');
        const maxInput = document.getElementById('generator-max');
        const lInput = document.getElementById('generator-l');
        const kindInput = document.getElementById('generator-kind');
        const seedModeInput = document.getElementById('generator-seed-mode');
        const startInput = document.getElementById('generator-start');
        const maxField = document.getElementById('generator-max-field');
        const lField = document.getElementById('generator-l-field');
        const startField = document.getElementById('generator-start-field');
        const output = document.getElementById('generator-output');
        const statsContainer = document.getElementById('generator-stats');
        const downloadButton = document.getElementById('generator-download');
        let currentValues = [];

        function updateModeVisibility() {
            const isRaw = kindInput.value === 'raw';
            maxField.style.display = isRaw ? 'grid' : 'none';
            lField.style.display = isRaw ? 'grid' : 'none';
            startField.style.display = seedModeInput.value === 'manual' ? 'grid' : 'none';
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const count = Math.max(1, Math.min(5000, Number(countInput.value) || 1));
            const max = Math.max(2, Number(maxInput.value) || 2);
            const l = Math.max(2, Number(lInput.value) || 2);
            const kind = kindInput.value;
            const startIndex = seedModeInput.value === 'time'
                ? timeStartIndex()
                : Math.max(0, Math.floor(Number(startInput.value) || 0));

            try {
                currentValues = generateValues({ kind, count, max, l, startIndex });
                output.value = currentValues.map(formatNumber).join('\n');
                renderStats(statsContainer, stats(currentValues));
                downloadButton.disabled = false;
            } catch (error) {
                currentValues = [];
                output.value = error.message;
                statsContainer.innerHTML = '';
                downloadButton.disabled = true;
            }
        });

        downloadButton.addEventListener('click', () => {
            if (currentValues.length > 0) downloadCsv(currentValues);
        });

        kindInput.addEventListener('change', updateModeVisibility);
        seedModeInput.addEventListener('change', updateModeVisibility);
        updateModeVisibility();
        form.dispatchEvent(new Event('submit'));
    }

    const api = {
        nextSuiteValue,
        rawGenerator,
        generator1,
        generator2,
        generateValues,
        timeStartIndex,
        stats,
        toCsv
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    globalScope.PouzatGenerator = api;

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', setupPage);
    }
})(typeof window !== 'undefined' ? window : globalThis);

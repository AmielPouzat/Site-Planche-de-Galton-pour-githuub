(function initRegressionModule(globalScope) {
    const EPSILON = 1e-9;

    function absBigInt(value) {
        return value < 0n ? -value : value;
    }

    function gcdBigInt(a, b) {
        let x = absBigInt(a);
        let y = absBigInt(b);
        while (y !== 0n) {
            const next = x % y;
            x = y;
            y = next;
        }
        return x || 1n;
    }

    function pow10BigInt(power) {
        return 10n ** BigInt(power);
    }

    class Fraction {
        constructor(numerator, denominator = 1n) {
            if (denominator === 0n) {
                throw new Error('Division par zéro.');
            }

            let n = BigInt(numerator);
            let d = BigInt(denominator);
            if (d < 0n) {
                n = -n;
                d = -d;
            }

            const divisor = gcdBigInt(n, d);
            this.n = n / divisor;
            this.d = d / divisor;
        }

        static zero() {
            return new Fraction(0n, 1n);
        }

        static one() {
            return new Fraction(1n, 1n);
        }

        static from(value) {
            if (value instanceof Fraction) return value;
            if (typeof value === 'bigint') return new Fraction(value, 1n);
            if (typeof value === 'number') return Fraction.parse(String(value));
            return Fraction.parse(String(value));
        }

        static parse(rawValue) {
            const value = rawValue.trim().replace(/\s+/g, '').replace(',', '.');
            if (!value) {
                throw new Error('Nombre vide.');
            }

            if (value.includes('/')) {
                const parts = value.split('/');
                if (parts.length !== 2) {
                    throw new Error(`Fraction invalide: ${rawValue}`);
                }
                return new Fraction(BigInt(parts[0]), BigInt(parts[1]));
            }

            const match = value.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i);
            if (!match) {
                throw new Error(`Nombre invalide: ${rawValue}`);
            }

            const sign = match[1] === '-' ? -1n : 1n;
            const integerPart = match[2] || '0';
            const fractionalPart = match[3] !== undefined ? match[3] : (match[4] || '');
            const exponent = Number(match[5] || 0);
            const digits = `${integerPart}${fractionalPart}`.replace(/^0+(?=\d)/, '') || '0';
            let numerator = BigInt(digits) * sign;
            let denominator = pow10BigInt(fractionalPart.length);

            if (exponent > 0) {
                numerator *= pow10BigInt(exponent);
            } else if (exponent < 0) {
                denominator *= pow10BigInt(-exponent);
            }

            return new Fraction(numerator, denominator);
        }

        add(other) {
            const value = Fraction.from(other);
            return new Fraction(this.n * value.d + value.n * this.d, this.d * value.d);
        }

        sub(other) {
            const value = Fraction.from(other);
            return new Fraction(this.n * value.d - value.n * this.d, this.d * value.d);
        }

        mul(other) {
            const value = Fraction.from(other);
            return new Fraction(this.n * value.n, this.d * value.d);
        }

        div(other) {
            const value = Fraction.from(other);
            return new Fraction(this.n * value.d, this.d * value.n);
        }

        neg() {
            return new Fraction(-this.n, this.d);
        }

        abs() {
            return this.n < 0n ? this.neg() : this;
        }

        isZero() {
            return this.n === 0n;
        }

        isOne() {
            return this.n === this.d;
        }

        equals(other) {
            const value = Fraction.from(other);
            return this.n === value.n && this.d === value.d;
        }

        toNumber() {
            return Number(this.n) / Number(this.d);
        }

        toString() {
            return this.d === 1n ? this.n.toString() : `${this.n.toString()}/${this.d.toString()}`;
        }
    }

    function parsePointLine(line) {
        let parts;

        if (line.includes(';')) {
            parts = line.split(';').map((part) => part.trim()).filter(Boolean);
        } else if (line.includes(',')) {
            parts = line.split(',').map((part) => part.trim()).filter(Boolean);
        } else {
            parts = line.split(/\s+/).map((part) => part.trim()).filter(Boolean);
        }

        if (parts.length !== 2) {
            throw new Error(`Ligne invalide: ${line}`);
        }

        const xExact = Fraction.parse(parts[0]);
        const yExact = Fraction.parse(parts[1]);
        return {
            x: xExact.toNumber(),
            y: yExact.toNumber(),
            xExact,
            yExact
        };
    }

    function parsePoints(text) {
        return text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map(parsePointLine);
    }

    function asFraction(value) {
        return Fraction.from(value);
    }

    function addPolynomials(a, b) {
        const length = Math.max(a.length, b.length);
        const result = Array.from({ length }, () => Fraction.zero());

        for (let i = 0; i < length; i += 1) {
            result[i] = (a[i] || Fraction.zero()).add(b[i] || Fraction.zero());
        }

        return result;
    }

    function multiplyPolynomials(a, b) {
        const result = Array.from({ length: a.length + b.length - 1 }, () => Fraction.zero());

        for (let i = 0; i < a.length; i += 1) {
            for (let j = 0; j < b.length; j += 1) {
                result[i + j] = result[i + j].add(asFraction(a[i]).mul(b[j]));
            }
        }

        return result;
    }

    function scalePolynomial(poly, scalar) {
        const factor = asFraction(scalar);
        return poly.map((value) => asFraction(value).mul(factor));
    }

    function interpolate(points) {
        if (points.length < 2) {
            throw new Error('Il faut au moins deux points.');
        }

        const xs = points.map((point) => point.xExact || asFraction(point.x));
        const uniqueXs = new Set(xs.map((value) => value.toString()));
        if (uniqueXs.size !== points.length) {
            throw new Error('Les valeurs de X doivent être distinctes.');
        }

        let result = [Fraction.zero()];

        points.forEach((point, i) => {
            const xi = point.xExact || asFraction(point.x);
            const yi = point.yExact || asFraction(point.y);
            let basis = [Fraction.one()];
            let denominator = Fraction.one();

            points.forEach((other, j) => {
                if (i === j) return;
                const xj = other.xExact || asFraction(other.x);
                basis = multiplyPolynomials(basis, [xj.neg(), Fraction.one()]);
                denominator = denominator.mul(xi.sub(xj));
            });

            result = addPolynomials(result, scalePolynomial(basis, yi.div(denominator)));
        });

        return trimPolynomial(result);
    }

    function trimPolynomial(coefficients) {
        const result = coefficients.map(asFraction);
        while (result.length > 1 && result[result.length - 1].isZero()) {
            result.pop();
        }
        return result;
    }

    function evaluatePolynomialExact(coefficients, x) {
        const exactX = asFraction(x);
        return coefficients.reduceRight((acc, coefficient) => acc.mul(exactX).add(coefficient), Fraction.zero());
    }

    function evaluatePolynomial(coefficients, x) {
        if (x instanceof Fraction) {
            return evaluatePolynomialExact(coefficients, x).toNumber();
        }

        return coefficients.reduceRight((acc, coefficient) => acc * x + asFraction(coefficient).toNumber(), 0);
    }

    function formatDecimal(value) {
        if (Math.abs(value) < EPSILON) return '0';
        const abs = Math.abs(value);
        if (abs >= 1e7 || abs < 1e-6) return value.toExponential(6);
        return Number(value.toFixed(10)).toString();
    }

    function formatNumber(value) {
        if (value instanceof Fraction) return value.toString();
        return formatDecimal(value);
    }

    function formatFractionWithApprox(value) {
        const fraction = asFraction(value);
        if (fraction.d === 1n) return fraction.toString();
        return `${fraction.toString()} ≈ ${formatDecimal(fraction.toNumber())}`;
    }

    function fractionToLatex(value) {
        const fraction = asFraction(value);
        if (fraction.d === 1n) return fraction.n.toString();
        const sign = fraction.n < 0n ? '-' : '';
        return `${sign}\\frac{${absBigInt(fraction.n).toString()}}{${fraction.d.toString()}}`;
    }

    function positiveFractionToLatex(value) {
        const fraction = asFraction(value).abs();
        if (fraction.d === 1n) return fraction.n.toString();
        return `\\frac{${fraction.n.toString()}}{${fraction.d.toString()}}`;
    }

    function polynomialToLatex(coefficients) {
        const exactCoefficients = coefficients.map(asFraction);
        const terms = [];

        for (let power = exactCoefficients.length - 1; power >= 0; power -= 1) {
            const coefficient = exactCoefficients[power];
            if (coefficient.isZero()) continue;

            const sign = coefficient.n < 0n ? '-' : '+';
            const abs = coefficient.abs();
            let term = '';

            if (power === 0) {
                term = positiveFractionToLatex(abs);
            } else if (power === 1) {
                term = `${abs.isOne() ? '' : positiveFractionToLatex(abs)}x`;
            } else {
                term = `${abs.isOne() ? '' : positiveFractionToLatex(abs)}x^{${power}}`;
            }

            terms.push({ sign, term });
        }

        if (terms.length === 0) return 'P(x) = 0';

        return `P(x) = ${terms.map((item, index) => {
            if (index === 0) return item.sign === '-' ? `-${item.term}` : item.term;
            return ` ${item.sign} ${item.term}`;
        }).join('')}`;
    }

    function coefficientsToLatex(coefficients) {
        return coefficients
            .map((coefficient, power) => `a_{${power}} = ${fractionToLatex(coefficient)}`)
            .join('\\\\\n');
    }

    function fractionToCode(value, language) {
        const fraction = asFraction(value);
        if (language === 'python') {
            return `Fraction(${fraction.n.toString()}, ${fraction.d.toString()})`;
        }
        if (fraction.d === 1n) return fraction.n.toString();
        return `(${fraction.n.toString()} / ${fraction.d.toString()})`;
    }

    function codePower(variableName, power, language) {
        if (power === 0) return '';
        if (power === 1) return variableName;
        if (language === 'javascript') return `Math.pow(${variableName}, ${power})`;
        if (language === 'python') return `${variableName}**${power}`;
        return `${variableName}^${power}`;
    }

    function codeExpression(coefficients, language) {
        const terms = coefficients
            .map(asFraction)
            .map((coefficient, power) => ({ coefficient, power }))
            .filter((item) => !item.coefficient.isZero())
            .map((item) => {
                const coefficient = fractionToCode(item.coefficient, language);
                const power = codePower('x', item.power, language);
                if (!power) return coefficient;
                return `${coefficient} * ${power}`;
            });

        if (terms.length === 0) return '0';
        return terms.join(' + ').replace(/\+ -/g, '- ');
    }

    function polynomialToCode(coefficients, language) {
        if (language === 'python') {
            return `from fractions import Fraction\n\n` +
                `def P(x):\n` +
                `    x = Fraction(x)\n` +
                `    return ${codeExpression(coefficients, language)}`;
        }

        if (language === 'r') {
            return `P <- function(x) {\n` +
                `  ${codeExpression(coefficients, language)}\n` +
                `}`;
        }

        return `function P(x) {\n` +
            `    return ${codeExpression(coefficients, 'javascript')};\n` +
            `}`;
    }

    function exportPolynomial(coefficients, mode) {
        if (mode === 'latex') {
            return `${polynomialToLatex(coefficients)}\n\n${coefficientsToLatex(coefficients)}`;
        }
        if (mode === 'python' || mode === 'r' || mode === 'javascript') {
            return polynomialToCode(coefficients, mode);
        }
        return polynomialToString(coefficients);
    }

    function polynomialToString(coefficients) {
        const exactCoefficients = coefficients.map(asFraction);
        const terms = [];

        for (let power = exactCoefficients.length - 1; power >= 0; power -= 1) {
            const coefficient = exactCoefficients[power];
            if (coefficient.isZero()) continue;

            const sign = coefficient.n < 0n ? '-' : '+';
            const abs = coefficient.abs();
            let term = '';

            if (power === 0) {
                term = abs.toString();
            } else if (power === 1) {
                term = `${abs.isOne() ? '' : abs.toString()}x`;
            } else {
                term = `${abs.isOne() ? '' : abs.toString()}x^${power}`;
            }

            terms.push({ sign, term });
        }

        if (terms.length === 0) return 'P(x) = 0';

        return `P(x) = ${terms.map((item, index) => {
            if (index === 0) return item.sign === '-' ? `-${item.term}` : item.term;
            return ` ${item.sign} ${item.term}`;
        }).join('')}`;
    }

    function coefficientsToString(coefficients) {
        return coefficients
            .map((coefficient, power) => `a_${power} = ${formatFractionWithApprox(coefficient)}`)
            .join('\n');
    }

    function appendFractionNode(parent, value) {
        const fraction = asFraction(value);
        if (fraction.d === 1n) {
            parent.append(document.createTextNode(fraction.n.toString()));
            return;
        }

        const wrapper = document.createElement('span');
        wrapper.className = 'math-frac';

        const numerator = document.createElement('span');
        numerator.className = 'math-frac__num';
        numerator.textContent = fraction.n.toString();

        const denominator = document.createElement('span');
        denominator.className = 'math-frac__den';
        denominator.textContent = fraction.d.toString();

        wrapper.append(numerator, denominator);
        parent.append(wrapper);
    }

    function appendPowerNode(parent, power) {
        parent.append(document.createTextNode('x'));
        if (power > 1) {
            const exponent = document.createElement('sup');
            exponent.textContent = power.toString();
            parent.append(exponent);
        }
    }

    function renderPolynomialVisual(container, coefficients) {
        if (!container) return;

        const exactCoefficients = coefficients.map(asFraction);
        const terms = [];
        for (let power = exactCoefficients.length - 1; power >= 0; power -= 1) {
            const coefficient = exactCoefficients[power];
            if (!coefficient.isZero()) terms.push({ coefficient, power });
        }

        container.textContent = '';
        container.append(document.createTextNode('P(x) = '));

        if (terms.length === 0) {
            container.append(document.createTextNode('0'));
            return;
        }

        terms.forEach((item, index) => {
            const sign = item.coefficient.n < 0n ? '-' : '+';
            const abs = item.coefficient.abs();
            const term = document.createElement('span');
            term.className = 'math-term';

            if (index === 0 && sign === '-') {
                term.append(document.createTextNode('-'));
            } else if (index > 0) {
                term.append(document.createTextNode(` ${sign} `));
            }

            if (item.power === 0) {
                appendFractionNode(term, abs);
            } else {
                if (!abs.isOne()) appendFractionNode(term, abs);
                appendPowerNode(term, item.power);
            }

            container.append(term);
        });
    }

    function errorStats(points, coefficients) {
        const residuals = points.map((point) => {
            const exactX = point.xExact || asFraction(point.x);
            const exactY = point.yExact || asFraction(point.y);
            const predictedExact = evaluatePolynomialExact(coefficients, exactX);
            const residualExact = predictedExact.sub(exactY);
            return {
                x: point.x,
                y: point.y,
                xExact: exactX,
                yExact: exactY,
                predicted: predictedExact.toNumber(),
                predictedExact,
                residual: residualExact.toNumber(),
                residualExact
            };
        });
        const maxError = Math.max(...residuals.map((item) => Math.abs(item.residual)));
        const rmse = Math.sqrt(
            residuals.reduce((sum, item) => sum + item.residual * item.residual, 0) / residuals.length
        );
        return {
            rmse,
            maxError,
            degree: coefficients.length - 1,
            residuals,
            exactWithinTolerance: residuals.every((item) => item.residualExact.isZero())
        };
    }

    function drawChart(canvas, points, coefficients) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 48;
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const spanX = Math.max(maxX - minX, 1);
        const plotMinX = minX - spanX * 0.15;
        const plotMaxX = maxX + spanX * 0.15;
        const samples = Array.from({ length: 220 }, (_, index) => {
            const x = plotMinX + (plotMaxX - plotMinX) * index / 219;
            return { x, y: evaluatePolynomial(coefficients, x) };
        });
        const allY = ys.concat(samples.map((point) => point.y));
        const minY = Math.min(...allY);
        const maxY = Math.max(...allY);
        const spanY = Math.max(maxY - minY, 1);
        const plotMinY = minY - spanY * 0.15;
        const plotMaxY = maxY + spanY * 0.15;

        function sx(x) {
            return padding + (x - plotMinX) / (plotMaxX - plotMinX) * (width - padding * 2);
        }

        function sy(y) {
            return height - padding - (y - plotMinY) / (plotMaxY - plotMinY) * (height - padding * 2);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fffdf8';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#e8dfd2';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 6; i += 1) {
            const x = padding + i * (width - padding * 2) / 6;
            const y = padding + i * (height - padding * 2) / 6;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        ctx.strokeStyle = '#c6632f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        samples.forEach((point, index) => {
            if (index === 0) ctx.moveTo(sx(point.x), sy(point.y));
            else ctx.lineTo(sx(point.x), sy(point.y));
        });
        ctx.stroke();

        points.forEach((point) => {
            ctx.fillStyle = '#17202f';
            ctx.beginPath();
            ctx.arc(sx(point.x), sy(point.y), 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2f8f9d';
            ctx.beginPath();
            ctx.arc(sx(point.x), sy(point.y), 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function renderStats(container, stats) {
        container.innerHTML = '';
        [
            ['degré', stats.degree],
            ['RMSE', stats.rmse],
            ['erreur max', stats.maxError],
            ['statut', stats.exactWithinTolerance ? 'exact' : 'à vérifier']
        ].forEach(([label, value]) => {
            const item = document.createElement('div');
            item.className = 'stat-card';
            item.innerHTML = `<span>${label}</span><strong>${typeof value === 'number' ? formatDecimal(value) : value}</strong>`;
            container.appendChild(item);
        });
    }

    function residualsToString(stats) {
        return stats.residuals
            .map((item) => {
                return `x=${formatNumber(item.xExact)} ; y=${formatNumber(item.yExact)} ; P(x)=${formatNumber(item.predictedExact)} ; r=${formatNumber(item.residualExact)}`;
            })
            .join('\n');
    }

    function hasTrollTrigger(points) {
        return points.some((point) => Math.abs(point.x - 42) < EPSILON && Math.abs(point.y - 1337) < EPSILON);
    }

    function triggerTrollEgg() {
        const egg = document.getElementById('troll-easter-egg');
        if (!egg) return;

        egg.classList.remove('visible');
        window.requestAnimationFrame(() => {
            egg.classList.add('visible');
            window.setTimeout(() => egg.classList.remove('visible'), 2600);
        });
    }

    function setupPage() {
        const form = document.getElementById('regression-form');
        if (!form) return;

        const textarea = document.getElementById('regression-data');
        const exampleButton = document.getElementById('regression-example');
        const rungeButton = document.getElementById('regression-runge');
        const exportMode = document.getElementById('regression-export-mode');
        const exportBox = document.getElementById('regression-export');
        const copyButton = document.getElementById('regression-copy');
        const visualFormula = document.getElementById('regression-visual');
        const formula = document.getElementById('regression-formula');
        const coefficientsBox = document.getElementById('regression-coefficients');
        const residuals = document.getElementById('regression-residuals');
        const statsContainer = document.getElementById('regression-stats');
        const canvas = document.getElementById('regression-chart');

        let latestCoefficients = null;

        function updateExport() {
            if (!latestCoefficients || !exportBox) return;
            exportBox.textContent = exportPolynomial(latestCoefficients, exportMode ? exportMode.value : 'latex');
        }

        function compute() {
            try {
                const points = parsePoints(textarea.value);
                const coefficients = interpolate(points);
                const stats = errorStats(points, coefficients);
                latestCoefficients = coefficients;
                renderPolynomialVisual(visualFormula, coefficients);
                formula.textContent = polynomialToString(coefficients);
                if (coefficientsBox) coefficientsBox.textContent = coefficientsToString(coefficients);
                updateExport();
                residuals.textContent = residualsToString(stats);
                renderStats(statsContainer, stats);
                drawChart(canvas, points, coefficients);
                if (hasTrollTrigger(points) && stats.exactWithinTolerance) {
                    triggerTrollEgg();
                }
            } catch (error) {
                latestCoefficients = null;
                if (visualFormula) visualFormula.textContent = error.message;
                formula.textContent = error.message;
                if (coefficientsBox) coefficientsBox.textContent = '';
                if (exportBox) exportBox.textContent = '';
                residuals.textContent = '';
                statsContainer.innerHTML = '';
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            compute();
        });

        exampleButton.addEventListener('click', () => {
            textarea.value = '-2, -15\n-1, -4\n0, 1\n1, 6\n2, 17\n3, 40';
            compute();
        });

        rungeButton.addEventListener('click', () => {
            textarea.value = '-1, 1/26\n-3/4, 16/241\n-1/2, 4/29\n-1/4, 16/41\n0, 1\n1/4, 16/41\n1/2, 4/29\n3/4, 16/241\n1, 1/26';
            compute();
        });

        if (exportMode) {
            exportMode.addEventListener('change', updateExport);
        }

        if (copyButton && exportBox) {
            copyButton.addEventListener('click', async () => {
                const text = exportBox.textContent;
                if (!text) return;

                try {
                    await navigator.clipboard.writeText(text);
                    copyButton.textContent = 'Copié';
                    window.setTimeout(() => {
                        copyButton.textContent = 'Copier';
                    }, 1200);
                } catch (error) {
                    copyButton.textContent = 'Sélectionne le texte';
                    window.setTimeout(() => {
                        copyButton.textContent = 'Copier';
                    }, 1600);
                }
            });
        }

        compute();
    }

    const api = {
        Fraction,
        parsePoints,
        interpolate,
        evaluatePolynomial,
        evaluatePolynomialExact,
        polynomialToString,
        polynomialToLatex,
        coefficientsToString,
        coefficientsToLatex,
        polynomialToCode,
        exportPolynomial,
        errorStats,
        residualsToString
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    globalScope.PouzatRegression = api;

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', setupPage);
    }
})(typeof window !== 'undefined' ? window : globalThis);

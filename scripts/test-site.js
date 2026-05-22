const fs = require('fs');
const path = require('path');

const root = process.cwd();
const siteRoot = path.join(root, 'www');
const publicThreeDRoot = path.join(siteRoot, '3D');

let failureCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`OK   ${message}`);
        return;
    }

    failureCount += 1;
    console.error(`FAIL ${message}`);
}

function exists(relativePath) {
    return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function loadBrowserModule(relativePath) {
    const source = read(relativePath);
    const testModule = { exports: {} };
    const execute = new Function('module', 'exports', source);
    execute(testModule, testModule.exports);
    return testModule.exports;
}

function isExternalUrl(value) {
    return /^(https?:)?\/\//.test(value) ||
        value.startsWith('mailto:') ||
        value.startsWith('tel:') ||
        value.startsWith('#') ||
        value.startsWith('data:');
}

function stripQueryAndHash(value) {
    return value.split('#')[0].split('?')[0];
}

function resolveSiteReference(reference, sourceFile) {
    const cleanReference = stripQueryAndHash(reference);
    if (!cleanReference || isExternalUrl(cleanReference)) return null;

    if (cleanReference === '/3D' || cleanReference === '/3D/') {
        return path.join(publicThreeDRoot, 'index.html');
    }

    if (cleanReference === '/') {
        return path.join(siteRoot, 'index.html');
    }

    if (cleanReference.startsWith('/3D/')) {
        return path.join(publicThreeDRoot, cleanReference.slice('/3D/'.length));
    }

    if (cleanReference.startsWith('/')) {
        const aliases = {
            '/atelier': 'outils.html',
            '/atelier/': 'outils.html',
            '/interpolation': 'regression.html',
            '/interpolation/': 'regression.html',
            '/galton': 'galton.html',
            '/galton/': 'galton.html',
            '/coffre': 'coffre.html',
            '/coffre/': 'coffre.html'
        };

        if (aliases[cleanReference]) {
            return path.join(siteRoot, aliases[cleanReference]);
        }

        if (!path.extname(cleanReference)) {
            return path.join(siteRoot, `${cleanReference.slice(1)}.html`);
        }

        return path.join(siteRoot, cleanReference.slice(1));
    }

    return path.resolve(path.dirname(path.join(root, sourceFile)), cleanReference);
}

function getHtmlReferences(html) {
    const references = [];
    const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    const attributePattern = /\b(?:href|src)=["']([^"']+)["']/gi;
    let match;

    while ((match = attributePattern.exec(htmlWithoutComments)) !== null) {
        references.push(match[1]);
    }

    return references;
}

function testRequiredFiles() {
    [
        'www/index.html',
        'www/cv.html',
        'www/outils.html',
        'www/generateur.html',
        'www/regression.html',
        'www/galton.html',
        'www/coffre.html',
        'www/chat.html',
        'www/css/site.css',
        'www/js/living-stars.js',
        'www/module/navbar.html',
        'www/image/amiel.jpg',
        'www/image/Amiel2.jpg',
        'www/documents/CV_Amiel_POUZAT_FR.pdf',
        'www/documents/CV_Amiel_POUZAT_EN.pdf',
        'www/3D/index.html',
        'www/3D/js/main.js'
    ].forEach((file) => assert(exists(file), `${file} existe`));
}

function testLocalReferences() {
    const htmlFiles = [
        'www/index.html',
        'www/cv.html',
        'www/outils.html',
        'www/generateur.html',
        'www/regression.html',
        'www/galton.html',
        'www/coffre.html',
        'www/chat.html',
        'www/jeu.html',
        'www/module/navbar.html',
        'www/3D/index.html'
    ];

    htmlFiles.forEach((file) => {
        const html = read(file);
        getHtmlReferences(html).forEach((reference) => {
            const resolvedPath = resolveSiteReference(reference, file);
            if (!resolvedPath) return;

            assert(fs.existsSync(resolvedPath), `${file} reference ${reference}`);
        });
    });
}

function testCvPage() {
    const html = read('www/cv.html');
    const css = read('www/css/site.css');

    assert(html.includes('<h1>Amiel Pouzat</h1>'), 'cv.html contient le titre principal');
    assert(html.includes('Exp') && html.includes('professionnelle'), 'cv.html contient les experiences');
    assert(html.includes('Formation'), 'cv.html contient la formation');
    assert(!html.includes('tel:'), 'cv.html ne publie pas de telephone');
    assert(!html.includes('Téléphone') && !html.includes('Telephone'), 'cv.html masque le champ telephone');
    assert(!html.includes('Rue des'), 'cv.html ne publie pas d adresse personnelle');
    assert(css.includes('@media'), 'site.css contient des regles responsives');
}

function testHomePage() {
    const html = read('www/index.html');

    assert(html.includes('id="living-stars"'), 'accueil contient le canvas vivant');
    assert(html.includes('js/living-stars.js'), 'accueil charge l animation etoilee');
    assert(html.includes('/atelier'), 'accueil pointe vers la page atelier');
    assert(html.includes('/chat') && html.includes('/cv'), 'accueil expose chat et CV');
    assert(!html.includes('href="cv.html"') && !html.includes('href="chat.html"'), 'accueil utilise des URLs sans extension');
}

function testToolsLandingPage() {
    const html = read('www/outils.html');

    assert(html.includes('/generateur'), 'page atelier pointe vers le generateur');
    assert(html.includes('/interpolation'), 'page atelier pointe vers interpolation');
    assert(html.includes('/galton'), 'page atelier pointe vers la planche de Galton');
    assert(html.includes('/coffre'), 'page atelier pointe vers le jeu du coffre');
    assert(html.includes('generator.R') && html.includes('polynome.R'), 'page atelier garde les sources R');
}

function testGeneratorTool() {
    const generator = loadBrowserModule('www/js/generator.js');
    const rawValues = generator.rawGenerator(100, 10, 5, { ensureCount: true });
    const composedValues = generator.generator2(5);
    const shiftedValues = generator.generator2(5, { startIndex: 1000 });
    const timeIndex = generator.timeStartIndex(1710000000123);
    const csv = generator.toCsv(composedValues);
    const resultStats = generator.stats(composedValues);

    assert(rawValues.length === 5, 'generateur brut peut produire le bon nombre de valeurs');
    assert(rawValues.every((value) => Number.isInteger(value) && value >= 0 && value < 100), 'generateur brut respecte la borne');
    assert(composedValues.length === 5, 'generator2 produit exactement n valeurs');
    assert(composedValues.every((value) => value >= 0 && value < 1), 'generator2 reste dans [0, 1)');
    assert(shiftedValues.join(',') !== composedValues.join(','), 'generator2 accepte un index de depart');
    assert(Number.isInteger(timeIndex) && timeIndex >= 0, 'generateur derive un index depuis le temps');
    assert(csv.startsWith('index,value'), 'generateur exporte un CSV avec entete');
    assert(resultStats.count === 5 && Number.isFinite(resultStats.mean), 'generateur calcule des statistiques');
    assert(Math.abs(generator.stats([1, 2, 3]).populationVariance - 2 / 3) < 1e-12, 'variance population correcte');
    assert(Math.abs(generator.stats([1, 2, 3]).sampleVariance - 1) < 1e-12, 'variance corrigee correcte');
}

function testRegressionTool() {
    const regression = loadBrowserModule('www/js/regression.js');
    const points = regression.parsePoints('-1,1\n0,0\n1,1\n2,4');
    const coefficients = regression.interpolate(points);
    const stats = regression.errorStats(points, coefficients);
    const formula = regression.polynomialToString(coefficients);
    const residuals = regression.residualsToString(stats);
    const rationalPoints = regression.parsePoints('0,1/2\n1,1\n2,5/2');
    const rationalCoefficients = regression.interpolate(rationalPoints);
    const rationalFormula = regression.polynomialToString(rationalCoefficients);
    const rationalDetails = regression.coefficientsToString(rationalCoefficients);
    const rationalLatex = regression.polynomialToLatex(rationalCoefficients);
    const rationalLatexDetails = regression.coefficientsToLatex(rationalCoefficients);
    const rationalPython = regression.polynomialToCode(rationalCoefficients, 'python');
    const rationalJavascript = regression.polynomialToCode(rationalCoefficients, 'javascript');
    const exactHalfValue = regression.evaluatePolynomialExact(rationalCoefficients, regression.Fraction.parse('1/2')).toString();
    const rationalStats = regression.errorStats(rationalPoints, rationalCoefficients);

    assert(points.length === 4, 'regression parse les couples X/Y');
    assert(points.every((point) => Math.abs(regression.evaluatePolynomial(coefficients, point.x) - point.y) < 1e-6), 'regression interpole les points');
    assert(stats.maxError < 1e-6 && stats.exactWithinTolerance, 'regression mesure les residus numeriques');
    assert(formula.includes('P(x)'), 'regression formate le polynome');
    assert(residuals.includes('P(x)=') && residuals.includes('r='), 'regression detaille les residus');
    assert(rationalFormula.includes('1/2x^2') && rationalFormula.includes('+ 1/2'), 'regression affiche les coefficients rationnels exacts');
    assert(rationalDetails.includes('a_2 = 1/2') && exactHalfValue === '5/8', 'regression calcule exactement avec des fractions');
    assert(rationalStats.exactWithinTolerance && rationalStats.residuals.every((item) => item.residualExact.toString() === '0'), 'regression garde des residus exacts nuls');
    assert(rationalLatex.includes('\\frac{1}{2}x^{2}') && rationalLatexDetails.includes('a_{2} = \\frac{1}{2}'), 'regression exporte du LaTeX');
    assert(rationalPython.includes('from fractions import Fraction') && rationalPython.includes('x**2'), 'regression exporte du Python exact');
    assert(rationalJavascript.includes('function P(x)') && rationalJavascript.includes('Math.pow(x, 2)'), 'regression exporte du JavaScript');
}

function testGaltonTool() {
    const galton = loadBrowserModule('www/js/galton.js');
    const probabilities = galton.expectedCounts(4, 0.5, 16);
    const normalApproximation = galton.expectedCounts(10, 0.5, 100, 'normal');
    const deterministicRandom = (() => {
        const values = [0.1, 0.9, 0.2, 0.8];
        let index = 0;
        return () => values[index++ % values.length];
    })();
    const slot = galton.simulateSlot(4, 0.5, deterministicRandom);

    assert(Math.abs(galton.binomialProbability(4, 2, 0.5) - 0.375) < 1e-12, 'galton calcule une probabilite binomiale');
    assert(probabilities.length === 5 && Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 16) < 1e-9, 'galton calcule les effectifs attendus');
    assert(normalApproximation.length === 11 && Math.abs(normalApproximation.reduce((sum, value) => sum + value, 0) - 100) < 1e-6, 'galton calcule les effectifs attendus en approximation normale');
    assert(galton.slotIntervalLabel(10, 4) === '[3.5 ; 4.5]' && galton.slotIntervalLabel(10, 0).includes(String.fromCharCode(8734)), 'galton nomme les intervalles des cases');
    assert(slot.rights === 2 && slot.choices.join(',') === '1,0,1,0', 'galton simule les choix gauche/droite');
}

function testCoffreTool() {
    const coffre = loadBrowserModule('www/js/coffre.js');

    assert(coffre.randomCode(() => 0) === 0 && coffre.randomCode(() => 0.999) === 7, 'coffre tire un code entre 0 et 7');
    assert(coffre.toggleBit(0, 1) === 1 && coffre.toggleBit(1, 1) === 0, 'coffre active et desactive un interrupteur');
    assert(coffre.toggleBit(1, 4) === 5, 'coffre additionne les bits 1, 2 et 4');
    assert(coffre.isCorrect(6, 6) && !coffre.isCorrect(2, 6), 'coffre valide uniquement le bon code');
    assert(coffre.binaryLabel(5) === '101', 'coffre formate le code en trois bits');
    assert(coffre.colorForCode(3).name === 'jaune' && coffre.colorForCode(7).name === 'blanc', 'coffre associe les couleurs additives');
}

function testThreeDPage() {
    assert(!fs.existsSync(path.join(root, '3D')), 'pas de doublon 3D a la racine');
    assert(fs.existsSync(publicThreeDRoot), 'www/3D contient la scene 3D');

    const html = read('www/3D/index.html');
    const localScripts = getHtmlReferences(html)
        .filter((reference) => reference.endsWith('.js') && !isExternalUrl(reference));

    assert(localScripts.length > 0, 'www/3D/index.html charge des scripts locaux');

    localScripts.forEach((script) => {
        const resolvedPath = resolveSiteReference(script, 'www/3D/index.html');
        assert(fs.existsSync(resolvedPath), `3D script disponible: ${script}`);
    });
}

function testDevServerContract() {
    const server = read('scripts/dev-server.js');
    const htaccess = read('www/.htaccess');

    assert(server.includes("const siteRoot = path.join(projectRoot, 'www')"), 'serveur local sert www comme racine');
    assert(server.includes("const threeDRoot = path.join(siteRoot, '3D')"), 'serveur local expose le dossier 3D publie');
    assert(server.includes('safeResolve'), 'serveur local garde une resolution de chemin securisee');
    assert(server.includes('EADDRINUSE'), 'serveur local gere les ports deja utilises');
    assert(server.includes("'/atelier': 'outils.html'"), 'serveur local mappe /atelier');
    assert(server.includes("'/interpolation': 'regression.html'"), 'serveur local mappe /interpolation');
    assert(server.includes("'/galton': 'galton.html'"), 'serveur local mappe /galton');
    assert(server.includes("'/coffre': 'coffre.html'"), 'serveur local mappe /coffre');
    assert(htaccess.includes('RewriteRule ^atelier') && htaccess.includes('RewriteRule ^interpolation') && htaccess.includes('RewriteRule ^galton') && htaccess.includes('RewriteRule ^coffre'), 'htaccess mappe les URLs propres');
}

testRequiredFiles();
testLocalReferences();
testHomePage();
testToolsLandingPage();
testCvPage();
testGeneratorTool();
testRegressionTool();
testGaltonTool();
testCoffreTool();
testThreeDPage();
testDevServerContract();

if (failureCount > 0) {
    console.error(`\n${failureCount} test(s) en echec.`);
    process.exit(1);
}

console.log('\nTous les tests site sont OK.');

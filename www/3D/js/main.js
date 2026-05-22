// ============================================
// MAIN - Point d'entree du campus 3D
// ============================================

let scene, camera, renderer;
let world, city, car, carController, collisionSystem;
let activeChapter;
let clock;

function init() {
    if (typeof THREE === 'undefined') {
        showStartupError("Three.js ne s'est pas chargé. La page 3D a besoin du fichier three.min.js depuis le CDN, ou d'une copie locale.");
        return;
    }

    activeChapter = getChapterTemplate();
    updateInfoPanel(activeChapter);
    updateChapterNavigation();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(CampusTheme.colors.sky);
    scene.fog = new THREE.Fog(CampusTheme.colors.fog, 58, 150);

    camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 260);
    camera.position.set(0, 9, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: window.devicePixelRatio <= 1.5,
        powerPreference: 'high-performance'
    });
    renderer.setClearColor(CampusTheme.colors.sky);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    setupLights();
    clock = new THREE.Clock();

    world = new World(scene, activeChapter.world);
    city = new CityGenerator(scene, activeChapter.scene);
    city.generate();

    car = new Car(scene);
    applySpawn(activeChapter.spawn);

    collisionSystem = new CollisionSystem(car, city.getBuildings(), world, [
        ...world.getColliders(),
        ...city.getColliders()
    ]);
    carController = new CarController(car, collisionSystem, camera, {
        portals: city.getPortals()
    });

    window.addEventListener('resize', onWindowResize);
    animate();
}

function showStartupError(message) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    container.innerHTML = `
        <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#07101d;color:white;font-family:Arial,sans-serif;text-align:center;">
            <div style="max-width:560px;padding:24px;border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.08);">
                <h1 style="margin:0 0 12px;font-size:24px;">Campus 3D indisponible</h1>
                <p style="margin:0;line-height:1.5;">${message}</p>
            </div>
        </div>
    `;
}

function setupLights() {
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, CampusTheme.colors.grassDark, 0.82);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xfff2d6, 0.78);
    directionalLight.position.set(14, 22, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.left = -38;
    directionalLight.shadow.camera.right = 38;
    directionalLight.shadow.camera.top = 38;
    directionalLight.shadow.camera.bottom = -38;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(CampusTheme.colors.cyan, 0.22);
    fillLight.position.set(-18, 8, -12);
    scene.add(fillLight);
}

function applySpawn(spawn = {}) {
    car.position.x = spawn.x || 0;
    car.position.z = spawn.z || 12;
    car.rotation = spawn.rotation || 0;
    car.updatePosition();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateInfoPanel(chapter) {
    const title = document.getElementById('chapter-title');
    const subtitle = document.getElementById('chapter-subtitle');

    if (title) title.textContent = chapter.title;
    if (subtitle) subtitle.textContent = chapter.subtitle;
}

function updateChapterNavigation() {
    const navigation = document.getElementById('chapter-nav');
    if (!navigation) return;

    navigation.innerHTML = '';

    Object.values(ChapterTemplates).forEach((chapter) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = chapter.id === 'default' ? 'Hub' : chapter.title.replace('Chapitre ', '');
        button.className = chapter.id === activeChapter.id ? 'active' : '';
        button.addEventListener('click', () => {
            window.location.href = getChapterUrl(chapter.id);
        });
        navigation.appendChild(button);
    });
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = Math.min(clock.getDelta(), 0.033);

    world.update(deltaTime);
    city.update(deltaTime);
    collisionSystem.update();
    carController.update(deltaTime);
    car.update(deltaTime);

    renderer.render(scene, camera);
}

window.addEventListener('load', init);

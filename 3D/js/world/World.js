// ============================================
// WORLD - Ile cartoon optimisee pour les chapitres
// ============================================

class World {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.radius = options.radius || 64;
        this.warningZoneRadius = options.warningZoneRadius || 55;
        this.teleportZoneRadius = options.teleportZoneRadius || 60;
        this.showDome = options.showDome !== false;
        this.animateDome = options.animateDome === true;
        this.dome = null;
        this.boundaryRing = null;
        this.colliders = [];

        this.createIsland();
        this.createPathNetwork();
        this.createSoftMounds();
        this.createBoundary();

        if (this.showDome) {
            this.createDome();
        }
    }

    createIsland() {
        const sideGeometry = new THREE.CylinderGeometry(this.radius, this.radius * 0.92, 3, 72);
        const sideMaterial = CampusTheme.material(CampusTheme.colors.islandSide, { shininess: 35 });
        const side = new THREE.Mesh(sideGeometry, sideMaterial);
        side.position.y = -1.55;
        side.receiveShadow = true;
        this.scene.add(side);

        const groundGeometry = new THREE.CircleGeometry(this.radius, 72);
        const groundTexture = TextureGenerator.createCartoonGroundTexture();
        const groundMaterial = CampusTheme.material(CampusTheme.colors.grass, { shininess: 48 });
        groundMaterial.map = groundTexture;

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0.02;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        const shore = new THREE.Mesh(
            new THREE.TorusGeometry(this.radius - 0.8, 0.45, 8, 96),
            CampusTheme.material(CampusTheme.colors.grassLight, { shininess: 85 })
        );
        shore.rotation.x = -Math.PI / 2;
        shore.position.y = 0.16;
        this.scene.add(shore);
    }

    createPathNetwork() {
        const center = new THREE.Mesh(
            new THREE.CylinderGeometry(8.5, 10, 0.34, 48),
            CampusTheme.material(CampusTheme.colors.path, { shininess: 95 })
        );
        center.position.y = 0.2;
        center.receiveShadow = true;
        this.scene.add(center);

        const centerInset = new THREE.Mesh(
            new THREE.CylinderGeometry(5.2, 6.1, 0.38, 48),
            CampusTheme.material(CampusTheme.colors.grassLight, { shininess: 75 })
        );
        centerInset.position.y = 0.24;
        centerInset.receiveShadow = true;
        this.scene.add(centerInset);

        this.createPathStrip(0, 17, 4.5, 34, 0);
        this.createPathStrip(-15, 5, 3.7, 22, Math.PI / 4);
        this.createPathStrip(15, 5, 3.7, 22, -Math.PI / 4);

        const accentRing = new THREE.Mesh(
            new THREE.TorusGeometry(9.8, 0.14, 8, 72),
            CampusTheme.material(CampusTheme.colors.pathShadow, { shininess: 100 })
        );
        accentRing.rotation.x = -Math.PI / 2;
        accentRing.position.y = 0.47;
        this.scene.add(accentRing);
    }

    createPathStrip(x, z, width, depth, rotation) {
        const geometry = new THREE.BoxGeometry(width, 0.28, depth);
        const material = CampusTheme.material(CampusTheme.colors.path, { shininess: 85 });
        const strip = new THREE.Mesh(geometry, material);
        strip.position.set(x, 0.18, z);
        strip.rotation.y = rotation;
        strip.receiveShadow = true;
        this.scene.add(strip);

        const capGeometry = new THREE.CylinderGeometry(width / 2, width / 2, 0.3, 24);
        [-1, 1].forEach((side) => {
            const cap = new THREE.Mesh(capGeometry, material);
            cap.position.set(
                x + Math.sin(rotation) * depth * 0.5 * side,
                0.19,
                z + Math.cos(rotation) * depth * 0.5 * side
            );
            cap.receiveShadow = true;
            this.scene.add(cap);
        });
    }

    createSoftMounds() {
        const moundMaterial = CampusTheme.material(CampusTheme.colors.grassDark, { shininess: 55 });
        const positions = [
            [-32, -12, 5, 1.2, 3.5],
            [30, -10, 4.5, 1.1, 4],
            [-25, 26, 4, 1, 3],
            [25, 25, 4.2, 1, 3.5],
            [-42, 8, 3.4, 0.8, 2.8],
            [42, 8, 3.4, 0.8, 2.8]
        ];

        positions.forEach(([x, z, sx, sy, sz], index) => {
            const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), moundMaterial);
            mound.position.set(x, 0.32, z);
            mound.scale.set(sx, sy, sz);
            mound.rotation.y = (x + z) * 0.03;
            mound.receiveShadow = true;
            this.scene.add(mound);

            this.colliders.push({
                id: `mound-${index}`,
                type: 'circle',
                x,
                z,
                radius: Math.max(sx, sz) * 0.72,
                height: 0.32 + sy
            });
        });
    }

    createBoundary() {
        this.boundaryRing = new THREE.Mesh(
            new THREE.TorusGeometry(this.warningZoneRadius, 0.16, 8, 96),
            CampusTheme.material(CampusTheme.colors.cyan, {
                shininess: 110,
                emissive: CampusTheme.colors.cyan,
                emissiveIntensity: 0.08
            })
        );
        this.boundaryRing.rotation.x = -Math.PI / 2;
        this.boundaryRing.position.y = 0.55;
        this.scene.add(this.boundaryRing);
    }

    createDome() {
        const domeGeometry = new THREE.SphereGeometry(this.teleportZoneRadius, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.34);
        const domeMaterial = CampusTheme.material(CampusTheme.colors.sky, {
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            shininess: 100
        });

        this.dome = new THREE.Mesh(domeGeometry, domeMaterial);
        this.dome.position.y = -8;
        this.scene.add(this.dome);
    }

    update() {
        if (this.animateDome && this.dome) {
            this.dome.rotation.y += 0.0002;
        }
    }

    checkBoundary(position) {
        const distance = Math.sqrt(position.x * position.x + position.z * position.z);
        return {
            distance,
            inWarningZone: distance > this.warningZoneRadius,
            inTeleportZone: distance > this.teleportZoneRadius
        };
    }

    getRadius() {
        return this.radius;
    }

    getWarningZoneRadius() {
        return this.warningZoneRadius;
    }

    getTeleportZoneRadius() {
        return this.teleportZoneRadius;
    }

    getColliders() {
        return this.colliders;
    }
}

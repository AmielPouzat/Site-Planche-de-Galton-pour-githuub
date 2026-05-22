// ============================================
// SCENE GENERATOR - Portails et futurs objets du chapitre
// ============================================

class CityGenerator {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = options;
        this.buildings = [];
        this.portals = [];
        this.colliders = [];
        this.mainBuilding = null;
    }

    generate() {
        this.createOptionalBuildings();
        this.createPortals();

        return {
            mainBuilding: this.mainBuilding,
            buildings: this.buildings,
            portals: this.portals,
            colliders: this.colliders
        };
    }

    createOptionalBuildings() {
        const buildingConfigs = this.options.buildings || [];

        buildingConfigs.forEach((config) => {
            const building = new Building(config.type || 'house', {
                width: config.width || 4,
                height: config.height || 3,
                depth: config.depth || 4,
                hasEntrance: config.hasEntrance === true,
                entranceRadius: config.entranceRadius || 2.5
            });

            building.setPosition(config.x || 0, building.height / 2, config.z || 0);
            building.setRotation(config.rotation || 0);
            this.scene.add(building.getMesh());
            this.buildings.push(building);

            this.colliders.push({
                id: config.id || `building-${this.colliders.length}`,
                type: 'box',
                x: config.x || 0,
                z: config.z || 0,
                width: config.width || 4,
                depth: config.depth || 4,
                rotation: config.rotation || 0,
                height: config.height || 3,
                clearance: 0.25
            });
        });
    }

    createPortals() {
        const portalConfigs = this.options.portals || [];

        portalConfigs.forEach((config) => {
            const portal = this.createPortal(config);
            this.scene.add(portal.group);
            this.portals.push(portal);
        });
    }

    createPortal(config) {
        const group = new THREE.Group();
        group.position.set(config.x, 0, config.z);

        const color = config.color || CampusTheme.colors.cyan;
        const accent = config.accent || CampusTheme.colors.white;

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.9, 0.55, 36),
            CampusTheme.material(CampusTheme.colors.panel, { shininess: 70 })
        );
        base.position.y = 0.28;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const baseTrim = new THREE.Mesh(
            new THREE.TorusGeometry(2.42, 0.08, 8, 48),
            CampusTheme.material(color, {
                shininess: 120,
                emissive: color,
                emissiveIntensity: 0.08
            })
        );
        baseTrim.rotation.x = -Math.PI / 2;
        baseTrim.position.y = 0.62;
        group.add(baseTrim);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.5, 0.16, 10, 48),
            CampusTheme.material(color, {
                shininess: 125,
                emissive: color,
                emissiveIntensity: 0.18
            })
        );
        ring.position.y = 2.35;
        group.add(ring);

        const core = new THREE.Mesh(
            new THREE.CircleGeometry(1.22, 36),
            CampusTheme.basic(color, {
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        core.position.y = 2.35;
        group.add(core);

        const marker = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.4, 1),
            CampusTheme.material(accent, {
                shininess: 120,
                emissive: accent,
                emissiveIntensity: 0.18
            })
        );
        marker.position.y = 2.35;
        group.add(marker);

        const label = this.createLabel(config.title);
        label.position.y = 4.35;
        group.add(label);

        const portal = {
            title: config.title,
            target: config.target,
            radius: config.radius || 5.6,
            collisionRadius: config.collisionRadius || 2.55,
            group,
            marker,
            ring,
            core
        };

        this.colliders.push({
            id: `portal-${config.target}`,
            type: 'circle',
            x: config.x,
            z: config.z,
            radius: portal.collisionRadius,
            height: config.collisionHeight || 0.72
        });

        return portal;
    }

    createLabel(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 24, 0, 124);
        gradient.addColorStop(0, 'rgba(31, 49, 82, 0.94)');
        gradient.addColorStop(1, 'rgba(12, 21, 42, 0.94)');
        ctx.fillStyle = gradient;
        this.roundRect(ctx, 18, 24, 476, 100, 22);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 4;
        this.roundRect(ctx, 18, 24, 476, 100, 22);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 34px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, 74);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4.2, 1.3, 1);
        return sprite;
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    update() {
        this.buildings.forEach(building => building.update());

        const time = performance.now() * 0.001;
        this.portals.forEach((portal) => {
            portal.marker.rotation.y += 0.025;
            portal.marker.position.y = 2.35 + Math.sin(time * 2) * 0.12;
            portal.core.material.opacity = 0.16 + Math.sin(time * 2.4) * 0.035;
        });
    }

    getBuildings() {
        return this.buildings;
    }

    getPortals() {
        return this.portals;
    }

    getColliders() {
        return this.colliders;
    }

    getMainBuilding() {
        return this.mainBuilding;
    }
}

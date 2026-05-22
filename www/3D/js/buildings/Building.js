// ============================================
// BUILDING - Bâtiment 3D avec toit
// ============================================

class Building {
    constructor(type = 'house', options = {}) {
        this.type = type;
        this.options = options;
        this.group = new THREE.Group();
        this.bounceTimer = 0;
        this.originalPosition = new THREE.Vector3();
        
        this.width = options.width || 4;
        this.height = options.height || 3;
        this.depth = options.depth || 4;
        this.collidable = true;
        this.hasEntrance = options.hasEntrance !== undefined ? options.hasEntrance : true;
        this.entranceRadius = options.entranceRadius || 2.5;
        
        this.createModel();
    }

    createModel() {
        // Create appropriate texture
        let texture;
        if (this.type === 'main') {
            texture = TextureGenerator.createModernHouseTexture();
        } else {
            const useFantasy = Math.random() > 0.6;
            texture = useFantasy 
                ? TextureGenerator.createFantasyHouseTexture()
                : TextureGenerator.createModernHouseTexture();
        }

        // Building walls
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshPhongMaterial({ 
            map: texture,
            shininess: 30
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // Roof
        this.createRoof();

        // Store userData for collision
        this.mesh.userData = {
            width: this.width,
            height: this.height,
            depth: this.depth,
            collidable: this.collidable,
            bounceTimer: 0,
            hasEntrance: this.hasEntrance,
            entranceRadius: this.entranceRadius
        };
    }

    createRoof() {
        const roofColors = ['red', 'brown', 'blue'];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
        const roofTexture = TextureGenerator.createCartoonRoofTexture(roofColor);

        const roofHeight = this.type === 'main' ? 1.5 : 1.0;
        const overhang = 0.3;
        const roofWidth = this.width + overhang * 2;
        const roofDepth = this.depth + overhang * 2;

        const roofGeometry = new THREE.ConeGeometry(
            Math.max(roofWidth, roofDepth) * 0.75,
            roofHeight,
            4
        );
        
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            map: roofTexture,
            shininess: 40
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = this.height / 2 + roofHeight / 2;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        
        // Scale roof to fit building
        const scaleX = roofWidth / (Math.max(roofWidth, roofDepth) * 0.75 * 1.4);
        const scaleZ = roofDepth / (Math.max(roofWidth, roofDepth) * 0.75 * 1.4);
        roof.scale.set(scaleX, 1, scaleZ);
        
        this.group.add(roof);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
        this.originalPosition.set(x, y, z);
        this.mesh.userData.originalPosition = this.originalPosition.clone();
    }

    setRotation(y) {
        this.group.rotation.y = y;
    }

    triggerBounce() {
        this.bounceTimer = 1.0;
        this.mesh.userData.bounceTimer = 1.0;
    }

    updateBounce() {
        if (this.bounceTimer > 0) {
            this.bounceTimer -= 0.05;
            
            const bounceHeight = Math.sin(this.bounceTimer * Math.PI) * 0.3;
            this.group.position.y = this.originalPosition.y + bounceHeight;
            
            this.mesh.material.emissive.setHex(0x444444);
            this.mesh.material.emissiveIntensity = this.bounceTimer * 0.3;
            
            if (this.bounceTimer <= 0) {
                this.bounceTimer = 0;
                this.group.position.y = this.originalPosition.y;
                this.mesh.material.emissive.setHex(0x000000);
                this.mesh.material.emissiveIntensity = 0;
            }
        }
    }

    getBoundingBox() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const halfDepth = this.depth / 2;
        const center = this.group.position;
        const rotation = this.group.rotation.y;

        const corners = [
            new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth),
            new THREE.Vector3(halfWidth, -halfHeight, -halfDepth),
            new THREE.Vector3(-halfWidth, halfHeight, -halfDepth),
            new THREE.Vector3(halfWidth, halfHeight, -halfDepth),
            new THREE.Vector3(-halfWidth, -halfHeight, halfDepth),
            new THREE.Vector3(halfWidth, -halfHeight, halfDepth),
            new THREE.Vector3(-halfWidth, halfHeight, halfDepth),
            new THREE.Vector3(halfWidth, halfHeight, halfDepth)
        ];

        const rotatedCorners = corners.map(corner => {
            const rotated = corner.clone();
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const rx = rotated.x * cos - rotated.z * sin;
            const rz = rotated.x * sin + rotated.z * cos;
            rotated.x = rx + center.x;
            rotated.y = rotated.y + center.y;
            rotated.z = rz + center.z;
            return rotated;
        });

        const box = new THREE.Box3();
        box.setFromPoints(rotatedCorners);
        return box;
    }

    getMesh() {
        return this.group;
    }

    getCollisionMesh() {
        return this.mesh;
    }

    update() {
        this.updateBounce();
    }
}

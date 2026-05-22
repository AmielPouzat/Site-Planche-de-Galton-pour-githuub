// ============================================
// PLAYER - Avatar boule pour tester la scene
// Garde le nom Car pour rester compatible avec le controleur existant.
// ============================================

class Car {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.wheels = [];
        this.jumpY = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.airVelocity = { x: 0, z: 0 };
        this.rotation = 0;
        this.speed = 0;
        this.position = { x: 0, y: 0, z: 12 };

        this.createModel();
    }

    createModel() {
        this.shadow = new THREE.Mesh(
            new THREE.CircleGeometry(1.25, 32),
            CampusTheme.basic(0x000000, { transparent: true, opacity: 0.18, depthWrite: false })
        );
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = 0.04;
        this.shadowBaseOpacity = this.shadow.material.opacity;
        this.group.add(this.shadow);

        this.body = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 24, 16),
            CampusTheme.material(CampusTheme.colors.cyan, {
                shininess: 120,
                emissive: CampusTheme.colors.cyan,
                emissiveIntensity: 0.05
            })
        );
        this.body.position.y = 0.98;
        this.body.castShadow = true;
        this.group.add(this.body);

        const highlight = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 12, 8),
            CampusTheme.basic(CampusTheme.colors.white, { transparent: true, opacity: 0.55 })
        );
        highlight.position.set(-0.32, 1.35, 0.42);
        this.group.add(highlight);

        this.pointer = new THREE.Mesh(
            new THREE.ConeGeometry(0.28, 0.8, 3),
            CampusTheme.material(CampusTheme.colors.yellow, { shininess: 100 })
        );
        this.pointer.position.set(0, 0.98, 0.94);
        this.pointer.rotation.x = Math.PI / 2;
        this.group.add(this.pointer);

        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.group);
    }

    getHitboxDimensions() {
        return {
            width: 1.8,
            height: 1.8,
            depth: 1.8,
            yOffset: 0.9
        };
    }

    getCollisionShapeAt(x, z) {
        const dims = this.getHitboxDimensions();

        return {
            type: 'circle',
            x,
            z,
            radius: 0.9,
            bottom: this.jumpY,
            top: this.jumpY + dims.height
        };
    }

    triggerJump() {
        if (!this.isGrounded) return;
        this.beginJump(0, 0);
        this.verticalVelocity = 4;
    }

    beginJump(velocityX, velocityZ) {
        this.isGrounded = false;
        this.verticalVelocity = Math.max(this.verticalVelocity, 0.2);
        this.airVelocity.x = velocityX;
        this.airVelocity.z = velocityZ;
    }

    applyJumpForce(deltaTime, acceleration, maxVelocity) {
        this.verticalVelocity = Math.min(
            this.verticalVelocity + acceleration * deltaTime,
            maxVelocity
        );
    }

    applyGravity(deltaTime, gravity) {
        this.verticalVelocity -= gravity * deltaTime;
    }

    integrateVertical(deltaTime) {
        if (this.isGrounded) return false;

        this.jumpY += this.verticalVelocity * deltaTime;

        if (this.jumpY <= 0) {
            this.jumpY = 0;
            this.verticalVelocity = 0;
            this.airVelocity.x = 0;
            this.airVelocity.z = 0;
            this.isGrounded = true;
            return true;
        }

        return false;
    }

    applyAirDrag(deltaTime, drag) {
        const dragFactor = Math.max(0, 1 - drag * deltaTime);
        this.airVelocity.x *= dragFactor;
        this.airVelocity.z *= dragFactor;
    }

    updateWheels(deltaTime) {
        const rollSpeed = this.isGrounded
            ? this.speed
            : Math.sqrt(this.airVelocity.x * this.airVelocity.x + this.airVelocity.z * this.airVelocity.z);

        this.body.rotation.x += rollSpeed * deltaTime * 2.2;
        this.body.rotation.z += Math.sin(this.rotation) * rollSpeed * deltaTime * 0.6;
    }

    updatePosition() {
        this.group.position.set(this.position.x, this.jumpY, this.position.z);
        this.group.rotation.y = this.rotation;
        this.updateShadow();
    }

    updateShadow() {
        if (!this.shadow) return;

        const jumpHeight = Math.min(this.jumpY, 12);
        const shadowScale = Math.max(0.45, 1 - jumpHeight * 0.045);
        const shadowOpacity = Math.max(0.05, this.shadowBaseOpacity * (1 - jumpHeight * 0.06));

        this.shadow.position.y = 0.04 - this.jumpY;
        this.shadow.scale.set(shadowScale, shadowScale, 1);
        this.shadow.material.opacity = shadowOpacity;
    }

    getBoundingBoxAt(x, z, rotation) {
        const dims = this.getHitboxDimensions();
        const halfWidth = dims.width / 2;
        const halfHeight = dims.height / 2;
        const halfDepth = dims.depth / 2;
        const carY = this.jumpY + dims.yOffset;

        const corners = [
            new THREE.Vector3(-halfWidth, carY - halfHeight, -halfDepth),
            new THREE.Vector3(halfWidth, carY - halfHeight, -halfDepth),
            new THREE.Vector3(-halfWidth, carY + halfHeight, -halfDepth),
            new THREE.Vector3(halfWidth, carY + halfHeight, -halfDepth),
            new THREE.Vector3(-halfWidth, carY - halfHeight, halfDepth),
            new THREE.Vector3(halfWidth, carY - halfHeight, halfDepth),
            new THREE.Vector3(-halfWidth, carY + halfHeight, halfDepth),
            new THREE.Vector3(halfWidth, carY + halfHeight, halfDepth)
        ];

        const rotatedCorners = corners.map(corner => {
            const rotated = corner.clone();
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const rx = rotated.x * cos - rotated.z * sin;
            const rz = rotated.x * sin + rotated.z * cos;
            rotated.x = rx + x;
            rotated.z = rz + z;
            return rotated;
        });

        const box = new THREE.Box3();
        box.setFromPoints(rotatedCorners);
        return box;
    }

    update(deltaTime = 1 / 60) {
        this.updateWheels(deltaTime);
        this.updatePosition();
    }
}

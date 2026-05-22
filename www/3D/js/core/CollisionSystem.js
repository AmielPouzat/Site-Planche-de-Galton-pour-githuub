// ============================================
// COLLISION SYSTEM - Collisions au sol avec franchissement vertical simple
// ============================================

class CollisionSystem {
    constructor(player, buildings, world, colliders = []) {
        this.player = player;
        this.buildings = buildings;
        this.world = world;
        this.colliders = colliders;
        this.keys = {};
    }

    setKeys(keys) {
        this.keys = keys;
    }

    setColliders(colliders) {
        this.colliders = colliders;
    }

    checkCarCollision(newX, newZ) {
        const playerCollider = this.player.getCollisionShapeAt(newX, newZ);

        for (const collider of this.colliders) {
            if (collider.enabled === false) continue;
            if (this.canPassOver(playerCollider, collider)) continue;

            const result = this.checkCollider(playerCollider, collider);
            if (result.collision) {
                return result;
            }
        }

        for (const building of this.buildings) {
            if (!building.collidable) continue;

            const buildingBox = building.getBoundingBox();
            const playerBox = this.player.getBoundingBoxAt(newX, newZ, this.player.rotation);

            if (playerBox.intersectsBox(buildingBox)) {
                building.triggerBounce();
                return {
                    collision: true,
                    normal: new THREE.Vector3(0, 0, 0),
                    collider: building
                };
            }
        }

        return {
            collision: false,
            normal: new THREE.Vector3(0, 0, 0),
            entered: false
        };
    }

    canPassOver(playerCollider, collider) {
        if (collider.height === undefined) return false;

        const clearance = collider.clearance ?? 0.18;
        return playerCollider.bottom > collider.height + clearance;
    }

    checkCollider(playerCollider, collider) {
        if (collider.type === 'circle') {
            return this.checkCircleCollision(playerCollider, collider);
        }

        if (collider.type === 'box') {
            return this.checkBoxCollision(playerCollider, collider);
        }

        return { collision: false, normal: new THREE.Vector3(0, 0, 0) };
    }

    checkCircleCollision(playerCollider, collider) {
        const dx = playerCollider.x - collider.x;
        const dz = playerCollider.z - collider.z;
        const minDistance = playerCollider.radius + collider.radius;
        const distanceSquared = dx * dx + dz * dz;

        if (distanceSquared >= minDistance * minDistance) {
            return { collision: false, normal: new THREE.Vector3(0, 0, 0) };
        }

        const distance = Math.sqrt(distanceSquared) || 0.0001;

        return {
            collision: true,
            normal: new THREE.Vector3(dx / distance, 0, dz / distance),
            collider
        };
    }

    checkBoxCollision(playerCollider, collider) {
        const rotation = collider.rotation || 0;
        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);
        const dx = playerCollider.x - collider.x;
        const dz = playerCollider.z - collider.z;
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;
        const halfWidth = collider.width / 2;
        const halfDepth = collider.depth / 2;

        const closestX = Math.max(-halfWidth, Math.min(localX, halfWidth));
        const closestZ = Math.max(-halfDepth, Math.min(localZ, halfDepth));
        const deltaX = localX - closestX;
        const deltaZ = localZ - closestZ;
        const distanceSquared = deltaX * deltaX + deltaZ * deltaZ;

        if (distanceSquared >= playerCollider.radius * playerCollider.radius) {
            return { collision: false, normal: new THREE.Vector3(0, 0, 0) };
        }

        const distance = Math.sqrt(distanceSquared) || 0.0001;
        const normalLocalX = deltaX / distance;
        const normalLocalZ = deltaZ / distance;
        const worldNormalX = normalLocalX * Math.cos(rotation) - normalLocalZ * Math.sin(rotation);
        const worldNormalZ = normalLocalX * Math.sin(rotation) + normalLocalZ * Math.cos(rotation);

        return {
            collision: true,
            normal: new THREE.Vector3(worldNormalX, 0, worldNormalZ),
            collider
        };
    }

    checkWorldBoundary(position) {
        const boundary = this.world.checkBoundary(position);

        if (boundary.inTeleportZone) {
            return { shouldTeleport: true };
        }

        if (boundary.inWarningZone) {
            return {
                inWarning: true,
                progress: (boundary.distance - this.world.getWarningZoneRadius()) /
                         (this.world.getTeleportZoneRadius() - this.world.getWarningZoneRadius())
            };
        }

        return { inWarning: false, shouldTeleport: false };
    }

    update() {}
}

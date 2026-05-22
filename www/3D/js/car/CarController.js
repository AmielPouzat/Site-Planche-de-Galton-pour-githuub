// ============================================
// CAR CONTROLLER - Deplacement, camera, saut et interactions
// ============================================

class CarController {
    constructor(car, collisionSystem, camera, options = {}) {
        this.car = car;
        this.collisionSystem = collisionSystem;
        this.camera = camera;
        this.portals = options.portals || [];
        this.keys = {};
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionData = null;
        this.hasTeleported = false;
        this.wasInteractPressed = false;
        this.wasJumpHeld = false;
        this.jumpBoosting = false;
        this.jumpBoostTime = 0;
        this.cameraLookAt = new THREE.Vector3(this.car.position.x, 1.8, this.car.position.z);
        this.promptElement = document.getElementById('interaction-prompt');
        this.controlCodes = new Set([
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'KeyW',
            'KeyA',
            'KeyS',
            'KeyD',
            'Space',
            'KeyE'
        ]);

        this.maxGroundSpeed = 12;
        this.maxReverseSpeed = 7;
        this.groundAcceleration = 42;
        this.groundFriction = 7.5;
        this.turnSpeed = 2.25;
        this.minJumpVelocity = this.maxGroundSpeed * 0.65;
        this.maxJumpVelocity = this.maxGroundSpeed * 2;
        this.jumpBoostAcceleration = 54;
        this.maxJumpBoostTime = 0.42;
        this.gravity = 46;
        this.airDrag = 0.82;
        this.physicsStep = 1 / 90;

        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            if (this.controlCodes.has(event.code)) {
                event.preventDefault();
            }
            this.keys[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            if (this.controlCodes.has(event.code)) {
                event.preventDefault();
            }
            this.keys[event.code] = false;
        });
    }

    update(deltaTime = 1 / 60) {
        if (this.isTransitioning) {
            this.updateTransition(deltaTime);
            return;
        }

        this.handleInput(deltaTime);
        this.checkWorldBoundary();
        this.checkPortals();
        this.updateCamera(deltaTime);
    }

    handleInput(deltaTime) {
        let remainingTime = Math.min(deltaTime, 0.05);
        const jumpHeld = this.keys['Space'] === true;
        let jumpPressed = jumpHeld && !this.wasJumpHeld;

        while (remainingTime > 0) {
            const step = Math.min(this.physicsStep, remainingTime);
            this.collisionSystem.setKeys(this.keys);

            if (this.car.isGrounded) {
                this.handleGroundInput(step, jumpPressed);
            } else {
                this.handleAirPhysics(step, jumpHeld);
            }

            jumpPressed = false;
            remainingTime -= step;
        }

        this.wasJumpHeld = jumpHeld;
    }

    handleGroundInput(deltaTime, jumpPressed) {
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.car.speed = Math.min(
                this.car.speed + this.groundAcceleration * deltaTime,
                this.maxGroundSpeed
            );
        } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.car.speed = Math.max(
                this.car.speed - this.groundAcceleration * deltaTime,
                -this.maxReverseSpeed
            );
        } else {
            const friction = Math.max(0, 1 - this.groundFriction * deltaTime);
            this.car.speed *= friction;
            if (Math.abs(this.car.speed) < 0.02) this.car.speed = 0;
        }

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.car.rotation += this.turnSpeed * deltaTime;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.car.rotation -= this.turnSpeed * deltaTime;
        }

        const newX = this.car.position.x + Math.sin(this.car.rotation) * this.car.speed * deltaTime;
        const newZ = this.car.position.z + Math.cos(this.car.rotation) * this.car.speed * deltaTime;
        const moved = this.moveWithCollisions(newX, newZ);

        if (!moved) {
            this.car.speed = 0;
        }

        if (jumpPressed) {
            this.startJumpFromGround();
        }
    }

    startJumpFromGround() {
        const forwardX = Math.sin(this.car.rotation);
        const forwardZ = Math.cos(this.car.rotation);

        this.car.beginJump(forwardX * this.car.speed, forwardZ * this.car.speed);
        this.car.verticalVelocity = this.minJumpVelocity;
        this.jumpBoosting = true;
        this.jumpBoostTime = 0;
    }

    handleAirPhysics(deltaTime, jumpHeld) {
        if (jumpHeld && this.jumpBoosting && this.jumpBoostTime < this.maxJumpBoostTime) {
            this.car.verticalVelocity = Math.min(
                this.car.verticalVelocity + this.jumpBoostAcceleration * deltaTime,
                this.maxJumpVelocity
            );
            this.jumpBoostTime += deltaTime;

            if (this.car.verticalVelocity >= this.maxJumpVelocity) {
                this.jumpBoosting = false;
            }
        } else {
            this.jumpBoosting = false;
        }

        const gravityMultiplier = !jumpHeld && this.car.verticalVelocity > 0
            ? 1.9
            : (this.car.verticalVelocity < 0 ? 1.12 : 1);
        this.car.applyGravity(deltaTime, this.gravity * gravityMultiplier);

        this.car.applyAirDrag(deltaTime, this.airDrag);

        const newX = this.car.position.x + this.car.airVelocity.x * deltaTime;
        const newZ = this.car.position.z + this.car.airVelocity.z * deltaTime;
        const moved = this.moveWithCollisions(newX, newZ);

        if (!moved) {
            this.car.airVelocity.x = 0;
            this.car.airVelocity.z = 0;
        }

        const landed = this.car.integrateVertical(deltaTime);
        if (landed) {
            this.jumpBoosting = false;
            this.jumpBoostTime = 0;
        }
    }

    moveWithCollisions(newX, newZ) {
        const result = this.collisionSystem.checkCarCollision(newX, newZ);

        if (!result.collision) {
            this.car.position.x = newX;
            this.car.position.z = newZ;
            return true;
        }

        const slideX = this.collisionSystem.checkCarCollision(newX, this.car.position.z);
        if (!slideX.collision) {
            this.car.position.x = newX;
            this.car.speed *= 0.82;
            return true;
        }

        const slideZ = this.collisionSystem.checkCarCollision(this.car.position.x, newZ);
        if (!slideZ.collision) {
            this.car.position.z = newZ;
            this.car.speed *= 0.82;
            return true;
        }

        return false;
    }

    checkWorldBoundary() {
        const boundary = this.collisionSystem.checkWorldBoundary(this.car.position);

        if (boundary.shouldTeleport) {
            this.startTransition();
            return;
        }

        if (boundary.inWarning) {
            const opacity = Math.max(0.3, 1 - boundary.progress * 0.7);
            this.setCarOpacity(opacity);

            if (this.keys['ArrowDown'] || this.keys['KeyS']) {
                this.car.speed = Math.max(this.car.speed - 0.03, -this.maxReverseSpeed);
            }
        } else {
            this.resetCarOpacity();
        }
    }

    checkPortals() {
        const nearestPortal = this.getNearestPortal();
        const isInteractPressed = this.keys['KeyE'] === true;

        if (nearestPortal) {
            this.showPrompt(`Appuie sur E pour entrer: ${nearestPortal.title}`);

            if (isInteractPressed && !this.wasInteractPressed) {
                window.location.href = getChapterUrl(nearestPortal.target);
            }
        } else {
            this.hidePrompt();
        }

        this.wasInteractPressed = isInteractPressed;
    }

    getNearestPortal() {
        let nearest = null;
        let nearestDistance = Infinity;

        this.portals.forEach((portal) => {
            const dx = this.car.position.x - portal.group.position.x;
            const dz = this.car.position.z - portal.group.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < portal.radius && distance < nearestDistance) {
                nearest = portal;
                nearestDistance = distance;
            }
        });

        return nearest;
    }

    showPrompt(text) {
        if (!this.promptElement) return;
        this.promptElement.textContent = text;
        this.promptElement.classList.add('visible');
    }

    hidePrompt() {
        if (!this.promptElement) return;
        this.promptElement.classList.remove('visible');
    }

    updateCamera(deltaTime = 1 / 60) {
        const cameraOffset = 13;
        const cameraHeight = 8.5 + this.car.jumpY * 0.35;
        const cameraSmoothing = 1 - Math.exp(-9 * deltaTime);
        const lookSmoothing = 1 - Math.exp(-12 * deltaTime);
        const desiredPosition = new THREE.Vector3(
            this.car.position.x - Math.sin(this.car.rotation) * cameraOffset,
            cameraHeight,
            this.car.position.z - Math.cos(this.car.rotation) * cameraOffset
        );
        const desiredLookAt = new THREE.Vector3(
            this.car.position.x,
            1.8 + this.car.jumpY * 0.35,
            this.car.position.z
        );

        this.camera.position.lerp(desiredPosition, cameraSmoothing);
        this.cameraLookAt.lerp(desiredLookAt, lookSmoothing);
        this.camera.lookAt(this.cameraLookAt);
    }

    startTransition() {
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.hasTeleported = false;

        const newX = -this.car.position.x * 0.78;
        const newZ = -this.car.position.z * 0.78;

        this.transitionData = {
            endX: newX,
            endZ: newZ,
            speed: this.car.speed,
            airVelocity: { ...this.car.airVelocity },
            carOpacity: 1
        };
    }

    updateTransition(deltaTime) {
        this.transitionProgress += deltaTime * 1.2;

        if (this.transitionProgress < 0.3) {
            this.transitionData.carOpacity = 1 - (this.transitionProgress / 0.3);
            this.setCarOpacity(this.transitionData.carOpacity);
        } else if (this.transitionProgress < 0.5) {
            const fadeInProgress = (this.transitionProgress - 0.3) / 0.2;
            this.transitionData.carOpacity = fadeInProgress;

            if (!this.hasTeleported) {
                this.car.position.x = this.transitionData.endX;
                this.car.position.z = this.transitionData.endZ;
                this.car.speed = this.transitionData.speed;
                this.car.airVelocity.x = this.transitionData.airVelocity.x;
                this.car.airVelocity.z = this.transitionData.airVelocity.z;
                this.hasTeleported = true;
            }

            this.setCarOpacity(this.transitionData.carOpacity);
        } else {
            this.isTransitioning = false;
            this.transitionProgress = 0;
            this.transitionData = null;
            this.hasTeleported = false;
            this.resetCarOpacity();
        }

        if (this.transitionProgress > 0.3) {
            this.camera.lookAt(this.car.position.x, 2, this.car.position.z);
        }
    }

    setCarOpacity(opacity) {
        this.car.group.traverse((child) => {
            if (!child.material) return;

            if (child.userData.originalMaterialState === undefined) {
                child.userData.originalMaterialState = {
                    transparent: child.material.transparent,
                    opacity: child.material.opacity
                };
            }

            child.material.transparent = true;
            child.material.opacity = Math.min(child.userData.originalMaterialState.opacity, opacity);
        });
    }

    resetCarOpacity() {
        this.car.group.traverse((child) => {
            if (!child.material || child.userData.originalMaterialState === undefined) return;

            child.material.transparent = child.userData.originalMaterialState.transparent;
            child.material.opacity = child.userData.originalMaterialState.opacity;
            delete child.userData.originalMaterialState;
        });
    }
}

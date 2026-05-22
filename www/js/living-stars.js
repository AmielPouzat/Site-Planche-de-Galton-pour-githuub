(function initLivingStars() {
    const canvas = document.getElementById('living-stars');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = {
        x: 0,
        y: 0,
        active: false,
        strength: 0,
        id: 0
    };

    let width = 0;
    let height = 0;
    let stars = [];
    let animationId = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        createStars();
    }

    function createStars() {
        const count = prefersReducedMotion ? 28 : Math.floor(Math.min(96, Math.max(42, width * height / 18000)));
        stars = Array.from({ length: count }, (_, index) => {
            const columnCount = Math.ceil(Math.sqrt(count * (width / Math.max(height, 1))));
            const rowCount = Math.ceil(count / columnCount);
            const column = index % columnCount;
            const row = Math.floor(index / columnCount);
            const cellWidth = width / columnCount;
            const cellHeight = height / rowCount;
            const baseX = column * cellWidth + cellWidth * (0.24 + Math.random() * 0.52);
            const baseY = row * cellHeight + cellHeight * (0.24 + Math.random() * 0.52);

            return {
                x: baseX,
                y: baseY,
                angle: Math.random() * Math.PI * 2,
                targetAngle: Math.random() * Math.PI * 2,
                speed: 0.035 + Math.random() * 0.045,
                size: 0.45 + Math.random() * 1.15,
                phase: Math.random() * Math.PI * 2,
                glow: Math.random() * 0.35,
                lastPointerId: -1,
                intent: 'wander',
                intentNoise: 0,
                nextWander: 0
            };
        });
    }

    function setPointer(event) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
        pointer.strength = 1;
        pointer.id += 1;
    }

    function angleDifference(from, to) {
        return Math.atan2(Math.sin(to - from), Math.cos(to - from));
    }

    function rotateToward(from, to, maxStep) {
        const diff = angleDifference(from, to);
        if (Math.abs(diff) <= maxStep) return to;
        return from + Math.sign(diff) * maxStep;
    }

    function updateStar(star, time) {
        if (time > star.nextWander && (!pointer.active || pointer.strength < 0.08)) {
            star.targetAngle = star.angle + (Math.random() - 0.5) * 0.9;
            star.nextWander = time + 2800 + Math.random() * 5200;
        }

        if (pointer.strength > 0.01) {
            const dx = pointer.x - star.x;
            const dy = pointer.y - star.y;

            if (star.lastPointerId !== pointer.id) {
                star.lastPointerId = pointer.id;
                star.intent = Math.random() < 0.9 ? 'attract' : 'wander';
                star.intentNoise = (Math.random() - 0.5) * 0.75;

                if (star.intent === 'wander') {
                    const side = Math.random() < 0.5 ? -1 : 1;
                    star.targetAngle = star.angle + side * (0.45 + Math.random() * 0.8);
                }
            }

            if (star.intent === 'attract') {
                star.targetAngle = Math.atan2(dy, dx) + star.intentNoise * pointer.strength;
                star.speed += (0.13 - star.speed) * 0.012 * pointer.strength;
                star.glow = Math.min(0.9, star.glow + 0.028 * pointer.strength);
            } else {
                star.speed += (0.07 - star.speed) * 0.008 * pointer.strength;
                star.glow = Math.min(0.62, star.glow + 0.012 * pointer.strength);
            }
        } else {
            star.speed += (0.045 - star.speed) * 0.006;
        }

        const organicDrift = Math.sin(time * 0.00011 + star.phase) * 0.0018;
        const turnSpeed = pointer.active ? 0.015 : 0.006;
        star.angle = rotateToward(star.angle, star.targetAngle + organicDrift, turnSpeed);
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.glow *= 0.996;

        if (star.x < -20) star.x = width + 20;
        if (star.x > width + 20) star.x = -20;
        if (star.y < -20) star.y = height + 20;
        if (star.y > height + 20) star.y = -20;
    }

    function drawLinks() {
        ctx.lineWidth = 1;

        for (let i = 0; i < stars.length; i += 1) {
            for (let j = i + 1; j < stars.length; j += 1) {
                const a = stars[i];
                const b = stars[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 128) {
                    const opacity = (1 - distance / 128) * 0.075;
                    ctx.strokeStyle = `rgba(180, 228, 255, ${opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }

    function drawStar(star, time) {
        const twinkle = 0.38 + Math.sin(time * 0.0008 + star.phase) * 0.1 + star.glow * 0.55;
        const radius = star.size * (0.82 + twinkle * 0.28);
        const halo = radius * (3.2 + star.glow * 2.4);
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, halo);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.82)');
        gradient.addColorStop(0.42, `rgba(143, 218, 255, ${0.16 + star.glow * 0.22})`);
        gradient.addColorStop(1, 'rgba(143, 218, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, halo, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
        ctx.beginPath();
        ctx.arc(star.x, star.y, Math.max(0.45, radius), 0, Math.PI * 2);
        ctx.fill();
    }

    function tick(time) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#080d1d';
        ctx.fillRect(0, 0, width, height);

        stars.forEach((star) => updateStar(star, time));
        drawLinks();
        stars.forEach((star) => drawStar(star, time));

        pointer.strength *= 0.975;
        if (pointer.strength < 0.02) pointer.active = false;

        animationId = window.requestAnimationFrame(tick);
    }

    canvas.addEventListener('pointerdown', setPointer);
    canvas.addEventListener('pointermove', (event) => {
        if (event.buttons > 0) setPointer(event);
    });
    window.addEventListener('resize', resize);

    resize();
    animationId = window.requestAnimationFrame(tick);

    window.addEventListener('pagehide', () => {
        window.cancelAnimationFrame(animationId);
    });
})();

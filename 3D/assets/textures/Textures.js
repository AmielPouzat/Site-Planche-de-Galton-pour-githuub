// ============================================
// ASSETS - TEXTURES
// Générateurs de textures procédurales pour le monde 3D
// ============================================

const TextureGenerator = {
    // Building textures
    createCartoonBuildingTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        let baseColor, accentColor;
        switch(type) {
            case 'residential':
                baseColor = '#F4A460';
                accentColor = '#DEB887';
                break;
            case 'office':
                baseColor = '#708090';
                accentColor = '#778899';
                break;
            case 'commercial':
                baseColor = '#CD853F';
                accentColor = '#D2691E';
                break;
            default:
                baseColor = '#D2B48C';
                accentColor = '#C4A574';
        }
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const brickHeight = 20;
        const brickWidth = 40;
        const mortarColor = '#8B7355';
        
        for (let y = 0; y < canvas.height; y += brickHeight) {
            const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
            for (let x = -brickWidth; x < canvas.width; x += brickWidth) {
                ctx.fillStyle = mortarColor;
                ctx.fillRect(x + offset, y, brickWidth + 2, 2);
                ctx.fillRect(x + offset, y, 2, brickHeight);
            }
        }
        
        const windowSize = 30;
        const windowSpacing = 50;
        
        for (let y = 30; y < canvas.height - 30; y += windowSpacing) {
            for (let x = 30; x < canvas.width - 30; x += windowSpacing) {
                ctx.fillStyle = '#4A4A4A';
                ctx.fillRect(x - 2, y - 2, windowSize + 4, windowSize + 4);
                ctx.fillStyle = type === 'residential' ? '#87CEEB' : '#4169E1';
                ctx.fillRect(x, y, windowSize, windowSize);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 5);
                ctx.lineTo(x + 15, y + 5);
                ctx.lineTo(x + 5, y + 15);
                ctx.fill();
            }
        }
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(canvas.width / 2 - 15, canvas.height - 40, 30, 40);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + 8, canvas.height - 20, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    },

    createModernHouseTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#F5F5DC');
        gradient.addColorStop(1, '#E8E4C9');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        for (let y = 16; y < canvas.height; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        const windowX = canvas.width / 2 - 30;
        const windowY = canvas.height / 2 - 40;
        const windowW = 60;
        const windowH = 70;
        
        ctx.shadowColor = '#87CEEB';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#B0E0E6';
        ctx.fillRect(windowX, windowY, windowW, windowH);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#2F4F4F';
        ctx.lineWidth = 4;
        ctx.strokeRect(windowX, windowY, windowW, windowH);
        ctx.beginPath();
        ctx.moveTo(windowX + windowW/2, windowY);
        ctx.lineTo(windowX + windowW/2, windowY + windowH);
        ctx.moveTo(windowX, windowY + windowH/2);
        ctx.lineTo(windowX + windowW, windowY + windowH/2);
        ctx.stroke();
        
        const doorX = canvas.width / 2 - 20;
        const doorY = canvas.height - 50;
        const doorW = 40;
        const doorH = 50;
        
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX + 5, doorY + 5, doorW - 10, doorH/2 - 5);
        ctx.strokeRect(doorX + 5, doorY + doorH/2, doorW - 10, doorH/2 - 5);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(doorX + doorW - 8, doorY + doorH/2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F4F4F';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    },

    createFantasyHouseTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#E6E6FA');
        gradient.addColorStop(0.5, '#D8BFD8');
        gradient.addColorStop(1, '#DDA0DD');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 20 + 10;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const windowX = canvas.width / 2;
        const windowY = canvas.height / 2 - 20;
        const windowRadius = 35;
        
        ctx.shadowColor = '#9370DB';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#E0FFFF';
        ctx.beginPath();
        ctx.arc(windowX, windowY, windowRadius, Math.PI, 0);
        ctx.lineTo(windowX + windowRadius, windowY + 40);
        ctx.lineTo(windowX - windowRadius, windowY + 40);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#4B0082';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = windowX + Math.cos(angle) * (windowRadius + 10);
            const y = windowY + Math.sin(angle) * (windowRadius + 10);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const doorW = 50;
        const doorH = 60;
        const doorX = canvas.width / 2 - doorW/2;
        const doorY = canvas.height - doorH - 10;
        
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(doorX + 5, doorY + 5, doorW - 10, doorH - 10);
        
        const gemColors = ['#FF1493', '#00CED1', '#FFD700'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = gemColors[i];
            ctx.beginPath();
            ctx.arc(doorX + doorW/2, doorY + 15 + i * 15, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = '#4B0082';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    },

    createCartoonRoofTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        let baseColor, highlightColor, shadowColor;
        switch(type) {
            case 'red':
                baseColor = '#B22222';
                highlightColor = '#CD5C5C';
                shadowColor = '#8B0000';
                break;
            case 'brown':
                baseColor = '#A0522D';
                highlightColor = '#CD853F';
                shadowColor = '#8B4513';
                break;
            case 'blue':
                baseColor = '#4682B4';
                highlightColor = '#87CEEB';
                shadowColor = '#191970';
                break;
            default:
                baseColor = '#A0522D';
                highlightColor = '#CD853F';
                shadowColor = '#8B4513';
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, shadowColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const tileWidth = 32;
        const tileHeight = 24;
        
        for (let y = 0; y < canvas.height + tileHeight; y += tileHeight) {
            const offset = (Math.floor(y / tileHeight) % 2) * (tileWidth / 2);
            for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(x + offset + 2, y + 4, tileWidth - 2, tileHeight - 4);
                ctx.fillStyle = baseColor;
                ctx.fillRect(x + offset, y + 2, tileWidth - 2, tileHeight - 4);
                ctx.fillStyle = highlightColor;
                ctx.fillRect(x + offset, y + 2, tileWidth - 2, 4);
                ctx.fillStyle = shadowColor;
                ctx.fillRect(x + offset, y + tileHeight - 6, tileWidth - 2, 4);
            }
        }
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    },

    // World textures
    createCartoonRoadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#5c6670';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 90; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#53606a' : '#66727b';
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.fillStyle = '#d6cfa6';
        for (let x = 24; x < canvas.width; x += 42) {
            ctx.fillRect(x, canvas.height / 2 - 2, 22, 4);
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
        ctx.fillRect(0, 0, canvas.width, 5);
        ctx.fillRect(0, canvas.height - 5, canvas.width, 5);
        
        return new THREE.CanvasTexture(canvas);
    },

    createCartoonGroundTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width
        );
        gradient.addColorStop(0, '#86c98a');
        gradient.addColorStop(0.72, '#72b77b');
        gradient.addColorStop(1, '#5fa56e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 90; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const shade = Math.random() > 0.5 ? 'rgba(48, 120, 64, 0.32)' : 'rgba(158, 214, 144, 0.28)';
            ctx.fillStyle = shade;
            ctx.beginPath();
            ctx.ellipse(x, y, 2, 7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
        return texture;
    }
};

// Reuse procedural textures across buildings and chapters.
// This keeps chapter loading cheap when the same template assets are used again.
(function cacheGeneratedTextures() {
    const cache = new Map();
    const cachedMethods = [
        'createCartoonBuildingTexture',
        'createModernHouseTexture',
        'createFantasyHouseTexture',
        'createCartoonRoofTexture',
        'createCartoonRoadTexture',
        'createCartoonGroundTexture'
    ];

    cachedMethods.forEach((methodName) => {
        const createTexture = TextureGenerator[methodName].bind(TextureGenerator);

        TextureGenerator[methodName] = function cachedTexture(...args) {
            const cacheKey = `${methodName}:${args.join('|')}`;

            if (!cache.has(cacheKey)) {
                const texture = createTexture(...args);
                texture.needsUpdate = true;
                cache.set(cacheKey, texture);
            }

            return cache.get(cacheKey);
        };
    });
})();

// ============================================
// THEME - Palette et materiaux du template 3D
// ============================================

const CampusTheme = {
    colors: {
        sky: 0x86d8ff,
        fog: 0xa5e4ff,
        grass: 0x66d47e,
        grassLight: 0x98f0a7,
        grassDark: 0x36a861,
        islandSide: 0x3f8c68,
        path: 0xffd36e,
        pathShadow: 0xf0a951,
        water: 0x42c9ff,
        ink: 0x101a2d,
        panel: 0x17243a,
        cyan: 0x35c7d0,
        yellow: 0xf7d85b,
        pink: 0xff6bb5,
        white: 0xffffff
    },

    material(color, options = {}) {
        return new THREE.MeshPhongMaterial({
            color,
            shininess: options.shininess ?? 65,
            emissive: options.emissive ?? 0x000000,
            emissiveIntensity: options.emissiveIntensity ?? 0,
            transparent: options.transparent ?? false,
            opacity: options.opacity ?? 1,
            side: options.side ?? THREE.FrontSide
        });
    },

    basic(color, options = {}) {
        return new THREE.MeshBasicMaterial({
            color,
            transparent: options.transparent ?? false,
            opacity: options.opacity ?? 1,
            side: options.side ?? THREE.FrontSide,
            depthWrite: options.depthWrite ?? true
        });
    }
};

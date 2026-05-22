// ============================================
// CHAPTER TEMPLATES
// Le template de scene est volontairement centre sur l'ambiance et la navigation.
// Les objets pedagogiques viendront ensuite dans `learningObjects`.
// ============================================

const baseWorld = {
    radius: 64,
    warningZoneRadius: 55,
    teleportZoneRadius: 60,
    showDome: true,
    animateDome: false
};

const ChapterTemplates = {
    default: {
        id: 'default',
        title: 'Hub des chapitres',
        subtitle: 'Approche un portail, puis appuie sur E pour entrer.',
        theme: 'cartoon-shiny',
        spawn: { x: 0, z: 12, rotation: 0 },
        world: baseWorld,
        scene: {
            portals: [
                {
                    title: 'Sciences',
                    target: 'sciences',
                    x: 0,
                    z: 28,
                    color: CampusTheme.colors.cyan,
                    accent: CampusTheme.colors.yellow
                }
            ],
            learningObjects: []
        }
    },

    sciences: {
        id: 'sciences',
        title: 'Chapitre sciences',
        subtitle: 'Scene de test pour l’ambiance sciences. Retour possible par le portail.',
        theme: 'cartoon-shiny',
        spawn: { x: 0, z: 12, rotation: 0 },
        world: baseWorld,
        scene: {
            portals: [
                {
                    title: 'Retour au hub',
                    target: 'default',
                    x: 0,
                    z: 28,
                    color: CampusTheme.colors.white,
                    accent: CampusTheme.colors.cyan
                }
            ],
            learningObjects: []
        }
    }
};

function getChapterTemplate() {
    const params = new URLSearchParams(window.location.search);
    const chapterId = params.get('chapter') || 'default';
    return ChapterTemplates[chapterId] || ChapterTemplates.default;
}

function getChapterUrl(chapterId) {
    if (chapterId === 'default') {
        return window.location.pathname;
    }

    return `${window.location.pathname}?chapter=${encodeURIComponent(chapterId)}`;
}

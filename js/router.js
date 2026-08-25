const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.protocol === 'file:';

if (!isLocal && window.location.pathname.endsWith('.html')) {
    let cleanedPath = window.location.pathname.replace('.html', '');
    
    if (cleanedPath.endsWith('/index')) {
        cleanedPath = cleanedPath.slice(0, -5);
    }
    history.replaceState(null, '', cleanedPath + window.location.search + window.location.hash);
}

const routes = {
    '': {
        methodName: 'goToMenu',
        classes: [], 
        onEnter: null
    },
    '#/play': {
        methodName: 'openPlayMode',
        classes: ['play-mode'],
        onEnter: null
    },
    '#/analysis': {
        methodName: 'openPlayAnalysis',
        classes: ['analysis-mode'],
        onEnter: null
    },
    '#/piece': {
        methodName: 'openCreatePiece',
        classes: ['create-piece'],
        onEnter: null
    },
    '#/rule': {
        methodName: 'openCreateRule',
        classes: ['create-rule'],
        onEnter: null
    },
    '#/variant': {
        methodName: 'openCreateVariant',
        classes: ['create-variant'],
        onEnter: null
    }
};

Object.entries(routes).forEach(([hash, config]) => {
    if (config.methodName) {
        window[config.methodName] = () => {
            window.location.hash = hash;
        };
    }
});

const allRouteClasses = Object.values(routes)
    .flatMap(route => route.classes)
    .filter(Boolean);

function handleRouting() {
    const hash = window.location.hash;
    const currentRoute = routes[hash] || { classes: [], onEnter: null };

    allRouteClasses.forEach(cls => document.body.classList.remove(cls));

    if (currentRoute.classes && currentRoute.classes.length > 0) {
        document.body.classList.add(...currentRoute.classes);
    }

    if (typeof currentRoute.onEnter === 'function') {
        currentRoute.onEnter();
    }

    // Common logic applied to all routes
    if (typeof window.initializeBoard === 'function') {
        window.initializeBoard(window.currentVariantPGN);
    } else {
        console.warn("Board engine not loaded yet. Retrying shortly...");
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);

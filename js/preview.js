// Database of all variants
const VARIANT_DATABASE = [
    {
        id: "chess",
        category: "classic",
        title: "Chess",
        author: "Unknown",
        shortDesc: "Regular Chess",
        longDesc: "Regular Chess",
        icon: "assets/images/icons/poly6.svg",
        pgn: `
        [Position "y:R,y:N,y:B,y:Q,y:K,y:B,y:N,y:R/y:P,y:P,y:P,y:P,y:P,y:P,y:P,y:P/8/8/8/8/r:P,r:P,r:P,r:P,r:P,r:P,r:P,r:P/r:R,r:N,r:B,r:Q,r:K,r:B,r:N,r:R"]
        [PositionDetails "'dim=8x8'"]
        `
    },
    {
        id: "4pc",
        category: "classic",
        title: "4 Player Chess",
        author: "Unknown",
        shortDesc: "4 Player Chess",
        longDesc: "4 Player Chess",
        icon: "assets/images/icons/poly5.svg",
        pgn: `
        [Position "!,!,!,y:R,y:N,y:B,y:K,y:Q,y:B,y:N,y:R,!,!,!/!,!,!,y:P,y:P,y:P,y:P,y:P,y:P,y:P,y:P,!,!,!/!,!,!,8,!,!,!/b:R,b:P,10,g:P,g:R/b:N,b:P,10,g:P,g:N/b:B,b:P,10,g:P,g:B/b:Q,b:P,10,g:P,g:K/b:K,b:P,10,g:P,g:Q/b:B,b:P,10,g:P,g:B/b:N,b:P,10,g:P,g:N/b:R,b:P,10,g:P,g:R/!,!,!,8,!,!,!/!,!,!,r:P,r:P,r:P,r:P,r:P,r:P,r:P,r:P,!,!,!/!,!,!,r:R,r:N,r:B,r:Q,r:K,r:B,r:N,r:R,!,!,!"]
        [PositionDetails "'dim=14x14';'rbyg=true'"]
        `
    },
    {
        id: "atomic",
        category: "classic",
        title: "Atomic",
        author: "Unknown",
        shortDesc: "Captures explode nearby pieces!",
        longDesc: "Captures explode a 3x3 area, but pawns are immune to explosion!",
        icon: "assets/images/icons/poly3.svg",
        pgn: `
        [Position "y:R,y:N,y:B,y:Q,y:K,y:B,y:N,y:R/y:P,y:P,y:P,y:P,y:P,y:P,y:P,y:P/8/3,y:P,r:P,3/8/8/r:P,r:P,r:P,r:P,r:P,r:P,r:P,r:P/r:R,r:N,r:B,r:Q,r:K,r:B,r:N,r:R"]
        [PositionDetails "'dim=8x8';'enPassantSquares=e4:e5,d6:d5'"]
        `
    },
    {
        id: "horde",
        category: "classic",
        title: "Horde",
        author: "Unknown",
        shortDesc: "A massive army of pawns versus standard chess pieces!",
        longDesc: "Chess but white only has 36 pawns while black has a standard setup!",
        icon: "assets/images/icons/poly4.svg",
        pgn: `
        [Position "r:A,r:B,r:C,r:D,r:E,r:F/b:G,b:H,b:I,b:J,b:K,b:L/y:M,y:N,y:O,y:P,y:Q,y:R/g:S,g:T,g:U,g:V,g:W,g:X/r:Y,r:Z,0,r:1,r:2,r:3/b:4,b:5,b:6,b:7,b:8,b:9"]
        [PositionDetails "'dim=6x6';'rbyg=true'"]
        `
    },
    {
        id: "test",
        category: "classic",
        title: "Test",
        author: "AllenBB314",
        shortDesc: "idk :)",
        longDesc: "idk :)",
        icon: "assets/images/icons/polycirc.svg",
        pgn: `
        [Position "y:Q,2,r:A,2/r:P,r:P,b:K,2,b:V/1,g:2,y:U,1,g:O,r:U/g:P,d:L,4/3,r:D,r:3,b:B/6"]
        [PositionDetails "'dim=6x6';'rbyg=true'"]
        `
    },
    {
        id: "pawns",
        category: "classic",
        title: "Pawns",
        author: "AllenBB314",
        shortDesc: "idk :)",
        longDesc: "idk :)",
        icon: "assets/images/icons/pieces/white/P.svg",
        pgn: `
        [Position "y:P,y:1,y:2,y:3,y:4,1/6/6/6/6/1,r:4,r:3,r:2,r:1,r:P"]
        [PositionDetails "'dim=6x6';'rbyg=true'"]
        `
    },
    {
        id: "rule-test",
        category: "classic",
        title: "Rule Test",
        author: "AllenBB314",
        shortDesc: "idk :)",
        longDesc: "idk :)",
        icon: "assets/images/icons/poly7.svg",
        pgn: `
        [Position "y:P,y:1,y:2,y:3,y:4,1/6/6/6/6/1,r:4,r:3,r:2,r:1,r:P"]
        [PositionDetails "'dim=6x6';'rbyg=true'"]
        [GameRules "~turn{ci(l=(3,gmove)){awin('r')}};"]
        `
    },
    {
        id: "salvation-bastions",
        category: "classic",
        title: "Salvation Bastions",
        author: "someone in chess.com ig",
        shortDesc: "requested by someone :)",
        longDesc: "Pawns can always move two squares forward\nBe the first one to land a checkmate sequence\nbtw missing dead pawn is intentional by 45 year old woman idk why",
        icon: "assets/images/pieces/simplicity/K.svg",
        pgn: `
        [Position "!,!,!,!,!,!,!,!,!,y:J,y:G,!,!,!/!,!,!,!,!,!,!,!,!,d:N,d:B,!,!,!/!,!,!,y:R,y:N,y:B,y:K,y:Q,y:B,y:R,!,!,!,!/b:G,d:B,!,!,y:2,y:2,y:2,y:2,y:2,y:2,!,g:R,!,!/b:J,d:N,b:R,b:2,d:P,d:P,3,d:P,g:2,g:N,!,!/!,!,b:B,b:2,1,d:P,1,d:P,d:P,d:P,g:2,g:B,!,!/!,!,b:Q,b:2,1,d:P,4,g:2,g:K,!,!/!,!,b:K,b:2,4,d:P,1,g:2,g:Q,!,!/!,!,b:B,b:2,d:P,d:P,d:P,3,g:2,g:B,!,!/!,!,b:N,b:2,d:P,3,d:P,d:P,g:2,g:R,d:N,g:J/!,!,b:R,!,r:2,r:2,r:2,r:2,r:2,r:2,!,!,d:B,g:G/!,!,!,!,r:R,r:B,r:Q,r:K,r:B,r:N,r:R,!,!,!/!,!,!,d:B,d:N,!,!,!,!,!,!,!,!,!/!,!,!,r:G,r:J,!,!,!,!,!,!,!,!,!"]
        [PositionDetails "'dim=14x14';'rbyg=true'"]
        [GameRules ""]
        `
    },
    {
        id: "popular1",
        category: "popular",
        title: "popular1",
        author: "Unknown",
        shortDesc: "sdesc",
        longDesc: "ldesc",
        icon: "assets/images/icons/polycirc.svg"
    },
    {
        id: "recent1",
        category: "recent",
        title: "recent1",
        author: "Unknown",
        shortDesc: "sdesc",
        longDesc: "ldesc",
        icon: "assets/images/icons/polycirc.svg"
    },
    {
        id: "custom1",
        category: "custom",
        title: "custom1",
        author: "Unknown",
        shortDesc: "sdesc",
        longDesc: "ldesc",
        icon: "assets/images/icons/polycirc.svg"
    }
];

// Preview
document.addEventListener("DOMContentLoaded", () => {
    const previewName = document.querySelector(".preview-variant-zone h2");
    const previewDesc = document.querySelector(".preview-description");
    const previewAuthor = document.querySelector(".variant-author");

    VARIANT_DATABASE.forEach(variant => {
        const targetContainer = document.getElementById(`${variant.category}-list`);
        
        if (targetContainer) {
            const formattedTag = variant.category.charAt(0).toUpperCase() + variant.category.slice(1);
            
            const cardHTML = `
                <div class="variant-item" data-id="${variant.id}">
                    <img src="${variant.icon}" class="variant-item-icon" alt="">
                    <div class="variant-description">
                        <h3>${variant.title}</h3>
                        <p>${variant.shortDesc}</p>
                    </div>
                    <span class="variant-tag">${formattedTag}</span>
                </div>
            `;
            targetContainer.insertAdjacentHTML('beforeend', cardHTML);
        } else {
            console.warn(`Could not find container: #${variant.category}-list`);
        }
    });

    document.body.addEventListener("click", (event) => {
        const clickedCard = event.target.closest(".variant-item");
        
        if (clickedCard) {
            const variantId = clickedCard.getAttribute("data-id");
            const variantData = VARIANT_DATABASE.find(v => v.id === variantId);
            
            if (variantData) {
                previewName.innerHTML = `<img src="${variantData.icon}" class="preview-title-icon" alt=""> ${variantData.title}`;
                previewDesc.textContent = variantData.longDesc;
                previewAuthor.textContent = `Created by @${variantData.author}`;

                if (variantData.pgn) {
                    window.currentVariantPGN = variantData.pgn;

                    const safeInitialize = () => {
                        if (typeof window.initializeBoard === 'function') {
                            window.initializeBoard(variantData.pgn);
                        } else {
                            setTimeout(safeInitialize, 30);
                        }
                    };
                    
                    safeInitialize();
                }
            }
        }
    });

    setTimeout(() => {
        const defaultCard = document.querySelector('.variant-item[data-id="chess"]');
        if (defaultCard) {
            defaultCard.click();
        }
    }, 50);
});
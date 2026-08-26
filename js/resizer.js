document.addEventListener("DOMContentLoaded", () => {
    initHorizontalResizer();
    initVerticalResizer();
});

function initHorizontalResizer() {
    const resizer = document.getElementById("panel-resizer");
    const leftPanel = document.querySelector(".left-panel");
    const container = document.querySelector(".play-layout");

    if (!resizer || !leftPanel || !container) return;

    let startWidth = 0;
    let startX = 0;

    function getWidthBounds() {
        const totalWidth = window.innerWidth;
        const minWidth = 350;
        
        let maxWidth = Math.max(570, (totalWidth * 2) / 3);
        const screenCap = Math.floor(totalWidth * 0.85);
        if (maxWidth > screenCap) maxWidth = screenCap;
        if (maxWidth < minWidth) maxWidth = minWidth;

        return { minWidth, maxWidth };
    }

    const onPointerMove = (e) => {
        const { minWidth, maxWidth } = getWidthBounds();
        
        let deltaX = e.clientX - startX;
        let targetWidth = startWidth + deltaX;

        if (targetWidth < minWidth) {
            targetWidth = minWidth;
            startX = e.clientX - (minWidth - startWidth);
        } else if (targetWidth > maxWidth) {
            targetWidth = maxWidth;
            startX = e.clientX - (maxWidth - startWidth);
        }

        leftPanel.style.width = `${targetWidth}px`;
    };

    const onPointerUp = (e) => {
        resizer.classList.remove("resizing");
        document.body.classList.remove("resizing-active");
        
        try {
            resizer.releasePointerCapture(e.pointerId);
        } catch (err) {}

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
    };

    resizer.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        
        resizer.setPointerCapture(e.pointerId);
        
        startWidth = leftPanel.getBoundingClientRect().width;
        startX = e.clientX;

        resizer.classList.add("resizing");
        document.body.classList.add("resizing-active");

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
    });

    const adjustInitialBounds = () => {
        if (window.innerWidth <= 900) {
            leftPanel.style.width = '';
            return;
        }

        const { minWidth, maxWidth } = getWidthBounds();
        let currentWidth = leftPanel.getBoundingClientRect().width || (window.innerWidth * 0.33);
        if (currentWidth < minWidth) currentWidth = minWidth;
        if (currentWidth > maxWidth) currentWidth = maxWidth;
        leftPanel.style.width = `${currentWidth}px`;
    };

    adjustInitialBounds();
    window.addEventListener("resize", adjustInitialBounds);

    const mobileBreakpoint = window.matchMedia('(max-width: 900px)');
    mobileBreakpoint.addEventListener('change', adjustInitialBounds);
}

function initVerticalResizer() {
    const resizer = document.getElementById("analysis-resizer");
    const movesList = document.querySelector(".moves-list");
    const container = document.querySelector(".analysis-tools-container");

    if (!resizer || !movesList || !container) return;

    let startHeight = 0;
    let startY = 0;

    const onPointerMove = (e) => {
        const containerRect = container.getBoundingClientRect();
        const minHeight = 100; 
        const maxHeight = containerRect.height - 100;

        let deltaY = e.clientY - startY;
        let targetHeight = startHeight + deltaY;
        
        if (targetHeight < minHeight) {
            targetHeight = minHeight;
            startY = e.clientY - (minHeight - startHeight);
        } else if (targetHeight > maxHeight) {
            targetHeight = maxHeight;
            startY = e.clientY - (maxHeight - startHeight);
        }

        movesList.style.flex = "none"; 
        movesList.style.height = `${targetHeight}px`;
    };

    const onPointerUp = (e) => {
        resizer.classList.remove("resizing");
        document.body.classList.remove("resizing-active");
        
        try {
            resizer.releasePointerCapture(e.pointerId);
        } catch (err) {}

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
    };

    resizer.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        resizer.setPointerCapture(e.pointerId);
        
        startHeight = movesList.getBoundingClientRect().height;
        startY = e.clientY;

        resizer.classList.add("resizing");
        document.body.classList.add("resizing-active");

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
    });
}
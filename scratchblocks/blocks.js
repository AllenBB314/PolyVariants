const blockCategories = [
    {
        id: "Events",
        fill: "#ffbf00",
        stroke: "#cc9900"
    },
    {
        id: "Get",
        fill: "#9966ff",
        stroke: "#774dcb"
    },
    {
        id: "Actions",
        fill: "#ed4242",
        stroke: "#ca2b2b"
    },
    {
        id: "Operators",
        fill: "#59c059",
        stroke: "#389438"
    },
    {
        id: "Logic",
        fill: "#0fbd8c",
        stroke: "#0b8e69"
    },
    {
        id: "Repeat",
        fill: "#4c97ff",
        stroke: "#3373cc"
    },
    {
        id: "Conditions",
        fill: "#ff8c1a",
        stroke: "#db6e00"
    },
]
const blocks = [
    {
        codeId: "~anyTime",
        text: "any time",
        shape: "hat",
        category: "Events"
    },
    {
        codeId: "~start",
        text: "when game starts",
        shape: "hat",
        category: "Events"
    },
    {
        codeId: "~clicked",
        text: "when any square clicked",
        shape: "hat",
        category: "Events"
    },
    {
        codeId: "test",
        text: "a %1 b testing %2",
        inputs: ["n","b"],
        inputText: ["hi"],
        shape: "hat",
        category: "Events"
    },
    {
        codeId: "gmove",
        text: "get move #",
        shape: "number",
        category: "Get"
    },
    {
        codeId: "awin()",
        text: "make %1 win",
        inputs: ["c"],
        inputText: ["col"],
        inputHint: true,
        shape: "stack",
        category: "Actions"
    },
    {
        codeId: "alose()",
        text: "make %1 lose",
        inputs: ["c"],
        inputText: ["col"],
        inputHint: true,
        shape: "stack",
        category: "Actions"
    },
    {
        codeId: "acode(,)",
        text: "set code of %1 as %2",
        inputs: ["s","s"],
        inputText: ["piece","code"],
        inputHint: true,
        shape: "stack",
        category: "Actions"
    },
    {
        codeId: "o+(,)",
        text: "%1 + %2",
        inputs: ["n","n"],
        shape: "number",
        category: "Operators"
    },
    {
        codeId: "o-(,)",
        text: "%1 - %2",
        inputs: ["n","n"],
        shape: "number",
        category: "Operators"
    },
    {
        codeId: "l&(,)",
        text: "%1 and %2",
        inputs: ["b","b"],
        shape: "boolean",
        category: "Logic"
    },
    {
        codeId: "l|(,)",
        text: "%1 or %2",
        inputs: ["b","b"],
        shape: "boolean",
        category: "Logic"
    },
    {
        codeId: "l!()",
        text: "not %1",
        inputs: ["b"],
        shape: "boolean",
        category: "Logic"
    },
    {
        codeId: "r(){}",
        text: "repeat %1",
        inputs: ["n"],
        shape: "cblock",
        category: "Repeat"
    },
];

function initWorkspace () {
    const categoryPanel = document.querySelector(".category-panel");
    const blocksContainer = document.querySelector(".blocks");

    if (!categoryPanel || !blocksContainer) return;

    blockCategories.forEach(c => {
        const iconSvg = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle fill="${c.fill}" stroke="${c.stroke}" stroke-width="5" cx="50" cy="50" r="25"/>
            </svg>
        `;

        const categoryHtml = `
            <div class="block-category" data-id="${c.id}">
                ${iconSvg}
                <p class="text-no-select">${c.id}</p>
            </div>
        `;

        categoryPanel.insertAdjacentHTML("beforeend", categoryHtml);

        const categoryDiv = document.createElement("div");
        categoryDiv.id = `${c.id}-category`;
        categoryDiv.className = "blocks-section";
        categoryDiv.style.backgroundColor = `${c.fill}11`;

        blocksContainer.appendChild(categoryDiv);
    });
    const textEditorBtn = document.createElement("button");
    textEditorBtn.className = "rule-text-editor-btn";
    textEditorBtn.textContent = "Text Editor";
    categoryPanel.appendChild(textEditorBtn);

    document.body.addEventListener("click", (event) => {
        const clickedCategory = event.target.closest(".block-category");

        if (clickedCategory) {
            const categoryId = clickedCategory.dataset.id;
            const blockSection = document.getElementById(`${categoryId}-category`);

            if (blockSection) {
                const isMobile = window.innerWidth <= 900;

                if (isMobile) {
                    blockSection.scrollIntoView({
                        behavior: "smooth", 
                        block: "nearest",
                        inline: "start"
                    });
                } else {
                    blockSection.scrollIntoView({
                        behavior: "smooth", 
                        block: "start"
                    });
                }
                
            }
        }
    });

    blocks.forEach(b => {
        const blockSvg = getBlockSvg(b);
        if (blockSvg) {
            const blocksSectionCategory = document.getElementById(`${b.category}-category`);
            if (!blocksSectionCategory) return;
            blocksSectionCategory.insertAdjacentHTML("beforeend", blockSvg);
        }
    });
}

// #region Block SVG Variables
let blockScale = 0.75;
const blockPartHeights = {
    hat: 16,
    block: 40,
    cblock: 96,
    connect: 8,
    reporter: 36,
};
const blockHeights = {
    hat: blockPartHeights.block + blockPartHeights.hat,
    stack: blockPartHeights.block,
    cblock: blockPartHeights.cblock,
    reporter: blockPartHeights.reporter,
    number: blockPartHeights.reporter,
    string: blockPartHeights.reporter,
    boolean: blockPartHeights.reporter,
};
const blockContentHeights = {
    hat: blockPartHeights.block,
    stack: blockPartHeights.block,
    cblock: blockPartHeights.block,
    reporter: blockPartHeights.reporter,
    number: blockPartHeights.reporter,
    string: blockPartHeights.reporter,
    boolean: blockPartHeights.reporter,
};
const blockContentGaps = { // top, bottom
    hat: [blockPartHeights.hat, 0],
    stack: [0, 0],
    cblock: [0, blockPartHeights.cblock - blockPartHeights.block],
    reporter: [0, 0],
    number: [0, 0],
    string: [0, 0],
    boolean: [0, 0],
};
const padding = { // top, right, bottom, left
    hat: [12, 10, 12, 10],
    stack: [12, 10, 12, 10],
    cblock: [12, 10, 12, 10],
    reporter: [12, 10, 12, 10],
    number: [12, 10, 12, 10],
    string: [12, 10, 12, 10],
    boolean: [12, 16, 12, 16],
}; 
const inputPadding = { // top, right, bottom, left
    v: [4, 4, 4, 4],
    n: [4, 4, 4, 4],
    s: [4, 4, 4, 4],
    b: [4, 6, 4, 6],
    c: [4, 4, 4, 4],
};
const strokeWidth = 1;
const defaultSizes = { // [width, height]
    hat: [100, 56],
    stack: [64, 40],
    cblock: [120, 104, 16, 24], // [..., connect width, gap height]
    reporter: [48, 36],
    number: [48, 36],
    string: [48, 36],
    boolean: [24, 36],
};
// #endregion

function getBlockSvg (blockObj, options = {}) {
    let addToSvg = [];
    const customWidths = options.widths != null ? options.widths : [];
    const customHeights = options.heights != null ? options.heights : [];

    function textWidth (text, font = "500 12pt Helvetica Neue") {
        const canvas = textWidth.canvas || (textWidth.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    function addToList (type, blockType, options = {}) {
        const inputType = options.inputType ?? "v";

        const w = options.w ?? defaultSizes[blockType][0];
        const h = options.h ?? defaultSizes[blockType][1];
        const cth = options.cth ?? defaultSizes.stack[1];
        const ccw = options.ccw ?? defaultSizes.cblock[2];
        const cgh = options.cgh ?? defaultSizes.cblock[3];

        const iw = options.iw ?? 40;
        const ih = options.ih ?? h - inputPadding[inputType][0] - inputPadding[inputType][2];
        const iy = options.iy ?? (h + blockContentGaps[blockType][0] + inputPadding[inputType][0] - blockContentGaps[blockType][1] - inputPadding[inputType][2]) / 2 - ih / 2;
        const ic = options.ic ?? "#ffffff";

        const fill = options.fill ?? "#ffbf00";
        const stroke = options.stroke ?? "#cc9900";

        const x = options.x ?? padding[blockType][3];
        const y = options.y ?? h - padding[blockType][2];

        const text = options.text ?? "";
        const tc = options.tc ?? "#ffffff";
        const ta = options.ta ?? "start";
        const ts = options.ts ?? "12";
        const select = options.select ?? false;
        const noSelect = select ? "" : ` class="text-no-select"`;
        const fs = options.fs ?? "";

        let svgStr = "";

        switch (type) {
            case "block": // Requirements: blockType, fill, stroke, w, h (cblock: cth, ccw, cgh)
                switch (blockType) {
                    case "hat":
                        svgStr = `<path fill="${fill}" stroke="${stroke}" d="M 0 16 c 25,-21.33 71,-21.33 96,0 L ${w - 4} 16 a 4 4 0 0 1 4 4 L ${w} ${h - 4} a 4 4 0 0 1 -4 4 L 48 ${h} c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 ${h} a 4 4 0 0 1 -4 -4 Z"/>`;
                        break;
                    case "stack":
                        svgStr = `<path fill="${fill}" stroke="${stroke}" d="M 0 4 A 4 4 0 0 1 4 0 H 12 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 c 1 -1 2 -2 4 -2 L ${w - 4} 0 a 4 4 0 0 1 4 4 L ${w} ${h - 4} a 4 4 0 0 1 -4 4 L 48 ${h} c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 ${h} a 4 4 0 0 1 -4 -4 Z"/>`;
                        break;
                    case "cblock":
                        svgStr = `<path fill="${fill}" stroke="${stroke}" d="M 0 4 A 4 4 0 0 1 4 0 H 12 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 c 1 -1 2 -2 4 -2 L ${w - 4} 0 a 4 4 0 0 1 4 4 L ${w} ${cth - 4} a 4 4 0 0 1 -4 4 L ${ccw + 48} ${cth} c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L ${ccw + 4} ${cth} a 4 4 0 0 0 -4 4 L ${ccw} ${cth + cgh - 4} a 4 4 0 0 0 4 4 L ${ccw + 12} ${cth + cgh} c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 c 1 -1 2 -2 4 -2 L ${w - 4} ${cth + cgh} a 4 4 0 0 1 4 4 L ${w} ${h - 4} a 4 4 0 0 1 -4 4 L 48 ${h} c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 ${h} a 4 4 0 0 1 -4 -4 Z"/>`;
                        break;
                    case "reporter":
                    case "number":
                    case "string":
                    case "color":
                    case "direction":
                        svgStr = `<rect rx="${h / 2}" ry="${h / 2}" fill="${fill}" stroke="${stroke}" width="${w}" height="${h}"/>`;
                        break;
                    case "boolean":
                        const dx = h / 2;
                        svgStr = `<path fill="${fill}" stroke="${stroke}" d="M ${dx} 0 ${w - dx} 0 l ${dx} ${h / 2} ${-dx} ${h / 2} L ${dx} ${h} 0 ${h / 2} Z"/>`;
                        break;
                }

                addToSvg.unshift(svgStr);
                return;
            case "text": // Requirements: x, y, text; Optional: tc, ta, ts, select
                addToSvg.push(`<text x="${x}" y="${y}" xml:space="preserve"${noSelect} fill="${tc}" text-anchor="${ta}" dominant-baseline="central" font-family="Helvetica Neue" font-size="${ts}pt" font-weight="500" font-style="${fs}">${text}</text>`);
                return;
            case "input": // Requirements: inputType, x, y, stroke, iy, iw, ih; Optional: ic
            const idx = options.inputIndex !== undefined ? ` data-input-index="${options.inputIndex}"` : "";

                switch (inputType) {
                    // round
                    case "v":
                    case "n":
                    case "s":
                    case "c":
                    case "d":
                        svgStr = `<rect class="block-input input-${inputType}"${idx} rx="${ih / 2}" ry="${ih / 2}" x="${x}" y="${iy}" fill="${ic}" stroke="${stroke}" width="${iw}" height="${ih}"/>`;
                        break;

                    // hexagonal
                    case "b": {
                        const dx = ih / 2;
                        svgStr = `<path class="block-input input-b"${idx} transform="translate(${x},${iy})" fill="${ic}" stroke="${stroke}" d="M ${dx} 0 ${iw - dx} 0 l ${dx} ${ih / 2} ${-dx} ${ih / 2} L ${dx} ${ih} 0 ${ih / 2} Z"/>`;
                        break;
                    }

                    // rectangular
                    case "a":
                    case "p":
                        break;
                }

                addToSvg.push(svgStr);
                return;

        }
    }

    function getSvg (block) {
        const text = block.text;
        const shape = block.shape;

        const categoryObj = blockCategories.find(c => c.id == block.category);
        const fill = categoryObj.fill;
        const stroke = categoryObj.stroke;

        const inputs = block.inputs ?? [];
        const inputText = block.inputText ?? "";
        const inputHint = block.inputHint ?? false;

        addToSvg = [];

        const parts = text.split(/(%\d+)/g).filter(p => p !== "");

        let maxContentHeight = blockContentHeights[shape];
        inputs.forEach((t, i) => {
            const ih = customHeights[i] ?? blockContentHeights[shape] - inputPadding[t][0] - inputPadding[t][2];
            const requiredContentHeight = ih + inputPadding[t][0] + inputPadding[t][2];
            
            if (requiredContentHeight > maxContentHeight) {
                maxContentHeight = requiredContentHeight;
            }
        });

        let h = Math.max(blockHeights[shape], maxContentHeight + blockContentGaps[shape][0] + blockContentGaps[shape][1]);
        let x = padding[shape][3];
        const verticalCenter = (h + blockContentGaps[shape][0] - blockContentGaps[shape][1]) / 2;
        let y = verticalCenter + 2;

        let lastType;
        let lastInputType;
        
        parts.forEach((p,i) => {
            const inputMatch = p.match(/%(\d+)/);
            if (inputMatch) { // Input
                const inputNum = inputMatch[1];
                const inputType = inputs[inputNum - 1];
                if (!inputType) return;

                lastType = "input";
                lastInputType = inputType;

                if (i == 0) x = inputPadding[inputType][3];

                const it = inputText[inputNum - 1] ?? "";
                const iw = customWidths[inputNum - 1] ?? Math.max((inputHint ? textWidth(it, "italic 500 12pt Helvetica Neue") : textWidth(it)) + 20, 40);
                const ih = customHeights[inputNum - 1] ?? blockContentHeights[shape] - inputPadding[inputType][0] - inputPadding[inputType][2];
                const iy = (h + blockContentGaps[shape][0] + inputPadding[inputType][0] - blockContentGaps[shape][1] - inputPadding[inputType][2]) / 2 - ih / 2; // ((gap.top + input.top) + (h - gap.bottom - input.bottom)) / 2 - ih / 2

                const tc = inputHint ? "#00000066" : "#000000";
                const fs = inputHint ? "italic" : "";

                const select = !inputHint;

                if (shape == "stack") x = Math.max(x, 48);

                addToList("input", shape, {inputType, x, y, stroke, iy, iw, ih, inputIndex: inputNum - 1});
                if (it) {
                    addToList("text", shape, {text: it, x: x + iw / 2, y, tc, ta: "middle", ts: 10, select, fs});
                }

                x += iw;
            } else { // Text
                lastType = "text";
                addToList("text", shape, {text: p, x, y});

                x += textWidth(p);
            }
        });

        const rightPadding = (lastType == "text" || !lastInputType) 
                             ? padding[shape][1] 
                             : inputPadding[lastInputType][1];

        const w = Math.max(x + rightPadding, defaultSizes[shape][0]);
        const fullWidth = w + strokeWidth;
        const scaledWidth = fullWidth * blockScale;

        const hasConnector = ["hat", "stack", "cblock"].includes(shape);
        const fullHeight = h + (hasConnector ? blockPartHeights.connect : 0) + strokeWidth;
        const scaledHeight = fullHeight * blockScale;

        const options = {w, h, fill, stroke, cth: maxContentHeight};

        addToList("block", shape, options);

        const widthsStr = JSON.stringify(customWidths);
        const heightsStr = JSON.stringify(customHeights);

        let svg = `<svg class="block" data-type-id="${blocks.indexOf(block)}" data-shape="${shape}" data-codeid="${block.codeId}" data-input-widths="${widthsStr}" data-input-heights="${heightsStr}" width="${scaledWidth}" height="${scaledHeight}" viewBox="-0.5 -0.5 ${fullWidth} ${fullHeight}" xmlns="http://www.w3.org/2000/svg">`;
        addToSvg.forEach(str => svg += str);
        svg += "</svg>";

        return svg;
    }

    return getSvg (blockObj);
}

document.addEventListener("DOMContentLoaded", () => {
    initWorkspace();

    // #region Drag & Drop Variables
    const SNAP_RANGE = 25;
    const workspaceBlocks = [];

    let dragging = false;
    let draggingBlock = null;

    const inputShortNames = {
        reporter: "v",
        number: "n",
        string: "s",
        boolean: "b",
        array: "a",
        color: "c",
        position: "p",
        direction: "d",
    };

    const workspace = document.querySelector(".workspace");
    const blockPanel = document.querySelector(".blocks");
    // #endregion

    // #region Drag & Drop Functions
    function updateWorkspaceBlocks (id, options = {}) { // { typeId, blockId, parentId, groupId, dragged, offsetX, offsetY, left, top, width, height }
        if (isNaN(id) && id !== "new") return;
        if ((id < 0 || id + 1 > workspaceBlocks.length) && id !== "new") return;

        const existing = id !== "new" ? workspaceBlocks[id] : {};

        const typeId = options.typeId ?? existing.typeId ?? 0;
        const blockId = id == "new" ? workspaceBlocks.length : id;
        const parentId = options.parentId ?? existing.parentId ?? null;
        const groupId = options.groupId ?? existing.groupId ?? -1;

        const dragged = options.dragged ?? existing.dragged ?? false;
        const offsetX = options.offsetX ?? existing.offsetX ?? 0;
        const offsetY = options.offsetY ?? existing.offsetY ?? 0;

        const left = options.left ?? existing.left ?? 0;
        const top = options.top ?? existing.top ?? 0;

        const width = options.width ?? existing.width ?? 0;
        const height = options.height ?? existing.height ?? 0;

        const blockData = { typeId, blockId, parentId, groupId, dragged, offsetX, offsetY, left, top, width, height };

        if (id == "new") {
            workspaceBlocks.push(blockData);
        } else {
            workspaceBlocks[id] = blockData;
        }
    }

    function getSubtree(id) {
        let list = [id];
        let added = true;
        while (added) {
            added = false;
            workspaceBlocks.forEach(b => {
                if (b && b.parentId !== null && list.includes(b.parentId) && !list.includes(b.blockId)) {
                    list.push(b.blockId);
                    added = true;
                }
            });
        }
        return list;
    }

    function findSnapTarget (draggedRect, workspace) {
        
    }
    // #endregion

    document.body.addEventListener("pointerdown", (event) => { // ---------- 1 ----------
        if (event.target.closest(".block")) { // Prevent scroll bar to change cursor to normal
            event.target.setPointerCapture(event.pointerId);
        }

        const inWorkspace = !!event.target.closest(".workspace");
        const inPanel = !!event.target.closest(".blocks");
        
        if (inPanel) { // Inside the Block Panel
            const clickedBlock = event.target.closest(".block");
            if (!clickedBlock) return;

            const blockRect = clickedBlock.getBoundingClientRect();
            const offsetX = event.clientX - blockRect.left;
            const offsetY = event.clientY - blockRect.top;

            const clone = clickedBlock.cloneNode(true);
            const newId = workspaceBlocks.length;

            clone.id = `block-${newId}`;
            clone.dataset.blockId = newId;
            clone.classList.add("workspace-block", "dragging-block");
            document.body.classList.add("dragging-active");

            clone.style.pointerEvents = "none";
            clone.style.zIndex = "99999";
            clone.style.width = `${blockRect.width}px`;
            clone.style.height = `${blockRect.height}px`;

            const left = event.clientX - offsetX;
            const top = event.clientY - offsetY;

            clone.style.left = `${left}px`;
            clone.style.top = `${top}px`;

            document.body.appendChild(clone);

            updateWorkspaceBlocks("new", {
                typeId: +clickedBlock.dataset.typeId,
                dragged: true,
                offsetX,
                offsetY,
                left,
                top,
                width: blockRect.width,
                height: blockRect.height
            });
            dragging = true;
            draggingBlock = clone;

            console.log(workspaceBlocks)
        } else if (inWorkspace) { // Inside the Workspace
            const clickedBlock = event.target.closest(".block");
            if (!clickedBlock) return;

            const blockId = +clickedBlock.dataset.blockId;
            const blockRect = clickedBlock.getBoundingClientRect();
            const offsetX = event.clientX - blockRect.left;
            const offsetY = event.clientY - blockRect.top;

            updateWorkspaceBlocks(blockId, { parentId: null, dragged: true, offsetX, offsetY });

            const subtree = getSubtree(blockId);
            subtree.forEach(id => {
                const el = document.getElementById(`block-${id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    workspaceBlocks[id].relX = rect.left - blockRect.left;
                    workspaceBlocks[id].relY = rect.top - blockRect.top;

                    el.classList.add("dragging-block");
                    el.style.width = `${rect.width}px`;
                    el.style.height = `${rect.height}px`;
                    el.style.left = `${event.clientX - offsetX + workspaceBlocks[id].relX}px`;
                    el.style.top = `${event.clientY - offsetY + workspaceBlocks[id].relY}px`;
                    document.body.appendChild(el);
                }
            });

            document.body.classList.add("dragging-active");

            dragging = true;
            draggingBlock = clickedBlock;
        }
    });

    document.body.addEventListener("pointermove", (event) => { // ========== 2 ==========
        if (!dragging || !draggingBlock) return;

        const startId = +draggingBlock.dataset.blockId;
        const bData = workspaceBlocks[startId];
        const subtree = getSubtree(startId);

        subtree.forEach(id => {
            const el = document.getElementById(`block-${id}`);
            if (el) {
                const relX = workspaceBlocks[id].relX || 0;
                const relY = workspaceBlocks[id].relY || 0;
                el.style.left = `${event.clientX - bData.offsetX + relX}px`;
                el.style.top = `${event.clientY - bData.offsetY + relY}px`;
            }
        });
    });

    document.body.addEventListener("pointerup", (event) => { // ≡≡≡≡≡≡≡≡≡≡ 3 ≡≡≡≡≡≡≡≡≡≡
        if (event.target.hasPointerCapture && event.target.hasPointerCapture(event.pointerId)) {
            event.target.releasePointerCapture(event.pointerId);
        }

        if (!dragging || !draggingBlock) return;

        const blockId = +draggingBlock.dataset.blockId;
        const bData = workspaceBlocks[blockId];

        const subtree = getSubtree(blockId);

        const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
        const droppedInPanel = !!dropTarget?.closest(".block-panel");
        console.log(droppedInPanel)

        if (droppedInPanel) {
            subtree.forEach(id => {
                const el = document.getElementById(`block-${id}`);
                if (el) el.remove();
                workspaceBlocks[id] = null;
            });
        } else {
            const workspaceRect = workspace.getBoundingClientRect();
            const rootLeft = event.clientX - workspaceRect.left - bData.offsetX + workspace.scrollLeft;
            const rootTop = event.clientY - workspaceRect.top - bData.offsetY + workspace.scrollTop;

            subtree.forEach(id => {
                const el = document.getElementById(`block-${id}`);
                if (el) {
                    const relX = workspaceBlocks[id].relX || 0;
                    const relY = workspaceBlocks[id].relY || 0;
                    const finalLeft = rootLeft + relX;
                    const finalTop = rootTop + relY;

                    el.classList.remove("dragging-block");
                    el.style.position = "absolute";
                    el.style.left = `${finalLeft}px`;
                    el.style.top = `${finalTop}px`;
                    el.style.pointerEvents = "auto";
                    el.style.opacity = "1";
                    el.style.zIndex = "10";

                    workspace.appendChild(el);

                    updateWorkspaceBlocks(id, {
                        dragged: false,
                        left: finalLeft,
                        top: finalTop
                    });
                }
            });
        }

        document.body.classList.remove("dragging-active");
        
        dragging = false;
        draggingBlock = null;
    });
});
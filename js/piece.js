// #region Info
const infoInputs = [
    { 
        name: "name",
        id: "piece-info-name",
        label: "Name #:",
        inputs: ["t"],
        placeholder: ["Piece Name"],
        max: [20], 
        chars: ["A-Za-z0-9 ()_+-"] 
    },
    { 
        name: "value",
        id: "piece-info-value",
        label: "Value:",
        inputs: ["n", "n", "n", "n", ".", "n", "n"],
        value: [0, 0, 0, 1, ".", 0, 0],
        max: [1, 1, 1, 1, 0, 1, 1],
        chars: ["0-9", "0-9", "0-9", "0-9", "\\.", "0-9", "0-9"] 
    },
    { 
        name: "desc",
        id: "piece-info-desc",
        label: "Description #:",
        inputs: ["T"],
        placeholder: ["Piece Description"],
        max: [100], 
        maxLines: [5],
        chars: ["A-Za-z0-9 ()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?!@#$%^&*~`\\n\\r"]
    },
];

function initInfo() {
    function updateCount(element, originalText, count, max) {
        const newText = originalText.replaceAll("#", `(${count}/${max})`);
        element.textContent = newText;
    }

    const infoDiv = document.querySelector(".piece-info-placeholder");
    const paddingX = 8;
    const paddingY = 12;
    const borderWidth = 2;

    infoInputs.forEach(i => {
        const div = document.createElement("div");
        div.id = i.id;
        div.className = "piece-info-section";
        infoDiv.appendChild(div);

        const label = document.createElement("label");
        const labelText = i.label ?? "";
        label.className = "piece-info-label";
        label.style.flex = "1";
        label.style.fontWeight = "bold";
        div.appendChild(label);

        let totalLength = 0;
        let totalMax = 0;

        i.inputs.forEach((iType, index) => {
            const isTextArea = iType === "T";
            
            const input = document.createElement(isTextArea ? "textarea" : "input");
            input.spellcheck = false;

            const max = i.max ? (i.max[index] ?? 1) : 1;
            const maxLines = i.maxLines ? i.maxLines[index] : null;
            const numMax = i.numMax ? i.numMax[index] : null;
            const val = i.value && i.value[index] !== null ? i.value[index] : "";
            const rawChars = Array.isArray(i.chars) ? i.chars[index] : i.chars;

            input.placeholder = i.placeholder ? (i.placeholder[index] ?? "") : "";
            input.value = val;
            input.id = `piece-info-input-${i.name}-${index}`;
            input.className = "piece-info-input" + (isTextArea ? " piece-info-textarea" : "");

            if (isTextArea) {
                input.rows = 3;
                input.style.resize = "vertical";
            }

            if (max === 0) {
                input.readOnly = true;
                input.tabIndex = -1;
            }

            input.style.padding = `${paddingY}px ${paddingX}px`;
            input.style.borderWidth = `${borderWidth}px`;
            if (iType == "T") {
                const charsPerLine = 40; 
                const lines = maxLines ?? Math.max(2, Math.ceil(max / charsPerLine));

                input.rows = lines;
                input.style.lineHeight = "1.4em";
                input.style.flex = "1";
                input.style.resize = "none";
                
                input.style.height = `calc(${lines * 1.4}em + ${paddingY * 2}px + ${borderWidth * 2}px)`;
            } else {
                const widthCh = Math.max(max, 1);
                input.style.width = `calc(${widthCh}ch + ${paddingX * 2}px + ${borderWidth * 2}px)`;
            }
            input.maxLength = max;

            totalLength += String(val).length;
            totalMax += max;

            input.addEventListener("input", (event) => {
                if (input.readOnly) return;

                const text = event.target.value;
                let updatedText = text;

                if (rawChars) {
                    const regex = new RegExp(`[^${rawChars}]+`, "g");
                    updatedText = text.replaceAll(regex, "");
                }

                if (maxLines !== null) {
                    const lineArray = updatedText.split(/\r?\n/);
                    if (lineArray.length > maxLines) {
                        updatedText = lineArray.slice(0, maxLines).join("\n");
                    }
                }

                if (numMax !== null && updatedText !== "") {
                    updatedText = Math.min(+updatedText, numMax);
                }

                input.value = updatedText;

                const currentInputs = div.querySelectorAll(".piece-info-input");
                const currentTotalLength = Array.from(currentInputs)
                    .reduce((acc, el) => acc + el.value.length, 0);

                updateCount(label, labelText, currentTotalLength, totalMax);
            });

            if (iType === "n") {
                input.readOnly = true;
                input.style.cursor = "pointer";

                input.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openNumpad(input);
                });

                input.addEventListener("keydown", (e) => {
                    if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        input.value = e.key;
                        input.dispatchEvent(new Event("input", { bubbles: true }));

                        if (numpadEl) numpadEl.style.display = "none";
                    }
                });
            }

            div.appendChild(input);
        });

        updateCount(label, labelText, totalLength, totalMax);
    });
}

let numpadEl = null;
let activeInput = null;

function openNumpad(targetInput) {
    if (!numpadEl) {
        numpadEl = document.createElement("div");
        numpadEl.className = "custom-numpad";
        numpadEl.style.cssText = `
            position: absolute;
            display: grid;
            grid-template-columns: repeat(3, 42px);
            gap: 6px;
            padding: 8px;
            background: #18181899;
            border: 2px solid #f96800;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;

        const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
        digits.forEach(digit => {
            const btn = document.createElement("button");
            btn.textContent = digit;
            btn.style.cssText = "padding: 8px; background: #303030aa; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px;";
            
            if (digit === "0") {
                btn.style.gridColumn = "span 3";
            }

            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (!activeInput) return;

                activeInput.value = digit;                
                activeInput.dispatchEvent(new Event("input", { bubbles: true }));

                numpadEl.style.display = "none";
            });
            numpadEl.appendChild(btn);
        });

        document.addEventListener("click", (e) => {
            if (numpadEl && !numpadEl.contains(e.target) && e.target !== activeInput) {
                numpadEl.style.display = "none";
            }
        });

        document.body.appendChild(numpadEl);
    }

    activeInput = targetInput;

    numpadEl.style.display = "grid";
    const padWidth = numpadEl.offsetWidth;
    const rect = targetInput.getBoundingClientRect();
    numpadEl.style.top = `${rect.bottom + window.scrollY + 6}px`;
    numpadEl.style.left = `${(rect.left + rect.right) / 2 - padWidth / 2 + window.scrollX}px`;
    numpadEl.style.display = "grid";
}

initInfo();
// #endregion

// #region SVG
function addSvgTools (container) {
    const toolList = [
        {
            id: "mouse",
            img: "assets/images/icons/svg-tools/mouse.svg",
            select: true
        },
        {
            id: "pen",
            img: "assets/images/icons/svg-tools/pen.svg",
            select: false
        },
        {
            id: "points",
            img: "assets/images/icons/svg-tools/points.svg",
            select: false
        },
    ];

    toolList.forEach((t, i) => {
        const tool = document.createElement("div");

        tool.className = t.select ? "piece-svg-tool-selected" : "piece-svg-tool";
        tool.id = `piece-svg-tools-${t.id}`;
        toolList[i].element = tool;

        container.appendChild(tool);

        const toolIcon = t.img;
        fetch(toolIcon)
            .then(response => response.text())
            .then(svgText => {
                tool.insertAdjacentHTML("beforeend", svgText);
            })
            .catch(error => console.error("Failed to load tool icon:", error));

        tool.addEventListener("click", (event) => {
            toolList.forEach(tl => tl.element.className = "piece-svg-tool");
            toolList[i].element.className = "piece-svg-tool-selected";
        })
    });
}

function initEditor (container) {
    const editor = document.createElement("div");
    editor.className = "piece-svg-editor-rect";
    container.appendChild(editor);

    const svgNS = "http://www.w3.org/2000/svg";

    const svgWorkspace = document.createElementNS(svgNS, "svg");
    svgWorkspace.setAttribute("width", "100%");
    svgWorkspace.setAttribute("height", "100%");
    svgWorkspace.setAttribute("viewBox", "0 0 100 100"); 
    svgWorkspace.setAttribute("id", "piece-svg-canvas");

    const gridSpacing = 10;
    const majorGridSpacing = 50;

    const defs = document.createElementNS(svgNS, "defs");

    const minorPattern = document.createElementNS(svgNS, "pattern");
    minorPattern.setAttribute("id", "minor-grid");
    minorPattern.setAttribute("width", gridSpacing);
    minorPattern.setAttribute("height", gridSpacing);
    minorPattern.setAttribute("patternUnits", "userSpaceOnUse");

    const minorPath = document.createElementNS(svgNS, "path");
    minorPath.setAttribute("d", `M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`);
    minorPath.setAttribute("fill", "none");
    minorPath.setAttribute("stroke", "rgba(0, 0, 0, 0.08)");
    minorPath.setAttribute("stroke-width", "0.5");
    minorPattern.appendChild(minorPath);

    const majorPattern = document.createElementNS(svgNS, "pattern");
    majorPattern.setAttribute("id", "grid");
    majorPattern.setAttribute("width", majorGridSpacing);
    majorPattern.setAttribute("height", majorGridSpacing);
    majorPattern.setAttribute("patternUnits", "userSpaceOnUse");

    const majorRect = document.createElementNS(svgNS, "rect");
    majorRect.setAttribute("width", majorGridSpacing);
    majorRect.setAttribute("height", majorGridSpacing);
    majorRect.setAttribute("fill", "url(#minor-grid)");
    majorPattern.appendChild(majorRect);

    const majorPath = document.createElementNS(svgNS, "path");
    majorPath.setAttribute("d", `M ${majorGridSpacing} 0 L 0 0 0 ${majorGridSpacing}`);
    majorPath.setAttribute("fill", "none");
    majorPath.setAttribute("stroke", "rgba(0, 0, 0, 0.25)");
    majorPath.setAttribute("stroke-width", "1");
    majorPattern.appendChild(majorPath);

    defs.appendChild(minorPattern);
    defs.appendChild(majorPattern);
    svgWorkspace.appendChild(defs);

    const gridBackdrop = document.createElementNS(svgNS, "rect");
    gridBackdrop.setAttribute("width", "100%");
    gridBackdrop.setAttribute("height", "100%");
    gridBackdrop.setAttribute("fill", "url(#grid)");
    svgWorkspace.appendChild(gridBackdrop);

    editor.appendChild(svgWorkspace);
}

const editorOptionDiv = document.getElementById("piece-svg-option-editor");
const fullEditorDiv = document.querySelector(".piece-svg-full-editor");
editorOptionDiv.addEventListener("click", (event) => {
    const margin = 20;
    const topBar = document.getElementById("top-bar-placeholder");
    const topBarHeight = topBar.getBoundingClientRect().bottom;

    fullEditorDiv.style.top = `${topBarHeight}px`;
    fullEditorDiv.style.left = "0";
    fullEditorDiv.style.width = `calc(100dvw - ${margin * 2}px)`;
    fullEditorDiv.style.height = `calc(100% - ${margin * 2}px - ${topBarHeight}px)`;
    fullEditorDiv.style.margin = `${margin}px`;
    fullEditorDiv.classList.add("active");
});

const exitDiv = document.getElementById("piece-svg-editor-exit");
exitDiv.addEventListener("click", (event) => {
    fullEditorDiv.classList.remove("active");
});

const toolDiv = document.querySelector(".piece-svg-tools");
addSvgTools(toolDiv);

const editorDiv = document.querySelector(".piece-svg-editor");
initEditor(editorDiv);

const canvas = document.querySelector(".piece-svg-editor-rect");
const svgWidth = 100;
const svgHeight = 100;

canvas.addEventListener("click", (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.right - canvasRect.left;
    const canvasHeight = canvasRect.bottom - canvasRect.top;
    const clickX = event.clientX - canvasRect.left;
    const clickY = event.clientY - canvasRect.top;
    const svgX = clickX / canvasWidth * svgWidth;
    const svgY = clickY / canvasHeight * svgHeight;

    console.log(svgX, svgY)
});

// #endregion
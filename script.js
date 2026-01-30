document.addEventListener('DOMContentLoaded', () => {
    /** * 1. MOBILE DRAG-DROP INITIALIZATION */
    if (typeof MobileDragDrop !== 'undefined') {
        MobileDragDrop.polyfill({
            holdToDrag: 500,
            dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
        });

        // CRITICAL: This is the ONLY way to stop that [Intervention] error.
        // We must catch the touchmove event on the window and kill it.
        window.addEventListener('touchmove', function (e) {
            // Only prevent scroll if we are currently dragging a cell
            if (document.querySelector('.dragging')) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }, { passive: false }); // 'passive: false' is mandatory to allow preventDefault
    }

    // Standard Selectors
    const grid = document.getElementById('grid');
    const wpContainer = document.getElementById('wallpaper-container');
    const addBtn = document.getElementById('addBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const wrap = document.getElementById('scale-wrap');

    // Sidebar Input Selectors
    const subInput = document.getElementById('subInput');
    const timeInput = document.getElementById('timeInput');
    const roomInput = document.getElementById('roomInput');
    const dayInput = document.getElementById('dayInput');
    const rowInput = document.getElementById('rowInput');
    const yearStartInput = document.getElementById('yearStartInput');
    const yearEndInput = document.getElementById('yearEndInput');
    const termInput = document.getElementById('termInput');

    // Wallpaper Labels
    const yearStartLabel = document.getElementById('yearStartLabel');
    const yearEndLabel = document.getElementById('yearEndLabel');
    const termLabel = document.getElementById('termLabel');

    // MODAL Selectors
    const editModal = document.getElementById('editModal');
    const helpModal = document.getElementById('helpModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalApply = document.getElementById('modalApply');
    const modalClear = document.getElementById('modalClear');
    const modalStar = document.getElementById('modalStar');
    const modalClose = document.getElementById('modalClose');
    const helpBtn = document.getElementById('helpBtn');
    const helpClose = document.getElementById('helpClose');

    let activeEditTarget = null;

    /**
     * 2. MODAL LOGIC (The "Edit Panel")
     */
    const openModal = (target, type) => {
        activeEditTarget = target;
        editModal.style.display = 'flex';
        modalBody.innerHTML = '';

        if (type === 'header') {
            modalTitle.innerText = "Edit Header";
            modalBody.innerHTML = `
                <div class="input-group">
                    <label>New Value</label>
                    <input type="text" id="editValue" value="${target.innerText}">
                </div>`;
            modalClear.style.display = 'none';
            modalStar.style.display = 'none';
        }
        else if (type === 'cell') {
            modalTitle.innerText = "Edit Subject";
            const sub = target.querySelector('.sub-txt')?.innerText || "";
            const time = target.querySelector('.time-txt')?.innerText || "";
            const room = target.querySelector('.room-txt')?.innerText || "";

            modalBody.innerHTML = `
                <div class="input-group"><label>Subject</label><input type="text" id="editSub" value="${sub}"></div>
                <div class="input-group"><label>Time</label><input type="text" id="editTime" value="${time}"></div>
                <div class="input-group"><label>Code/Room</label><input type="text" id="editRoom" value="${room}"></div>
            `;

            modalClear.style.display = 'block';

            const hasSubject = target.querySelector('.content-box');
            const hasStar = target.querySelector('.star-icon');
            modalStar.style.display = (!hasSubject || hasStar) ? 'block' : 'none';
        }
    };

    modalClose.onclick = () => editModal.style.display = 'none';
    if (helpClose) helpClose.onclick = () => helpModal.style.display = 'none';
    if (helpBtn) helpBtn.onclick = () => helpModal.style.display = 'flex';

    window.onclick = (event) => {
        if (event.target == editModal) editModal.style.display = 'none';
        if (event.target == helpModal) helpModal.style.display = 'none';
    };

    modalApply.onclick = () => {
        if (modalTitle.innerText === "Edit Header") {
            const newVal = document.getElementById('editValue').value.toUpperCase();
            activeEditTarget.innerText = newVal;
            if (activeEditTarget.id === 'yearStartLabel') yearStartInput.value = newVal;
            if (activeEditTarget.id === 'yearEndLabel') yearEndInput.value = newVal;
            if (activeEditTarget.id === 'termLabel') termInput.value = newVal;
        } else {
            const s = document.getElementById('editSub').value.toUpperCase();
            const t = document.getElementById('editTime').value;
            const r = document.getElementById('editRoom').value.toUpperCase();
            if (s) {
                const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                activeEditTarget.innerHTML = handleHTML + `
                    <div class="content-box">
                        <p class="sub-txt">${s}</p>
                        <p class="time-txt">${t}</p>
                        <p class="room-txt">${r}</p>
                    </div>`;
            }
        }
        saveToLocal();
        editModal.style.display = 'none';
    };

    modalClear.onclick = () => {
        activeEditTarget.innerHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        saveToLocal();
        editModal.style.display = 'none';
    };

    modalStar.onclick = () => {
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        if (activeEditTarget.innerHTML.includes('★')) {
            activeEditTarget.innerHTML = handleHTML;
        } else {
            activeEditTarget.innerHTML = handleHTML + '<span class="star-icon">★</span>';
        }
        saveToLocal();
        editModal.style.display = 'none';
    };

    /**
     * 3. INITIALIZE GRID & DRAG-AND-DROP
     */
    function initGrid() {
        grid.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => cell.remove());

        let debugBox = document.getElementById('mobile-debug-status');
        if (!debugBox) {
            debugBox = document.createElement('div');
            debugBox.id = 'mobile-debug-status';
            debugBox.style = "position:fixed; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:#00f3ff; padding:5px 15px; border-radius:20px; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00f3ff;";
            document.body.appendChild(debugBox);
        }

        // NEW: Memory variable to store the last valid cell we hovered over
        let lastHoveredCell = null;

        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell-${i}`;
            cell.draggable = true;

            const handle = document.createElement('div');
            handle.className = 'drag-handle';
            for (let d = 0; d < 6; d++) handle.appendChild(document.createElement('span'));
            cell.appendChild(handle);

            cell.addEventListener('dragstart', (e) => {
                if (navigator.vibrate) navigator.vibrate(50);
                e.dataTransfer.setData('text/plain', i);
                cell.classList.add('dragging');
                lastHoveredCell = null; // Reset memory
                debugBox.innerText = `START: Dragging Cell ${i}`;
            });

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                const touch = e.touches ? e.touches[0] : e;

                const draggingElem = document.querySelector('.dragging');
                if (draggingElem) draggingElem.style.pointerEvents = 'none';

                const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell');

                if (draggingElem) draggingElem.style.pointerEvents = 'all';

                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));

                if (target && !target.classList.contains('day-label')) {
                    target.classList.add('drag-over');
                    lastHoveredCell = target; // Update memory with the current valid target
                    if (debugBox) debugBox.innerText = `HOVERING: ${target.id}`;
                }
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggingElem = document.querySelector('.dragging');
                if (!draggingElem) return;

                const sourceIndex = draggingElem.id.replace('cell-', '');
                const touch = e.changedTouches ? e.changedTouches[0] : e;

                // 1. Try to find target via current coordinates
                draggingElem.style.pointerEvents = 'none';
                let targetCell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell');
                draggingElem.style.pointerEvents = 'all';

                // 2. FALLBACK: If targetCell is null (common on long-hold drops), use the last valid hovered cell
                if (!targetCell || targetCell.classList.contains('day-label')) {
                    targetCell = lastHoveredCell;
                }

                if (targetCell && targetCell.id !== `cell-${sourceIndex}` && !targetCell.classList.contains('day-label')) {
                    const sourceCell = document.getElementById(`cell-${sourceIndex}`);

                    const targetContent = targetCell.querySelector('.content-box')?.outerHTML || targetCell.querySelector('.star-icon')?.outerHTML || '';
                    const sourceContent = sourceCell.querySelector('.content-box')?.outerHTML || sourceCell.querySelector('.star-icon')?.outerHTML || '';

                    const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                    targetCell.innerHTML = handleHTML + sourceContent;
                    sourceCell.innerHTML = handleHTML + targetContent;

                    debugBox.innerText = `SUCCESS: Swapped ${sourceIndex} with ${targetCell.id}`;
                    saveToLocal();
                } else {
                    debugBox.innerText = `DROP FAILED: No target found`;
                }

                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over', 'dragging'));
                lastHoveredCell = null; // Clear memory
            });

            cell.addEventListener('dragend', () => {
                cell.classList.add('mobile-pulse'); // Add visual feedback that drag finished
                setTimeout(() => {
                    cell.classList.remove('dragging', 'mobile-pulse');
                    cell.style.pointerEvents = 'all';
                    debugBox.innerText = "WAITING FOR DRAG...";
                }, 300);
            });

            cell.addEventListener('click', (e) => {
                if (!e.target.classList.contains('drag-handle')) openModal(cell, 'cell');
            });

            grid.appendChild(cell);
        }
    }

    [yearStartLabel, yearEndLabel, termLabel].forEach(label => {
        label.addEventListener('click', () => openModal(label, 'header'));
    });

    /**
     * 4. SIDEBAR LOGIC (Live Updates)
     */
    // Example for updating header in script.js
    const updateHeader = () => {
        yearStartLabel.innerText = yearStartInput.value || "2025";
        yearEndLabel.innerText = yearEndInput.value || "2026";
        termLabel.innerText = termInput.value || "TERM 1";
        saveToLocal();
    };

    yearStartInput.oninput = updateHeader;
    yearEndInput.oninput = updateHeader;
    termInput.oninput = updateHeader;

    addBtn.onclick = () => {
        const sub = subInput.value.trim();
        const time = timeInput.value.trim();
        const room = roomInput.value.trim();
        const day = parseInt(dayInput.value);
        const row = parseInt(rowInput.value) - 1;

        if (isNaN(row) || row < 0 || row > 4 || !sub) {
            alert("Please provide a Subject and a valid Row (1-5).");
            return;
        }

        const cellIndex = (row * 5) + day;
        const targetCell = document.getElementById(`cell-${cellIndex}`);
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        targetCell.innerHTML = handleHTML + `
            <div class="content-box">
                <p class="sub-txt">${sub.toUpperCase()}</p>
                <p class="time-txt">${time}</p>
                <p class="room-txt">${room.toUpperCase()}</p>
            </div>`;
        saveToLocal();
        clearInputs();
    };

    /**
     * 5. PERSISTENCE & EXPORT
     */
    function saveToLocal() {
        const scheduleData = [];
        document.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => scheduleData.push(cell.innerHTML));
        const headerData = {
            start: yearStartInput.value,
            end: yearEndInput.value,
            term: termInput.value,
            theme: wpContainer.className
        };
        localStorage.setItem('lab_schedule', JSON.stringify(scheduleData));
        localStorage.setItem('lab_header', JSON.stringify(headerData));
    }

    function loadFromLocal() {
        const savedSchedule = localStorage.getItem('lab_schedule');
        const savedHeader = localStorage.getItem('lab_header');

        if (savedSchedule) {
            const data = JSON.parse(savedSchedule);
            const cells = document.querySelectorAll('.grid-cell:not(.day-label)');
            data.forEach((content, i) => { if (cells[i]) cells[i].innerHTML = content; });
        }
        if (savedHeader) {
            const h = JSON.parse(savedHeader);
            yearStartInput.value = h.start || "";
            yearEndInput.value = h.end || "";
            termInput.value = h.term || "";
            wpContainer.className = h.theme || "theme-classic";
            updateHeader();
        }
    }

    downloadBtn.onclick = () => {
        wpContainer.classList.add('is-exporting');

        // Give the browser 100ms to apply the .is-exporting styles
        setTimeout(() => {
            html2canvas(wpContainer, {
                scale: 3,
                useCORS: true,
                logging: false,
                y: 0,
                scrollY: 0
            }).then(canvas => {
                wpContainer.classList.remove('is-exporting');
                const link = document.createElement('a');
                link.download = `my-schedule-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }, 100);
    };

    clearBtn.onclick = () => {
        if (confirm("Clear entire schedule?")) {
            const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
            document.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => cell.innerHTML = handleHTML);
            saveToLocal();
        }
    };

    function autoScale() {
        const preview = document.querySelector('.preview-area');
        if (!wrap || !preview) return;
        const scale = Math.min(preview.offsetWidth / 400, preview.offsetHeight / 920);
        wrap.style.transform = `scale(${scale * 0.95})`;
    }

    function clearInputs() {
        subInput.value = '';
        timeInput.value = '';
        roomInput.value = '';
    }

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = function () {
            wpContainer.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
            wpContainer.classList.add(`theme-${this.classList[1]}`);
            saveToLocal();
        };
    });

    window.onresize = autoScale;
    initGrid();
    loadFromLocal();
    autoScale();
}); document.addEventListener('DOMContentLoaded', () => {
    /** * 1. MOBILE DRAG-DROP INITIALIZATION */
    if (typeof MobileDragDrop !== 'undefined') {
        MobileDragDrop.polyfill({
            holdToDrag: 500,
            dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
        });

        // CRITICAL: This is the ONLY way to stop that [Intervention] error.
        // We must catch the touchmove event on the window and kill it.
        window.addEventListener('touchmove', function (e) {
            // Only prevent scroll if we are currently dragging a cell
            if (document.querySelector('.dragging')) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }, { passive: false }); // 'passive: false' is mandatory to allow preventDefault
    }

    // Standard Selectors
    const grid = document.getElementById('grid');
    const wpContainer = document.getElementById('wallpaper-container');
    const addBtn = document.getElementById('addBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const wrap = document.getElementById('scale-wrap');

    // Sidebar Input Selectors
    const subInput = document.getElementById('subInput');
    const timeInput = document.getElementById('timeInput');
    const roomInput = document.getElementById('roomInput');
    const dayInput = document.getElementById('dayInput');
    const rowInput = document.getElementById('rowInput');
    const yearStartInput = document.getElementById('yearStartInput');
    const yearEndInput = document.getElementById('yearEndInput');
    const termInput = document.getElementById('termInput');

    // Wallpaper Labels
    const yearStartLabel = document.getElementById('yearStartLabel');
    const yearEndLabel = document.getElementById('yearEndLabel');
    const termLabel = document.getElementById('termLabel');

    // MODAL Selectors
    const editModal = document.getElementById('editModal');
    const helpModal = document.getElementById('helpModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalApply = document.getElementById('modalApply');
    const modalClear = document.getElementById('modalClear');
    const modalStar = document.getElementById('modalStar');
    const modalClose = document.getElementById('modalClose');
    const helpBtn = document.getElementById('helpBtn');
    const helpClose = document.getElementById('helpClose');

    let activeEditTarget = null;

    /**
     * 2. MODAL LOGIC (The "Edit Panel")
     */
    const openModal = (target, type) => {
        activeEditTarget = target;
        editModal.style.display = 'flex';
        modalBody.innerHTML = '';

        if (type === 'header') {
            modalTitle.innerText = "Edit Header";
            modalBody.innerHTML = `
                <div class="input-group">
                    <label>New Value</label>
                    <input type="text" id="editValue" value="${target.innerText}">
                </div>`;
            modalClear.style.display = 'none';
            modalStar.style.display = 'none';
        }
        else if (type === 'cell') {
            modalTitle.innerText = "Edit Subject";
            const sub = target.querySelector('.sub-txt')?.innerText || "";
            const time = target.querySelector('.time-txt')?.innerText || "";
            const room = target.querySelector('.room-txt')?.innerText || "";

            modalBody.innerHTML = `
                <div class="input-group"><label>Subject</label><input type="text" id="editSub" value="${sub}"></div>
                <div class="input-group"><label>Time</label><input type="text" id="editTime" value="${time}"></div>
                <div class="input-group"><label>Code/Room</label><input type="text" id="editRoom" value="${room}"></div>
            `;

            modalClear.style.display = 'block';

            const hasSubject = target.querySelector('.content-box');
            const hasStar = target.querySelector('.star-icon');
            modalStar.style.display = (!hasSubject || hasStar) ? 'block' : 'none';
        }
    };

    modalClose.onclick = () => editModal.style.display = 'none';
    if (helpClose) helpClose.onclick = () => helpModal.style.display = 'none';
    if (helpBtn) helpBtn.onclick = () => helpModal.style.display = 'flex';

    window.onclick = (event) => {
        if (event.target == editModal) editModal.style.display = 'none';
        if (event.target == helpModal) helpModal.style.display = 'none';
    };

    modalApply.onclick = () => {
        if (modalTitle.innerText === "Edit Header") {
            const newVal = document.getElementById('editValue').value.toUpperCase();
            activeEditTarget.innerText = newVal;
            if (activeEditTarget.id === 'yearStartLabel') yearStartInput.value = newVal;
            if (activeEditTarget.id === 'yearEndLabel') yearEndInput.value = newVal;
            if (activeEditTarget.id === 'termLabel') termInput.value = newVal;
        } else {
            const s = document.getElementById('editSub').value.toUpperCase();
            const t = document.getElementById('editTime').value;
            const r = document.getElementById('editRoom').value.toUpperCase();
            if (s) {
                const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                activeEditTarget.innerHTML = handleHTML + `
                    <div class="content-box">
                        <p class="sub-txt">${s}</p>
                        <p class="time-txt">${t}</p>
                        <p class="room-txt">${r}</p>
                    </div>`;
            }
        }
        saveToLocal();
        editModal.style.display = 'none';
    };

    modalClear.onclick = () => {
        activeEditTarget.innerHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        saveToLocal();
        editModal.style.display = 'none';
    };

    modalStar.onclick = () => {
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        if (activeEditTarget.innerHTML.includes('★')) {
            activeEditTarget.innerHTML = handleHTML;
        } else {
            activeEditTarget.innerHTML = handleHTML + '<span class="star-icon">★</span>';
        }
        saveToLocal();
        editModal.style.display = 'none';
    };

    /**
     * 3. INITIALIZE GRID & DRAG-AND-DROP
     */
    function initGrid() {
        grid.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => cell.remove());

        let debugBox = document.getElementById('mobile-debug-status');
        if (!debugBox) {
            debugBox = document.createElement('div');
            debugBox.id = 'mobile-debug-status';
            debugBox.style = "position:fixed; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:#00f3ff; padding:5px 15px; border-radius:20px; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00f3ff;";
            document.body.appendChild(debugBox);
        }

        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell-${i}`;
            cell.draggable = true;

            const handle = document.createElement('div');
            handle.className = 'drag-handle';
            for (let d = 0; d < 6; d++) handle.appendChild(document.createElement('span'));
            cell.appendChild(handle);

            cell.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', i);
                cell.classList.add('dragging');
                debugBox.innerText = `START: Dragging Cell ${i}`;
            });

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                const touch = e.touches ? e.touches[0] : e;
                const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell');

                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));

                if (target && !target.classList.contains('day-label')) {
                    target.classList.add('drag-over');
                    if (debugBox) debugBox.innerText = `HOVERING: ${target.id}`;
                }
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggingElem = document.querySelector('.dragging');
                const sourceIndex = draggingElem ? draggingElem.id.replace('cell-', '') : null;

                const touch = e.changedTouches ? e.changedTouches[0] : e;
                const targetCell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell');

                if (sourceIndex !== null && targetCell && targetCell.id !== `cell-${sourceIndex}` && !targetCell.classList.contains('day-label')) {
                    debugBox.innerText = `SUCCESS: Swapped ${sourceIndex} with ${targetCell.id}`;
                    const sourceCell = document.getElementById(`cell-${sourceIndex}`);

                    const targetContent = targetCell.querySelector('.content-box')?.outerHTML || targetCell.querySelector('.star-icon')?.outerHTML || '';
                    const sourceContent = sourceCell.querySelector('.content-box')?.outerHTML || sourceCell.querySelector('.star-icon')?.outerHTML || '';

                    const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                    targetCell.innerHTML = handleHTML + sourceContent;
                    sourceCell.innerHTML = handleHTML + targetContent;
                    saveToLocal();
                } else {
                    debugBox.innerText = `DROP FAILED: Invalid target`;
                }

                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over', 'dragging'));
            });

            cell.addEventListener('dragend', () => {
                cell.classList.remove('dragging');
                setTimeout(() => { debugBox.innerText = "WAITING FOR DRAG..."; }, 2000);
            });

            cell.addEventListener('click', (e) => {
                if (!e.target.classList.contains('drag-handle')) openModal(cell, 'cell');
            });

            grid.appendChild(cell);
        }
    }

    [yearStartLabel, yearEndLabel, termLabel].forEach(label => {
        label.addEventListener('click', () => openModal(label, 'header'));
    });

    /**
     * 4. SIDEBAR LOGIC (Live Updates)
     */
    const updateHeader = () => {
        yearStartLabel.innerText = yearStartInput.value || "2025";
        yearEndLabel.innerText = yearEndInput.value || "2026";
        termLabel.innerText = termInput.value || "TERM 1";
        saveToLocal();
    };

    yearStartInput.oninput = updateHeader;
    yearEndInput.oninput = updateHeader;
    termInput.oninput = updateHeader;

    addBtn.onclick = () => {
        const sub = subInput.value.trim();
        const time = timeInput.value.trim();
        const room = roomInput.value.trim();
        const day = parseInt(dayInput.value);
        const row = parseInt(rowInput.value) - 1;

        if (isNaN(row) || row < 0 || row > 4 || !sub) {
            alert("Please provide a Subject and a valid Row (1-5).");
            return;
        }

        const cellIndex = (row * 5) + day;
        const targetCell = document.getElementById(`cell-${cellIndex}`);
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        targetCell.innerHTML = handleHTML + `
            <div class="content-box">
                <p class="sub-txt">${sub.toUpperCase()}</p>
                <p class="time-txt">${time}</p>
                <p class="room-txt">${room.toUpperCase()}</p>
            </div>`;
        saveToLocal();
        clearInputs();
    };

    /**
     * 5. PERSISTENCE & EXPORT
     */
    function saveToLocal() {
        const scheduleData = [];
        document.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => scheduleData.push(cell.innerHTML));
        const headerData = {
            start: yearStartInput.value,
            end: yearEndInput.value,
            term: termInput.value,
            theme: wpContainer.className
        };
        localStorage.setItem('lab_schedule', JSON.stringify(scheduleData));
        localStorage.setItem('lab_header', JSON.stringify(headerData));
    }

    function loadFromLocal() {
        const savedSchedule = localStorage.getItem('lab_schedule');
        const savedHeader = localStorage.getItem('lab_header');

        if (savedSchedule) {
            const data = JSON.parse(savedSchedule);
            const cells = document.querySelectorAll('.grid-cell:not(.day-label)');
            data.forEach((content, i) => { if (cells[i]) cells[i].innerHTML = content; });
        }
        if (savedHeader) {
            const h = JSON.parse(savedHeader);
            yearStartInput.value = h.start || "";
            yearEndInput.value = h.end || "";
            termInput.value = h.term || "";
            wpContainer.className = h.theme || "theme-classic";
            updateHeader();
        }
    }

    downloadBtn.onclick = () => {
        wpContainer.classList.add('is-exporting');

        html2canvas(wpContainer, {
            scale: 3,
            useCORS: true,
            logging: false
        }).then(canvas => {
            wpContainer.classList.remove('is-exporting');

            const link = document.createElement('a');
            link.download = `my-schedule-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    };

    clearBtn.onclick = () => {
        if (confirm("Clear entire schedule?")) {
            const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
            document.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => cell.innerHTML = handleHTML);
            saveToLocal();
        }
    };

    function autoScale() {
        const preview = document.querySelector('.preview-area');
        if (!wrap || !preview) return;
        const scale = Math.min(preview.offsetWidth / 400, preview.offsetHeight / 920);
        wrap.style.transform = `scale(${scale * 0.95})`;
    }

    function clearInputs() {
        subInput.value = '';
        timeInput.value = '';
        roomInput.value = '';
    }

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = function () {
            wpContainer.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
            wpContainer.classList.add(`theme-${this.classList[1]}`);
            saveToLocal();
        };
    });

    window.onresize = autoScale;
    initGrid();
    loadFromLocal();
    autoScale();
});
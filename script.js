document.addEventListener('DOMContentLoaded', () => {

    // Unlocks vibration and audio context on the first touch
    document.body.addEventListener('touchstart', function unlockHaptics() {
        try {
            if (navigator.vibrate) navigator.vibrate(0);
        } catch (e) { }
    }, { once: true });

    /** * 1. MOBILE DRAG-DROP INITIALIZATION */
    if (typeof MobileDragDrop !== 'undefined') {
        MobileDragDrop.polyfill({
            holdToDrag: 500,
            dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
        });

        // CRITICAL: Prevents background scrolling while dragging on mobile devices
        window.addEventListener('touchmove', function (e) {
            if (document.querySelector('.dragging')) {
                if (e.cancelable) e.preventDefault();
            }
        }, { passive: false });
    }

    // Standard DOM Selectors
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

    // Wallpaper Label Selectors
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

    // --- GLOBAL STATE MANAGEMENT VARIABLES ---
    let activeEditTarget = null;
    let selectedCellForMove = null;
    let isDuplicating = false;
    let lastHoveredCell = null;

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
                <div id="modal-extra-actions" style="display: flex; gap: 10px; margin-top: 15px;"></div>
            `;

            modalClear.style.display = 'block';
            const hasSubject = target.querySelector('.content-box');
            const hasStar = target.querySelector('.star-icon');

            modalStar.style.display = (!hasSubject) ? 'block' : 'none';

            if (hasSubject || hasStar) {
                const actionContainer = document.getElementById('modal-extra-actions');

                // Move Button: Swaps the source and target
                const moveBtn = document.createElement('button');
                moveBtn.className = 'btn-action-cyan';
                moveBtn.innerText = 'Move';
                moveBtn.onclick = () => {
                    selectedCellForMove = target;
                    isDuplicating = false;
                    target.classList.add('mobile-pulse');
                    editModal.style.display = 'none';
                    safeVibrate(40);
                };

                // Copy Button: Leaves source intact and copies to target
                const dupBtn = document.createElement('button');
                dupBtn.className = 'btn-action-cyan';
                dupBtn.innerText = 'Copy';
                dupBtn.onclick = () => {
                    selectedCellForMove = target;
                    isDuplicating = true;
                    target.classList.add('mobile-pulse');
                    editModal.style.display = 'none';
                    safeVibrate(40);
                };

                // Delete Button: Immediately clears this specific cell
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-action-red';
                deleteBtn.innerText = 'Delete';
                deleteBtn.onclick = () => {
                    target.innerHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                    saveToLocal();
                    editModal.style.display = 'none';
                    safeVibrate([50, 50]);
                };

                actionContainer.appendChild(moveBtn);
                actionContainer.appendChild(dupBtn);
                actionContainer.appendChild(deleteBtn);
            }
        }
    };

    function safeVibrate(pattern) {
        try {
            if (navigator.vibrate) navigator.vibrate(pattern);
        } catch (e) {
            // Just ignore the error so it doesn't show up in red
        }
    }

    /**
     * Helper: Handles the physical swap of two cells
     */
    function swapCells(cellA, cellB) {
        const contentA = cellA.querySelector('.content-box')?.outerHTML || cellA.querySelector('.star-icon')?.outerHTML || '';
        const contentB = cellB.querySelector('.content-box')?.outerHTML || cellB.querySelector('.star-icon')?.outerHTML || '';
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        cellA.innerHTML = handleHTML + contentB;
        cellB.innerHTML = handleHTML + contentA;
        saveToLocal();
    }

    /**
     * 3. INITIALIZE GRID & DRAG-AND-DROP LOGIC
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

            // DRAG EVENTS
            cell.addEventListener('dragstart', (e) => {
                safeVibrate(50);
                e.dataTransfer.setData('text/plain', i);
                cell.classList.add('dragging');
                lastHoveredCell = null;
                if (debugBox) debugBox.innerText = `START: Dragging Cell ${i}`;
            });

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                const touch = e.touches ? e.touches[0] : e;
                const draggingElem = document.querySelector('.dragging');

                // CRITICAL FIX: Hide the dragged element temporarily so elementFromPoint sees the cell underneath
                if (draggingElem) draggingElem.style.pointerEvents = 'none';
                const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell');
                if (draggingElem) draggingElem.style.pointerEvents = 'all';

                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
                if (target && !target.classList.contains('day-label')) {
                    target.classList.add('drag-over');
                    lastHoveredCell = target; // Sticky memory for the drop location
                }
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggingElem = document.querySelector('.dragging');
                if (!draggingElem) return;

                const touch = e.changedTouches ? e.changedTouches[0] : e;
                draggingElem.style.pointerEvents = 'none';
                let targetCell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell') || lastHoveredCell;
                draggingElem.style.pointerEvents = 'all';

                if (targetCell && targetCell !== draggingElem && !targetCell.classList.contains('day-label')) {
                    swapCells(draggingElem, targetCell);
                }
                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over', 'dragging'));
            });

            cell.addEventListener('dragend', () => {
                cell.classList.remove('dragging', 'mobile-pulse');
                cell.style.pointerEvents = 'all';
            });

            // CLICK & TAP-TO-MOVE LOGIC
            cell.addEventListener('click', (e) => {
                if (selectedCellForMove) {
                    if (selectedCellForMove === cell) {
                        cell.classList.remove('mobile-pulse');
                        selectedCellForMove = null;
                    } else {
                        if (isDuplicating) {
                            const sourceContent = selectedCellForMove.querySelector('.content-box')?.outerHTML ||
                                selectedCellForMove.querySelector('.star-icon')?.outerHTML || '';
                            const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                            cell.innerHTML = handleHTML + sourceContent;
                        } else {
                            swapCells(selectedCellForMove, cell);
                        }
                        saveToLocal();
                        selectedCellForMove.classList.remove('mobile-pulse');
                        selectedCellForMove = null;
                        safeVibrate(30);
                    }
                    return;
                }
                // Only open modal if we didn't click the drag handle
                if (!e.target.classList.contains('drag-handle')) openModal(cell, 'cell');
            });

            grid.appendChild(cell);
        }
    }

    /**
     * 4. UI HANDLERS & DATA PERSISTENCE
     */
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
        activeEditTarget.innerHTML = activeEditTarget.innerHTML.includes('★') ? handleHTML : handleHTML + '<span class="star-icon">★</span>';
        saveToLocal();
        editModal.style.display = 'none';
    };

    const updateHeader = () => {
        // Target the spans specifically to preserve the Flexbox structure
        const startSpan = yearStartLabel.querySelector('span');
        const endSpan = yearEndLabel.querySelector('span');
        const termSpan = termLabel.querySelector('span');

        if (startSpan) startSpan.innerText = yearStartInput.value || "2025";
        if (endSpan) endSpan.innerText = yearEndInput.value || "2026";
        if (termSpan) termSpan.innerText = (termInput.value || "TERM 1").toUpperCase();

        saveToLocal();
    };

    yearStartInput.oninput = updateHeader;
    yearEndInput.oninput = updateHeader;
    termInput.oninput = updateHeader;

    addBtn.onclick = () => {
        const sub = subInput.value.trim();
        const row = parseInt(rowInput.value) - 1;
        if (isNaN(row) || row < 0 || row > 4 || !sub) {
            alert("Please provide a Subject and a valid Row (1-5).");
            return;
        }
        const cellIndex = (row * 5) + parseInt(dayInput.value);
        const targetCell = document.getElementById(`cell-${cellIndex}`);
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        targetCell.innerHTML = handleHTML + `<div class="content-box"><p class="sub-txt">${sub.toUpperCase()}</p><p class="time-txt">${timeInput.value}</p><p class="room-txt">${roomInput.value.toUpperCase()}</p></div>`;
        saveToLocal();
        subInput.value = ''; timeInput.value = ''; roomInput.value = '';
    };

    function saveToLocal() {
        const scheduleData = [];
        document.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => scheduleData.push(cell.innerHTML));
        localStorage.setItem('lab_schedule', JSON.stringify(scheduleData));
        localStorage.setItem('lab_header', JSON.stringify({
            start: yearStartInput.value, end: yearEndInput.value, term: termInput.value, theme: wpContainer.className
        }));
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
            yearStartInput.value = h.start || ""; yearEndInput.value = h.end || ""; termInput.value = h.term || "";
            wpContainer.className = h.theme || "theme-classic";
            updateHeader();
        }
    }

    // Update this section in your script.js
    downloadBtn.onclick = () => {
        wpContainer.classList.add('is-exporting');

        setTimeout(() => {
            html2canvas(wpContainer, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: null, // Transparent to let CSS backgrounds shine
                scrollX: 0,
                scrollY: 0,
                width: 360,  // Match the container's fixed width
                height: 740, // Match the container's fixed height
            }).then(canvas => {
                wpContainer.classList.remove('is-exporting');
                const link = document.createElement('a');
                link.download = `MySchedule-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            });
        }, 800);
    };
    
    clearBtn.onclick = () => {
        if (confirm("Clear entire schedule?")) {
            document.querySelectorAll('.grid-cell:not(.day-label)').forEach(cell => {
                cell.innerHTML = `<div class=\"drag-handle\"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
            });
            saveToLocal();
        }
    };

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = function () {
            // Remove all possible theme classes first
            wpContainer.classList.remove('theme-classic', 'theme-dark', 'theme-neon');

            // Find which theme class was clicked (classic, dark, or neon)
            const selectedTheme = this.classList.contains('classic') ? 'classic' :
                this.classList.contains('dark') ? 'dark' : 'neon';

            wpContainer.classList.add(`theme-${selectedTheme}`);
            saveToLocal();
        };
    });

    function autoScale() {
        const preview = document.querySelector('.preview-area');
        if (!wrap || !preview) return;
        const scale = Math.min(preview.offsetWidth / 400, preview.offsetHeight / 920);
        wrap.style.transform = `scale(${scale * 0.95})`;
    }

    window.onresize = autoScale;
    [yearStartLabel, yearEndLabel, termLabel].forEach(label => label.addEventListener('click', () => openModal(label, 'header')));

    initGrid();
    loadFromLocal();
    autoScale();
});
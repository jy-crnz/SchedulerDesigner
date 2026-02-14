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

    function generateAcronym(text) {
        if (!text) return "";

        // Split into words and only keep words starting with Uppercase (skips "in", "the", etc.)
        const words = text.split(/\s+/).filter(word => {
            const first = word.charAt(0);
            // Keep Uppercase OR Numbers (for results like IPE4)
            return (first >= 'A' && first <= 'Z') || (first >= '0' && first <= '9');
        });

        // If there is only one word (like "Business"), use the first 2 letters (e.g., "BI")
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }

        // Join the first letters of all valid words
        return words.map(word => word.charAt(0)).join("").toUpperCase();
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

    // Add this inside your DOMContentLoaded listener
    const aiUpload = document.getElementById('aiUpload');
    const scanBtn = document.getElementById('scanBtn');

    scanBtn.onclick = () => aiUpload.click();

    // --- GLOBAL STATE MANAGEMENT VARIABLES ---
    let activeEditTarget = null;
    let selectedCellForMove = null;
    let isDuplicating = false;
    let lastHoveredCell = null;
    let currentCols = 5; // Default to 5 (Mon-Fri)
    let activeDaysStore = null; // Stores the current visible day indexes

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
    function initGrid(numCols = 5, activeDays = null) {
        // 1. If no specific days are provided (startup), show all days up to numCols
        if (!activeDays) {
            activeDays = Array.from({ length: numCols }, (_, i) => i);
        }

        // 2. Update global state and CSS variable based on the trimmed count
        currentCols = activeDays.length;
        grid.style.setProperty('--cols', currentCols);

        // 3. Clear the entire grid
        grid.innerHTML = '';

        const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        // 4. Re-create ONLY the active Day Headers
        activeDays.forEach(dayIdx => {
            const header = document.createElement('div');
            header.className = 'grid-cell day-label';
            header.innerText = dayNames[dayIdx];
            grid.appendChild(header);
        });

        // 5. Create Data Cells for active days
        const totalCells = 5 * currentCols;

        // Standard Debug Box check
        let debugBox = document.getElementById('mobile-debug-status');
        if (!debugBox) {
            debugBox = document.createElement('div');
            debugBox.id = 'mobile-debug-status';
            debugBox.style = "position:fixed; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:#00f3ff; padding:5px 15px; border-radius:20px; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00f3ff;";
            document.body.appendChild(debugBox);
        }

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell-${i}`; // ID is relative to the current visible grid
            cell.draggable = true;

            const handle = document.createElement('div');
            handle.className = 'drag-handle';
            for (let d = 0; d < 6; d++) handle.appendChild(document.createElement('span'));
            cell.appendChild(handle);

            // --- DRAG EVENTS ---
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
                if (draggingElem) draggingElem.style.pointerEvents = 'none';
                const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell');
                if (draggingElem) draggingElem.style.pointerEvents = 'all';

                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
                if (target && !target.classList.contains('day-label')) {
                    target.classList.add('drag-over');
                    lastHoveredCell = target;
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

            // --- CLICK & TAP-TO-MOVE LOGIC ---
            cell.addEventListener('click', (e) => {
                if (selectedCellForMove) {
                    if (selectedCellForMove === cell) {
                        cell.classList.remove('mobile-pulse');
                        selectedCellForMove = null;
                    } else {
                        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
                        if (isDuplicating) {
                            const sourceContent = selectedCellForMove.querySelector('.content-box')?.outerHTML ||
                                selectedCellForMove.querySelector('.star-icon')?.outerHTML || '';
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
                if (!e.target.classList.contains('drag-handle')) openModal(cell, 'cell');
            });

            grid.appendChild(cell);
        }

        if (typeof fillVacantStars === 'function') fillVacantStars();
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

        fillVacantStars(); // Add this
        saveToLocal();
        editModal.style.display = 'none';
    };

    modalClear.onclick = () => {
        activeEditTarget.innerHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        fillVacantStars(); // Add this
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
        const row = parseInt(rowInput.value) - 1; // Converts 1-5 input to 0-4 index
        const day = parseInt(dayInput.value);     // Mon=0, Tue=1, etc.

        // Basic validation
        if (isNaN(row) || row < 0 || row > 4 || isNaN(day) || !sub) {
            alert("Please provide a Subject, valid Day, and Row (1-5).");
            return;
        }

        // --- STEP 1: DETECT IF DAY IS HIDDEN OR NEEDS EXPANSION ---

        // Check if the day exists in our current visible grid
        let colIndex = activeDaysStore ? activeDaysStore.indexOf(day) : day;

        // A. If the day is hidden because of Auto-Trim
        if (activeDaysStore && colIndex === -1) {
            if (confirm("This day is currently hidden. Reveal all days to add this class?")) {
                activeDaysStore = null; // Reset the trim
                initGrid(day > 4 ? 7 : 5); // Rebuild full grid
                colIndex = day; // Use standard index now that it's full
            } else {
                return;
            }
        }
        // B. If adding a weekend to a standard 5-day grid
        else if (!activeDaysStore && day > 4 && currentCols === 5) {
            if (confirm("This is a weekend day. Expand your grid to 7 days?")) {
                activeDaysStore = null;
                initGrid(7);
                colIndex = day;
            } else {
                return;
            }
        }

        // --- STEP 2: DYNAMIC MATH FOR TRIMMED GRID ---
        // Formula: (Row * Number of Visible Columns) + Relative Column Position
        const cellIndex = (row * currentCols) + colIndex;
        const targetCell = document.getElementById(`cell-${cellIndex}`);

        if (targetCell) {
            const shortSubject = generateAcronym(sub);
            const displayTime = timeInput.value.replace(/AM|PM/gi, "");
            const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;

            targetCell.innerHTML = handleHTML + `
        <div class="content-box">
            <p class="sub-txt">${shortSubject}</p>
            <p class="time-txt">${displayTime}</p>
            <p class="room-txt">${roomInput.value.toUpperCase() || "TBA"}</p>
        </div>`;

            if (typeof fillVacantStars === 'function') fillVacantStars();
            saveToLocal(); // Save current state, column count, and activeDaysStore

            // Clear sidebar inputs
            subInput.value = '';
            timeInput.value = '';
            roomInput.value = '';

            safeVibrate(30); // Success feedback
        }
    };


    function fillVacantStars() {
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        const cells = document.querySelectorAll('.grid-cell:not(.day-label)');

        cells.forEach(cell => {
            // If the cell doesn't have a subject box, give it a star
            if (!cell.querySelector('.content-box')) {
                cell.innerHTML = handleHTML + `<span class="star-icon">★</span>`;
            }
        });
    }

    function saveToLocal() {
        const scheduleData = {};

        // 1. Map content to its ABSOLUTE ID (e.g., "cell-r0-d1")
        // This prevents Tuesday classes from shifting to Monday when trimming
        document.querySelectorAll('.grid-cell[id^="cell-"]').forEach(cell => {
            scheduleData[cell.id] = cell.innerHTML;
        });

        // 2. Use a NEW storage key to avoid conflicts with old array data
        localStorage.setItem('lab_schedule_final', JSON.stringify(scheduleData));

        // 3. Save layout and header metadata
        localStorage.setItem('lab_header', JSON.stringify({
            start: yearStartInput.value,
            end: yearEndInput.value,
            term: termInput.value,
            theme: wpContainer.className,
            cols: currentCols,
            activeDays: activeDaysStore // Remembers your trimmed view
        }));
    }

    function loadFromLocal() {
        const savedHeader = localStorage.getItem('lab_header');
        // Using the new final key to avoid conflicts with old array-based data
        const savedSchedule = localStorage.getItem('lab_schedule_final');
        const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;

        // 1. REBUILD THE GRID STRUCTURE FIRST
        if (savedHeader) {
            const h = JSON.parse(savedHeader);

            // Restore the global activeDaysStore from memory
            activeDaysStore = h.activeDays || null;

            // Build the grid with correct columns and trimmed state
            initGrid(h.cols || 5, activeDaysStore);

            // Update Input fields
            yearStartInput.value = h.start || "";
            yearEndInput.value = h.end || "";
            termInput.value = h.term || "";
            wpContainer.className = h.theme || "theme-classic";

            // CRITICAL: Update labels without triggering a "Save" race condition
            updateHeaderLabelsOnly();
        } else {
            // Default to standard 5-day grid for new users
            initGrid(5);
        }

        // 2. FILL CELLS USING ABSOLUTE IDs
        if (savedSchedule) {
            const data = JSON.parse(savedSchedule); // This is now an Object { "cell-id": "HTML" }

            // Iterate through the saved IDs and find their matching boxes
            Object.keys(data).forEach(id => {
                const cell = document.getElementById(id);
                if (cell) {
                    const content = data[id];
                    // Ensure drag handle is present
                    if (!content || content.trim() === "" || content === handleHTML) {
                        cell.innerHTML = handleHTML;
                    } else {
                        cell.innerHTML = content;
                    }
                }
            });
        }

        if (typeof fillVacantStars === 'function') fillVacantStars();
    }

    /**
     * Helper to update the wallpaper text without triggering saveToLocal()
     * This prevents the grid from being overwritten with an empty state on refresh
     */
    function updateHeaderLabelsOnly() {
        const startSpan = yearStartLabel.querySelector('span');
        const endSpan = yearEndLabel.querySelector('span');
        const termSpan = termLabel.querySelector('span');

        if (startSpan) startSpan.innerText = yearStartInput.value || "2025";
        if (endSpan) endSpan.innerText = yearEndInput.value || "2026";
        if (termSpan) termSpan.innerText = (termInput.value || "TERM 1").toUpperCase();
    }

    downloadBtn.onclick = () => {
        wpContainer.classList.add('is-exporting');

        // Small delay to ensure CSS classes and opacity overrides are fully applied
        setTimeout(() => {
            html2canvas(wpContainer, {
                scale: 3,            // High resolution for sharp text
                useCORS: true,
                logging: false,
                backgroundColor: null,
                letterRendering: true, // Forces individual character positioning to prevent overlap
                textShadow: false,
                onclone: (clonedDoc) => {
                    const clonedContainer = clonedDoc.getElementById('wallpaper-container');

                    // 1. Reset layout for capture
                    clonedContainer.style.transform = "none";
                    clonedContainer.style.margin = "0 auto";
                    clonedContainer.style.transition = "none"; // Stop transitions from blurring the capture

                    // 2. Fix number spacing: tabular-nums prevents numbers from touching the colon
                    clonedContainer.style.fontVariantNumeric = "tabular-nums";

                    // 3. Clean up UI "noise": Remove active animations or drag handles from the export
                    clonedDoc.querySelectorAll('.grid-cell').forEach(c => {
                        c.classList.remove('dragging', 'mobile-pulse', 'cell-success');
                    });
                }
            }).then(canvas => {
                wpContainer.classList.remove('is-exporting');
                const link = document.createElement('a');
                link.download = `Schedule-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            });
        }, 150);
    };

    aiUpload.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const scanBtn = document.getElementById('scanBtn');
        const scanText = document.getElementById('scanText');
        const scanSpinner = document.getElementById('scanSpinner');

        // 1. Start UI Loading State
        scanText.innerText = "Scanning...";
        scanSpinner.style.display = "block";
        scanBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('scheduleImage', file);

            const response = await fetch('https://schedulerdesigner.onrender.com/api/scan-schedule', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Server error");
            }

            const data = await response.json();
            const scheduleArray = data.schedule;

            // --- STEP 1: IDENTIFY ACTIVE DAYS ---
            const dayMap = { "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6 };

            // Unique indexes of days that have classes
            const activeDays = [...new Set(scheduleArray.map(item =>
                dayMap[item.day.trim().toLowerCase()]
            ))].sort((a, b) => a - b);

            // Update the global store for persistence
            activeDaysStore = activeDays;

            // --- STEP 2: REBUILD TRIMMED GRID ---
            initGrid(data.numCols, activeDays);

            // --- STEP 3: POPULATE TRIMMED GRID ---
            scheduleArray.forEach((item, index) => {
                const targetDayIndex = dayMap[item.day.trim().toLowerCase()];
                const trimmedDayPos = activeDays.indexOf(targetDayIndex);

                // Re-calculate the cell ID based on trimmed grid width
                const rowIndex = Math.floor(item.cellIndex / data.numCols);
                const newCellIndex = (rowIndex * activeDays.length) + trimmedDayPos;

                const cell = document.getElementById(`cell-${newCellIndex}`);
                if (cell && item.subject) {
                    const shortSubject = generateAcronym(item.subject);
                    const displayTime = item.time.replace(/AM|PM/gi, "");
                    const handleHTML = `<div class="drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;

                    cell.innerHTML = handleHTML + `
                    <div class="content-box">
                        <p class="sub-txt">${shortSubject}</p> 
                        <p class="time-txt">${displayTime}</p>
                        <p class="room-txt">${item.room.toUpperCase() || "TBA"}</p>
                    </div>`;

                    // Success Animation
                    setTimeout(() => {
                        cell.classList.add('cell-success');
                        setTimeout(() => cell.classList.remove('cell-success'), 600);
                    }, index * 50);
                }
            });

            if (typeof fillVacantStars === 'function') fillVacantStars();

            // Finalize state
            saveToLocal();

            if (navigator.vibrate) navigator.vibrate(50);
            alert(`Layout Optimized! Displaying ${activeDays.length} active days.`);

        } catch (err) {
            console.error("Scan Error:", err);
            alert("Scan failed: " + err.message);
        } finally {
            // Reset UI State
            scanText.innerText = "✨ Scan Schedule Image";
            scanSpinner.style.display = "none";
            scanBtn.disabled = false;
            aiUpload.value = "";
        }
    };
    
    clearBtn.onclick = () => {
        if (confirm("Reset everything and start over?")) {
            // 1. Wipe the new storage key
            localStorage.removeItem('lab_schedule_final');

            // 2. Reset the layout state
            activeDaysStore = null;

            // 3. Return to standard 5-day view
            initGrid(5);

            // 4. Save the now-empty state
            saveToLocal();

            safeVibrate([50, 100]);
            alert("Schedule cleared!");
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

    loadFromLocal();
    autoScale();
});
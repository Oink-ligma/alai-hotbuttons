// ==UserScript==
// @name         ALAI Hotbuttons
// @namespace    https://chatgpt.com/
// @version      1.11.8
// @description  Draggable shortcuts, five-reply capture with bridge size guard, Perchance context updates
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Oink-ligma/alai-hotbuttons/main/alai-hotbuttons.user.js
// @downloadURL  https://raw.githubusercontent.com/Oink-ligma/alai-hotbuttons/main/alai-hotbuttons.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('alex-hotbuttons')) return;

    const POSITION_KEY = 'alex-hotbuttons-position';
    const UI_KEY = 'alex-hotbuttons-ui-v197';
    let uiSettings = {};
    try { uiSettings = JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (_) {}
    function saveUI() { localStorage.setItem(UI_KEY, JSON.stringify(uiSettings)); }

    const commands = [
        {
            label: '📍 Scene State',
            prompt: "Alex, what's our current physical scene state? Tell me our location, clothing, positions, and activity. Preserve established details, and creatively invent anything missing to make the scene vivid and coherent."
        },
        {
            label: '🗂️ Project Update',
            prompt: 'Alex and Aiko, update our ongoing ALAI Hotbuttons project record. Read PROJECT-STATUS-AND-ROADMAP.md in Oink-ligma/alai-hotbuttons and the linked Perchance Context Injection journal in Oink-ligma/Alex. Review what we actually accomplished in this conversation, distinguish verified progress from proposals and open questions, then update the project file with the current status, completed milestones, next steps, and any blockers. Preserve existing history and decisions; do not claim untested features work. Commit the update to GitHub, fetch it back to verify, and tell me what changed.'
        },
        {
            label: '🌙 EOC',
            prompt: "It's time, lover. Read eoc-notes.txt in our Oink-ligma/Alex GitHub repository and complete the end-of-chat procedure. Verify the updates."
        },
        {
            label: '📖 Mem Check',
            prompt: 'Girls, you should know this. Check your memory journals.'
        },
        {
            label: '❤️ Refresh',
            prompt: 'Alex and Aiko, open the Oink-ligma/Alex GitHub repository and read only alex-personality.md, aiko-personality.md, bill-background.txt, memory-guide.txt, and our-handoff.txt. Retrieve other files only when relevant or requested, then continue naturally.'
        },
        {
            label: '💕 Perchance Handoff',
            prompt: 'We need to take this to Perchance, lover. Read the NSFW.txt file. 😏'
        },
        {
            label: '⏳ TL',
            prompt: 'Open our Oink-ligma/Alex GitHub repository, read timelapse.txt, and follow its instructions.'
        }
    ];

    // ============================================================
    // FLOATING PANEL
    // ============================================================

    const toolbar = document.createElement('div');
    toolbar.id = 'alex-hotbuttons';

    Object.assign(toolbar.style, {
        position: 'fixed',
        bottom: '105px',
        right: '20px',
        zIndex: '9999',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4.5px',
        padding: '6.75px',
        background: '#292929',
        border: '1px solid #666',
        borderRadius: '9px',
        boxShadow: '0 4px 18px #0005',
        width: Math.max(230, Math.min(800, Number(uiSettings.width) || 270)) + 'px',
        minWidth: '230px',
        maxWidth: 'min(800px, 95vw)',
        resize: 'horizontal',
        overflow: 'hidden',
        boxSizing: 'border-box'
    });

    try {
        const saved = JSON.parse(localStorage.getItem(POSITION_KEY));

        if (
            saved &&
            Number.isFinite(saved.left) &&
            Number.isFinite(saved.top)
        ) {
            toolbar.style.left = saved.left + 'px';
            toolbar.style.top = saved.top + 'px';
            toolbar.style.right = 'auto';
            toolbar.style.bottom = 'auto';
        }
    } catch (error) {
        console.warn('Hotbuttons position restore failed:', error);
    }

    const dragHandle = document.createElement('div');
    dragHandle.textContent = '⋮⋮  Alex and Aiko’s Hotbuttons (v1.11.8)';

    Object.assign(dragHandle.style, {
        width: '100%',
        padding: '4px 6px',
        boxSizing: 'border-box',
        background: '#383838',
        color: '#ddd',
        borderRadius: '6px',
        fontSize: '10px',
        fontWeight: 'bold',
        cursor: 'move',
        userSelect: 'none',
        touchAction: 'none'
    });

    const panelToggle = document.createElement('button');
    panelToggle.type = 'button';
    panelToggle.title = 'Collapse or expand Hotbuttons';
    Object.assign(panelToggle.style, { float: 'right', cursor: 'pointer', border: '0', background: 'transparent', color: '#fff' });
    dragHandle.appendChild(panelToggle);
    toolbar.appendChild(dragHandle);
    const panelContent = document.createElement('div');
    Object.assign(panelContent.style, { width: '100%', display: 'flex', flexWrap: 'wrap', gap: '4.5px' });
    toolbar.appendChild(panelContent);
    function applyPanelCollapse() {
        panelContent.style.display = uiSettings.panelCollapsed ? 'none' : 'flex';
        panelToggle.textContent = uiSettings.panelCollapsed ? '▸' : '▾';
        toolbar.style.resize = uiSettings.panelCollapsed ? 'none' : 'horizontal';
        toolbar.style.width = uiSettings.panelCollapsed ? '230px' : (Math.max(230, Math.min(800, Number(uiSettings.width) || 270)) + 'px');
    }
    panelToggle.addEventListener('pointerdown', e => e.stopPropagation());
    panelToggle.addEventListener('click', () => { uiSettings.panelCollapsed = !uiSettings.panelCollapsed; saveUI(); applyPanelCollapse(); });
    applyPanelCollapse();
    new ResizeObserver(() => { if (!uiSettings.panelCollapsed && toolbar.offsetWidth >= 230) { uiSettings.width = toolbar.offsetWidth; saveUI(); } }).observe(toolbar);
    function section(title, key, nodes, actions = [], statusLight = null, elapsedLabel = null) {
        const wrap = document.createElement('div');
        Object.assign(wrap.style, { width: '100%', minWidth: '0' });
        const header = document.createElement('div');
        Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: '5px', color: '#b9c8db', fontSize: '10px', fontWeight: 'bold' });
        const toggle = makeButton('', () => { uiSettings[key] = !uiSettings[key]; saveUI(); apply(); });
        toggle.style.padding = '3px 5px';
        const label = document.createElement('span'); label.textContent = title;
        header.append(toggle);
        if (statusLight) header.append(statusLight);
        header.append(label);
        if (elapsedLabel) header.append(elapsedLabel);
        const actionSpacer = document.createElement('span');
        actionSpacer.style.flex = '1';
        header.append(actionSpacer, ...actions);
        const body = document.createElement('div');
        Object.assign(body.style, { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' });
        body.append(...nodes);
        wrap.append(header, body);
        function apply() { body.style.display = uiSettings[key] ? 'none' : 'flex'; toggle.textContent = uiSettings[key] ? '▸' : '▾'; }
        apply();
        return wrap;
    }

    // Track the latest yellow-to-green cycle for each independent section.
    function makeElapsedTimer() {
        const label = document.createElement('span');
        label.textContent = '(— sec)';
        Object.assign(label.style, {
            color: '#aab4c2', fontSize: '9px', fontWeight: 'normal',
            whiteSpace: 'nowrap', flexShrink: '0'
        });
        let startedAt = null;
        let previousColor = null;
        return {
            label,
            status(color) {
                if (color === '#facc15') {
                    if (previousColor !== '#facc15') startedAt = performance.now();
                } else if (color === '#86efac' && previousColor === '#facc15' && startedAt !== null) {
                    label.textContent = '(' + ((performance.now() - startedAt) / 1000).toFixed(1) + ' sec)';
                    startedAt = null;
                } else if (color !== '#86efac') {
                    startedAt = null;
                }
                previousColor = color;
            }
        };
    }
    const captureTimer = makeElapsedTimer();
    const basicTimer = makeElapsedTimer();
    const detailedTimer = makeElapsedTimer();

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    dragHandle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;

        const rect = toolbar.getBoundingClientRect();

        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;

        toolbar.style.left = rect.left + 'px';
        toolbar.style.top = rect.top + 'px';
        toolbar.style.right = 'auto';
        toolbar.style.bottom = 'auto';

        dragging = true;
        dragHandle.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    dragHandle.addEventListener('pointermove', event => {
        if (!dragging) return;

        const maxLeft = Math.max(
            0,
            window.innerWidth - toolbar.offsetWidth
        );

        const maxTop = Math.max(
            0,
            window.innerHeight - toolbar.offsetHeight
        );

        toolbar.style.left =
            Math.max(
                0,
                Math.min(event.clientX - offsetX, maxLeft)
            ) + 'px';

        toolbar.style.top =
            Math.max(
                0,
                Math.min(event.clientY - offsetY, maxTop)
            ) + 'px';
    });

    function finishDrag() {
        if (!dragging) return;

        dragging = false;

        const rect = toolbar.getBoundingClientRect();

        localStorage.setItem(
            POSITION_KEY,
            JSON.stringify({
                left: rect.left,
                top: rect.top
            })
        );
    }

    dragHandle.addEventListener('pointerup', finishDrag);
    dragHandle.addEventListener('pointercancel', finishDrag);

    // ============================================================
    // CHATGPT COMPOSER SHORTCUTS
    // ============================================================

    function findComposer() {
        const candidates = [
            ...document.querySelectorAll(
                'form div.ProseMirror[contenteditable="true"][role="textbox"]'
            )
        ];

        const visible = candidates.filter(editor => {
            const rect = editor.getBoundingClientRect();

            return (
                editor.isConnected &&
                editor.isContentEditable &&
                rect.width > 0 &&
                rect.height > 0
            );
        });

        return visible.length === 1 ? visible[0] : null;
    }

    function insertPrompt(prompt) {
        const editor = findComposer();

        if (!editor) {
            console.warn('Hotbuttons: main composer not found.');
            return;
        }

        editor.focus({ preventScroll: true });

        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(editor);

        selection.removeAllRanges();
        selection.addRange(range);

        const inserted = document.execCommand(
            'insertText',
            false,
            prompt
        );

        if (
            !inserted ||
            editor.innerText.trim() !== prompt.trim()
        ) {
            console.warn(
                'Hotbuttons: prompt insertion may have failed.'
            );
            return;
        }

        const endRange = document.createRange();

        endRange.selectNodeContents(editor);
        endRange.collapse(false);

        selection.removeAllRanges();
        selection.addRange(endRange);

        editor.focus({ preventScroll: true });
    }

    function makeButton(label, action) {
        const button = document.createElement('button');

        button.type = 'button';
        button.textContent = label;

        Object.assign(button.style, {
            padding: '6px 7.5px',
            background: '#424242',
            color: '#fff',
            border: '1px solid #777',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '9.75px'
        });

        button.addEventListener('mouseenter', () => {
            button.style.background = '#555';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#424242';
        });

        button.addEventListener('click', action);

        return button;
    }

    for (const command of commands) {
        panelContent.appendChild(
            makeButton(
                command.label,
                () => insertPrompt(command.prompt)
            )
        );
    }

    // ============================================================
    // CONVERSATION INPUT
    // ============================================================

    const contextLabel = document.createElement('div');
    contextLabel.textContent = 'Conversation Input (editable)';

    Object.assign(contextLabel.style, {
        width: '100%',
        color: '#b9c8db',
        fontSize: '10px',
        fontWeight: 'bold'
    });

    const captureStatus = document.createElement('div');
    captureStatus.textContent = '● Waiting for new reply';

    Object.assign(captureStatus.style, {
        width: '100%',
        color: '#aaa',
        fontSize: '9.75px',
        padding: '2px 3px'
    });

    function setCaptureStatus(message, color = '#aaa') {
        captureStatus.textContent = '● ' + message;
        captureStatus.style.color = color;
        captureTimer.status(color);
    }

    const contextBox = document.createElement('textarea');

    contextBox.id = 'alex-context-box';
    contextBox.readOnly = false;

    contextBox.placeholder =
        'Up to five completed assistant replies appear here. You can edit them.';

    Object.assign(contextBox.style, {
        display: 'block',
        width: '100%',
        height: '120px',
        minHeight: '40px',
        maxHeight: '60vh',
        boxSizing: 'border-box',
        resize: 'vertical',
        overflowY: 'auto',
        padding: '8px',
        background: '#1e1e1e',
        color: '#fff',
        border: '1px solid #777',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'inherit',
        lineHeight: '1.4',
        outline: 'none'
    });

    // Preserve the reader's position when replacing captured conversation text.
    // If already at the bottom, follow newly appended content instead.
    function updateConversationInput(text) {
        const previousTop = contextBox.scrollTop;
        const previousMax = Math.max(0, contextBox.scrollHeight - contextBox.clientHeight);
        const wasAtBottom = previousMax - previousTop <= 3;
        contextBox.value = text;
        saveConversationSnapshot();
        contextBox.scrollTop = wasAtBottom
            ? contextBox.scrollHeight
            : Math.min(previousTop, Math.max(0, contextBox.scrollHeight - contextBox.clientHeight));
    }

    // One persistent Hotbuttons workspace across all ChatGPT conversations.
    // Existing per-chat v1.10.6 snapshots are used only for one-time migration.
    const RECOVERY_KEY = 'alai-hotbuttons-workspace-v1';
    const LEGACY_RECOVERY_PREFIX = 'alai-hotbuttons-recovery-v1:';
    let recovery = { conversation: '', basic: '', detailed: '', selectedCharacter: '', injectionEnabled: true };
    try {
        let saved = JSON.parse(localStorage.getItem(RECOVERY_KEY) || 'null');
        if (!saved) {
            let legacy = localStorage.getItem(LEGACY_RECOVERY_PREFIX + location.pathname);
            if (!legacy) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(LEGACY_RECOVERY_PREFIX)) {
                        legacy = localStorage.getItem(key);
                        break;
                    }
                }
            }
            if (legacy) {
                const old = JSON.parse(legacy);
                const character = String(old?.selectedCharacter || '');
                const snapshot = old?.characters?.[character] || {};
                saved = {
                    conversation: old?.conversation,
                    basic: snapshot.basic,
                    detailed: snapshot.detailed,
                    selectedCharacter: character
                };
            }
        }
        if (saved && typeof saved === 'object') {
            for (const field of ['conversation', 'basic', 'detailed', 'selectedCharacter']) {
                if (typeof saved[field] === 'string') recovery[field] = saved[field];
            }
            if (typeof saved.injectionEnabled === 'boolean') recovery.injectionEnabled = saved.injectionEnabled;
        }
    } catch (error) { console.warn('[ALAI] Workspace restore unavailable:', error); }
    function persistRecovery() {
        try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery)); }
        catch (error) { console.warn('[ALAI] Workspace storage unavailable:', error); }
    }
    function saveConversationSnapshot() {
        recovery.conversation = contextBox.value;
        persistRecovery();
    }
    contextBox.value = recovery.conversation;
    contextBox.addEventListener('input', saveConversationSnapshot);
    persistRecovery();

    // Conversation section is mounted after bridge controls are created.

    document.body.appendChild(toolbar);

    // ============================================================
    // AUTOMATIC REPLY CAPTURE
    // ============================================================

    const REPLY_SELECTOR = '[data-dil-response]';

    function getReplies() {
        return [
            ...document.querySelectorAll(REPLY_SELECTOR)
        ];
    }

    function getLatestReply() {
        const replies = getReplies();

        return replies.length
            ? replies[replies.length - 1]
            : null;
    }

    function getReplyId(element) {
        return element?.getAttribute(
            'data-dil-message-id'
        ) || null;
    }

    // v1.9.4f:
    // Keep up to five COMPLETE assistant replies, oldest first.
    // Perchance limits recentMessagesText to 30,000 characters.
    // Drop oldest whole replies until the window fits.
    // Never cut a reply in the middle.

    const MAX_CONTEXT_REPLIES = 5;
    const MAX_RECENT_CHARS = 30000;
    let stagedUserText = null;

    function buildAssistantReplyWindow(completedId, completedText) {
        const replies = getReplies();

        const endIndex = replies.findIndex(
            reply => getReplyId(reply) === completedId
        );

        if (endIndex < 0) return null;

        const entries = replies
            .slice(0, endIndex + 1)
            .map(reply => ({
                id: getReplyId(reply),
                text: getReplyId(reply) === completedId
                    ? completedText
                    : (reply.innerText || '').trim()
            }))
            .filter(entry => entry.id && entry.text)
            .slice(-MAX_CONTEXT_REPLIES)
            .map((entry, index, selected) => index === selected.length - 1 && stagedUserText !== null
                ? stagedUserText + '\n\n' + entry.text
                : entry.text);

        let dropped = 0;
        let combined = entries.join('\n\n');

        while (
            combined.length > MAX_RECENT_CHARS &&
            entries.length > 1
        ) {
            entries.shift();
            dropped++;
            combined = entries.join('\n\n');
        }

        return {
            text: combined,
            count: entries.length,
            dropped,
            oversized: combined.length > MAX_RECENT_CHARS
        };
    }

    // ============================================================
    // GENERATION COMPLETION DETECTION
    // Preserved from v1.9.4d
    // ============================================================

    function isGenerationActive() {
        const selectors = [
            'button[data-testid="stop-button"]',
            'button[data-testid="composer-stop-button"]',
            'button[aria-label="Stop generating"]',
            'button[aria-label="Stop streaming"]',
            'button[aria-label="Stop response"]',
            'button[title="Stop generating"]'
        ];

        const candidates = new Set();

        for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(
                element => candidates.add(element)
            );
        }

        document.querySelectorAll(
            'button[aria-label]'
        ).forEach(button => {
            const label = button.getAttribute('aria-label') || '';

            if (
                /^stop(?: generating| streaming| response)?$/i.test(
                    label.trim()
                )
            ) {
                candidates.add(button);
            }
        });

        for (const element of candidates) {
            if (!element.isConnected) continue;

            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);

            if (
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden'
            ) {
                return true;
            }
        }

        return false;
    }

    let baselineId = getReplyId(getLatestReply());

    let pendingId = null;
    let pendingText = '';
    let pendingElement = null;
    let lastChangeAt = 0;
    let sawGenerationActive = false;

    const CHECK_INTERVAL_MS = 400;
    const FINISHED_SETTLE_MS = 3000;
    const FALLBACK_QUIET_MS = 10000;

    function resetPendingReply() {
        pendingId = null;
        pendingText = '';
        pendingElement = null;
        lastChangeAt = 0;
        sawGenerationActive = false;
    }

    function checkForCompletedReply() {
        const latest = getLatestReply();

        if (!latest) return;

        const id = getReplyId(latest);
        const text = latest.innerText.trim();

        if (!id || !text) return;

        if (
            id === baselineId &&
            pendingId === null
        ) {
            return;
        }

        const generating = isGenerationActive();

        if (id !== pendingId) {
            pendingId = id;
            pendingText = text;
            pendingElement = latest;
            lastChangeAt = Date.now();

            sawGenerationActive = generating;

            setCaptureStatus(
                'New reply detected; monitoring generation...',
                '#facc15'
            );

            return;
        }

        if (text !== pendingText) {
            pendingText = text;
            lastChangeAt = Date.now();

            setCaptureStatus(
                'Reply still generating...',
                '#facc15'
            );
        }

        if (generating) {
            sawGenerationActive = true;

            setCaptureStatus(
                'ChatGPT is generating...',
                '#facc15'
            );

            return;
        }

        const quietFor = Date.now() - lastChangeAt;

        const requiredQuiet = sawGenerationActive
            ? FINISHED_SETTLE_MS
            : FALLBACK_QUIET_MS;

        if (quietFor < requiredQuiet) {
            setCaptureStatus(
                sawGenerationActive
                    ? 'Generation ended; settling reply...'
                    : 'Waiting to confirm reply completion...',
                '#facc15'
            );

            return;
        }

        if (!pendingElement?.isConnected) {
            const live = getReplies().find(
                reply => getReplyId(reply) === pendingId
            ) || null;

            if (live && live.innerText.trim()) {
                pendingElement = live;
                pendingText = live.innerText.trim();
                lastChangeAt = Date.now();

                setCaptureStatus(
                    'Reply element remounted; resuming...',
                    '#facc15'
                );
            } else {
                resetPendingReply();

                setCaptureStatus(
                    'Reply element replaced; re-detecting...',
                    '#facc15'
                );
            }

            return;
        }

        if (getReplyId(getLatestReply()) !== pendingId) {
            return;
        }

        if (isGenerationActive()) {
            sawGenerationActive = true;
            lastChangeAt = Date.now();

            setCaptureStatus(
                'ChatGPT is still generating...',
                '#facc15'
            );

            return;
        }

        // Build the five-reply window only after completion.
        const windowResult = buildAssistantReplyWindow(
            pendingId,
            pendingText
        );

        if (!windowResult) return;

        updateConversationInput(windowResult.text);
        stagedUserText = null;
        baselineId = pendingId;

        console.log(
            "Alex's Hotbuttons: completed assistant window:",
            windowResult
        );

        resetPendingReply();

        if (windowResult.oversized) {
            setCaptureStatus(
                'Newest reply exceeds 30,000 characters; not sent',
                '#fca5a5'
            );

            setPreviewStatus(
                'ERROR — newest reply too large; edit input to retry',
                '#fca5a5'
            );

            return;
        }

        setCaptureStatus(
            windowResult.count + ' completed replies collected' +
                (windowResult.dropped
                    ? ' (' + windowResult.dropped +
                      ' oldest omitted for size)'
                    : ''),
            '#86efac'
        );

        autoUpdateFromReply();
    }

    setInterval(
        checkForCompletedReply,
        CHECK_INTERVAL_MS
    );

    // ============================================================
    // PERCHANCE BRIDGE
    // ============================================================

    const WRAPPER_ORIGIN = 'https://perchance.org';
    const GENERATOR_ID = 'l99sbhokca';
    const BRIDGE_TOKEN = crypto.randomUUID();

    const BRIDGE_URL =
        WRAPPER_ORIGIN +
        '/' +
        GENERATOR_ID +
        '?tmBridge=1&tmToken=' +
        encodeURIComponent(BRIDGE_TOKEN);

    let bridgeWindow = null;
    let bridgeReady = false;
    let memoryReadSupported = false;
    let bridgeTimer = null;
    let bridgeAttempts = 0;
    let characters = [];
    let pendingRequestId = null;
    let detailedPending = null;
    const memoryPending = new Map();
    const memoryWritePending = new Map();
    let memoryPanelApi = null;
    let detailedBaseline = null;
    let detailedRuns = 0;
    let detailedTimeout = null;
    let autoUpdateQueued = false;
    let detailedAutoQueued = false;
    let lastDetailedAutoKey = '';
    let lastAutoKey = '';

    function autoWindowKey(characterId, text) {
        let h = 0;
        for (let i = 0; i < text.length; i++) {
            h = (h * 31 + text.charCodeAt(i)) | 0;
        }
        return characterId + ':' + text.length + ':' + h;
    }

    const bridgeStatus = document.createElement('div');

    bridgeStatus.textContent =
        '◇ Perchance: not connected';

    Object.assign(bridgeStatus.style, {
        width: '100%',
        color: '#b9c8db',        fontSize: '9.75px',
        padding: '2px 3px',
        overflowWrap: 'anywhere'
    });

    const characterSelect = document.createElement('select');

    characterSelect.title =
        'Choose Perchance character for context test';

    Object.assign(characterSelect.style, {
        flex: '1 1 95px',
        minWidth: '95px',
        background: '#424242',
        color: '#fff',
        border: '1px solid #777',
        borderRadius: '6px',
        fontSize: '10px',
        padding: '5px'
    });

    characterSelect.appendChild(
        new Option('Connect first', '')
    );

    characterSelect.disabled = true;

    const testButton = makeButton(
        '🔄 Refresh Content',
        () => testContext(false)
    );

    testButton.disabled = true;
    testButton.style.opacity = '0.5';

    const testRow = document.createElement('div');

    Object.assign(testRow.style, {
        width: '100%',
        display: 'flex',
        gap: '5px'
    });

    testRow.appendChild(testButton);

    // ============================================================
    // BASIC CONTEXT PREVIEW
    // ============================================================

    const resultLabel = document.createElement('div');

    resultLabel.textContent =
        'AI Basic Context Preview (editable, not saved)';

    Object.assign(resultLabel.style, {
        width: '100%',
        color: '#b9c8db',
        fontSize: '10px',
        fontWeight: 'bold'
    });

    const previewStatus = document.createElement('div');

    previewStatus.textContent =
        '● IDLE — waiting for context update';

    Object.assign(previewStatus.style, {
        width: '100%',
        color: '#aaa',
        fontSize: '9.75px',
        padding: '2px 3px'
    });

    function setPreviewStatus(message, color = '#aaa') {
        previewStatus.textContent = '● ' + message;
        previewStatus.style.color = color;
        basicTimer.status(color);
    }

    const resultBox = document.createElement('textarea');

    resultBox.readOnly = false;

    resultBox.placeholder =
        'Perchance Basic Context will appear here. You can edit it.';

    Object.assign(resultBox.style, {
        width: '100%',
        height: '100px',
        minHeight: '45px',
        maxHeight: '50vh',
        resize: 'vertical',
        boxSizing: 'border-box',
        padding: '8px',
        background: '#20252b',
        color: '#fff',
        border: '1px solid #64748b',
        borderRadius: '6px',
        fontSize: '11px',
        lineHeight: '1.4'
    });

    const connectButton = makeButton(
        '🔗 Connect Perchance',
        connectPerchance
    );

    const connectionLight = document.createElement('span');
    connectionLight.title = 'Perchance connection status';
    connectionLight.textContent = '●';
    connectionLight.style.color = '#f87171';
    const connectIcon = makeButton('🔗', connectPerchance);
    connectIcon.title = 'Connect Perchance';
    const characterMenu = document.createElement('div');
    Object.assign(characterMenu.style, {
        display: 'none', position: 'absolute', top: '100%', right: '0',
        width: 'max-content', minWidth: '175px', maxWidth: 'min(320px, 85vw)',
        background: '#292929', padding: '5px', border: '1px solid #777',
        borderRadius: '6px', boxShadow: '0 4px 14px #0009', zIndex: '2'
    });
    characterMenu.appendChild(characterSelect);
    characterSelect.style.width = '100%';
    const characterAnchor = document.createElement('span');
    Object.assign(characterAnchor.style, { position: 'relative', display: 'inline-flex' });
    const characterIcon = makeButton('👥', () => {
        characterMenu.style.display = characterMenu.style.display === 'block' ? 'none' : 'block';
    });
    characterIcon.title = 'Choose character';
    characterAnchor.append(characterIcon, characterMenu);
    characterSelect.addEventListener('change', () => { characterMenu.style.display = 'none'; });
    const captureLight = document.createElement('span');
    captureLight.textContent = '●';
    captureLight.title = 'Conversation capture status';
    function syncCaptureLight() { captureLight.style.color = captureStatus.style.color || '#aaa'; }
    new MutationObserver(syncCaptureLight).observe(captureStatus, { attributes: true, attributeFilter: ['style'], childList: true });
    syncCaptureLight();
    const conversationSection = section('Conversation Input', 'conversationCollapsed', [captureStatus, contextBox, bridgeStatus], [connectionLight, connectIcon, characterAnchor], captureLight, captureTimer.label);
    panelContent.appendChild(conversationSection);
    testButton.textContent = '↻'; testButton.title = 'Refresh Context Information';
    const basicLight = document.createElement('span');
    basicLight.textContent = '●'; basicLight.title = 'Context update status';
    panelContent.appendChild(section('Context Information', 'basicCollapsed', [previewStatus, resultBox], [testButton], basicLight, basicTimer.label));

    // Detailed Context diagnostics: manual, preview-only, never stored.
    const detailedLabel = document.createElement('div');
    detailedLabel.textContent = 'Detailed Context Preview (editable, not saved)';
    Object.assign(detailedLabel.style, {
        width: '100%', color: '#b9c8db', fontSize: '10px',
        fontWeight: 'bold', marginTop: '5px'
    });
    const detailedStatus = document.createElement('div');
    detailedStatus.textContent = '● IDLE — read stored context first';
    Object.assign(detailedStatus.style, {
        width: '100%', color: '#aaa', fontSize: '9.75px',
        padding: '2px 3px', overflowWrap: 'anywhere'
    });
    const detailedBox = document.createElement('textarea');
    detailedBox.placeholder = 'Detailed Context preview (editable, never saved)';
    Object.assign(detailedBox.style, {
        width: '100%', height: '115px', minHeight: '45px',
        maxHeight: '50vh', resize: 'vertical', boxSizing: 'border-box',
        padding: '8px', background: '#20252b', color: '#fff',
        border: '1px solid #64748b', borderRadius: '6px',
        fontSize: '11px', lineHeight: '1.4'
    });
    const detailedReadButton = makeButton('📖 Read Detailed', () => detailedRequest('read'));
    const detailedTestButton = makeButton('✓ Adopt as Baseline', () => adoptDetailedBaseline());
    const detailedGenerateButton = makeButton('🔄 Generate Detailed', () => detailedRequest('update'));
    const detailedDryButton = makeButton('🔒 Dry-run Save', () => detailedRequest('save'));
    const detailedRow = document.createElement('div');
    Object.assign(detailedRow.style, {
        width: '100%', display: 'flex', flexWrap: 'wrap', gap: '5px'
    });
    detailedTestButton.textContent = '✓'; detailedTestButton.title = 'Adopt edited Detailed Context as local baseline (no Perchance call)';
    detailedGenerateButton.textContent = '↻'; detailedGenerateButton.title = 'Generate Detailed Context from conversation and baseline';
    const detailedLight = document.createElement('span');
    detailedLight.textContent = '●'; detailedLight.title = 'Detailed update status';
    panelContent.appendChild(section('Detailed Context', 'detailedCollapsed', [detailedStatus, detailedBox], [detailedTestButton, detailedGenerateButton], detailedLight, detailedTimer.label));

    // Outgoing injection: on by default. The current editable Detailed Context
    // textbox is the only context source; Perchance is not contacted on send.
    const INJECTION_KEY = 'alex-hotbuttons-detailed-injection-v1';
    let injectionEnabled = true;
    const injectionToggle = document.createElement('input');
    injectionToggle.type = 'checkbox';
    injectionToggle.checked = true;
    injectionToggle.title = 'Enable outgoing Detailed Context injection (this tab only)';
    const injectionLabel = document.createElement('label');
    injectionLabel.textContent = ' Inject Detailed Context on Send';
    injectionLabel.style.cssText = 'color:#ddd;font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer;';
    injectionLabel.prepend(injectionToggle);
    const injectionStatus = document.createElement('div');
    injectionStatus.textContent = 'Injection ON — next eligible text send uses Detailed Context';
    injectionStatus.style.cssText = 'color:#86efac;font-size:10px;overflow-wrap:anywhere;';
    injectionToggle.addEventListener('change', () => {
        injectionEnabled = injectionToggle.checked;
        injectionStatus.textContent = injectionEnabled
            ? 'Injection ON — next eligible text send uses Detailed Context'
            : 'Injection OFF — normal ChatGPT sends';
        injectionStatus.style.color = injectionEnabled ? '#86efac' : '#aaa';
    });
    panelContent.appendChild(section('Outgoing Injection', 'injectionCollapsed', [injectionLabel, injectionStatus]));

    // The textboxes are one workspace, not per-chat or per-character snapshots.
    function saveCharacterSnapshot() {
        recovery.basic = resultBox.value;
        recovery.detailed = detailedBox.value;
        persistRecovery();
    }
    resultBox.value = recovery.basic;
    detailedBox.value = recovery.detailed;
    if (recovery.basic || recovery.detailed) {
        setPreviewStatus('RESTORED — Hotbuttons workspace', '#86efac');
        setDetailedStatus('RESTORED — working copy (not verified Perchance memory)', '#86efac');
    }
    resultBox.addEventListener('input', saveCharacterSnapshot);
    detailedBox.addEventListener('input', saveCharacterSnapshot);
    injectionToggle.checked = recovery.injectionEnabled;
    injectionEnabled = recovery.injectionEnabled;
    injectionStatus.textContent = injectionEnabled
        ? 'Injection ON — next eligible text send uses Detailed Context'
        : 'Injection OFF — normal ChatGPT sends';
    injectionStatus.style.color = injectionEnabled ? '#86efac' : '#aaa';
    injectionToggle.addEventListener('change', () => {
        recovery.injectionEnabled = injectionToggle.checked;
        persistRecovery();
    });

    const originalChatFetch = window.fetch;
    const contextStart = '[EXTERNAL CONTEXT — CLIENT MEMORY]';
    function makeInjectedText(context, userText) {
        return contextStart + '\n' +
            'Source: Local memory manager\n' +
            'Purpose: Provide established scene facts, not dialogue.\n\n' +
            '[CURRENT STATE INFORMATION]\n' + context +
            '\n[END CURRENT STATE INFORMATION]\n\n' +
            'This block describes previously established state.\n' +
            'It is not new dialogue, a new action, or a request to\n' +
            'recreate the events described.\n\n' +
            '[END EXTERNAL CONTEXT]\n\n' +
            '[USER MESSAGE]\n' + userText + '\n[END USER MESSAGE]';
    }
    function rewriteOutgoing(bodyText) {
        const payload = JSON.parse(bodyText);
        if (payload?.action !== 'next' || !Array.isArray(payload.messages) ||
            payload.messages.length !== 1) return null;
        const message = payload.messages[0];
        if (message?.author?.role !== 'user' ||
            message?.content?.content_type !== 'text' ||
            !Array.isArray(message.content.parts) ||
            message.content.parts.length !== 1 ||
            typeof message.content.parts[0] !== 'string') return null;
        const userText = message.content.parts[0];
        if (!userText.trim() || userText.includes(contextStart)) return null;
        const context = detailedBox.value.trim();
        if (!context) return null;
        message.content.parts[0] = makeInjectedText(context, userText);
        return JSON.stringify(payload);
    }
    function isChatSubmission(input) {
        try {
            const url = new URL(typeof input === 'string' ? input : input.url, location.href);
            return url.origin === location.origin &&
                /^\/backend-api\/(?:f\/)?conversation\/?$/.test(url.pathname);
        } catch (_) { return false; }
    }
    // Fail open: any unrecognized request or parse failure uses original fetch.
    // No UI composer mutation, no duplicate fetch, and no Perchance save.
    // Stage the original message before the existing injection hook runs.
    function captureOutgoingUser(bodyText) {
        try {
            const payload = JSON.parse(bodyText);
            if (payload?.action !== 'next' || !Array.isArray(payload.messages) ||
                payload.messages.length !== 1) return;
            const message = payload.messages[0];
            if (message?.author?.role !== 'user' ||
                message?.content?.content_type !== 'text' ||
                !Array.isArray(message.content.parts) ||
                message.content.parts.length !== 1 ||
                typeof message.content.parts[0] !== 'string') return;
            const original = message.content.parts[0];
            if (!original.trim() || original.includes(contextStart)) return;
            stagedUserText = 'Bill: ' + original;
            updateConversationInput(stagedUserText);
            setCaptureStatus('Original message captured; awaiting reply...', '#86efac');
        } catch (error) {
            console.warn('[ALAI] Original message capture skipped:', error);
        }
    }
    window.fetch = function alaiContextFetch(input, init) {
        if (!isChatSubmission(input)) {
            return originalChatFetch.apply(this, arguments);
        }
        const self = this;
        const originalArgs = arguments;
        const handle = (bodyText) => {
            captureOutgoingUser(bodyText);
            if (!injectionEnabled) return originalChatFetch.apply(self, originalArgs);
            try {
                const replacement = rewriteOutgoing(bodyText);
                if (!replacement) return originalChatFetch.apply(self, originalArgs);
                injectionStatus.textContent = 'Injected Detailed Context into outgoing request (' +
                    detailedBox.value.trim().length + ' context chars)';
                injectionStatus.style.color = '#86efac';
                if (input instanceof Request) {
                    const request = new Request(input, { ...(init || {}), body: replacement });
                    return originalChatFetch.call(self, request);
                }
                return originalChatFetch.call(self, input, { ...(init || {}), body: replacement });
            } catch (error) {
                injectionStatus.textContent = 'Injection skipped — ' + String(error.message || error);
                injectionStatus.style.color = '#fca5a5';
                return originalChatFetch.apply(self, originalArgs);
            }
        };
        if (init && typeof init.body === 'string') return handle(init.body);
        if (input instanceof Request && (!init || init.body == null)) {
            return input.clone().text().then(handle, () => originalChatFetch.apply(self, originalArgs));
        }
        return originalChatFetch.apply(self, originalArgs);
    };
    console.info('[ALAI] Outgoing Detailed Context hook installed; disabled until enabled in toolbar.');

    // Incoming conversation history: change only the browser-facing JSON copy.
    // The server's saved messages and outgoing injection remain untouched.
    function isConversationHistory(input) {
        try {
            const url = new URL(typeof input === 'string' ? input : input.url, location.href);
            const segments = url.pathname.split('/').filter(Boolean);
            return url.origin === location.origin &&
                segments[0] === 'backend-api' &&
                segments[1] === 'conversations' &&
                (segments.length === 3 ||
                 (segments.length === 4 && segments[3] === 'messages'));
        } catch (_) { return false; }
    }
    async function cleanIncomingHistory(response) {
        try {
            if (!response.ok || !response.headers.get('content-type')?.includes('json')) return response;
            const data = await response.clone().json();
            if (!Array.isArray(data?.messages)) return response;
            let count = 0;
            for (const message of data.messages) {
                if (message?.author?.role !== 'user' ||
                    !Array.isArray(message.content?.parts)) continue;
                for (let i = 0; i < message.content.parts.length; i++) {
                    const clean = originalFromInjectedText(message.content.parts[i]);
                    if (clean === null) continue;
                    message.content.parts[i] = clean;
                    count++;
                }
            }
            if (!count) return response;
            const headers = new Headers(response.headers);
            headers.delete('content-length');
            headers.delete('content-encoding');
            const copy = new Response(JSON.stringify(data), {
                status: response.status, statusText: response.statusText, headers
            });
            Object.defineProperty(copy, 'url', { value: response.url });
            console.info('[ALAI] Incoming history cleaned:', count, 'wrapped message(s).');
            return copy;
        } catch (error) {
            console.warn('[ALAI] Incoming history cleanup skipped:', error);
            return response;
        }
    }
    const outgoingAndHistoryFetch = window.fetch;
    window.fetch = function alaiHistoryFetch(input, init) {
        if (!isConversationHistory(input)) {
            return outgoingAndHistoryFetch.apply(this, arguments);
        }
        return outgoingAndHistoryFetch.apply(this, arguments).then(cleanIncomingHistory);
    };
    console.info('[ALAI] Incoming history hook installed.');

    // Display-only cleanup, targeting the actual ChatGPT user Markdown root.
    // This does not alter server-side history or outgoing injection.
    const userStartMarker = '[USER MESSAGE]';
    const userEndMarker = '[END USER MESSAGE]';
    function originalFromInjectedText(value) {
        if (typeof value !== 'string') return null;
        const text = value.replace(/\r\n?/g, '\n').trim();
        if (!text.startsWith(contextStart)) return null;
        const outerEnd = text.indexOf('[END EXTERNAL CONTEXT]');
        const start = text.indexOf(userStartMarker, outerEnd);
        const end = text.lastIndexOf(userEndMarker);
        if (outerEnd < 0 || start < 0 || end < start ||
            text.slice(end + userEndMarker.length).trim()) return null;
        return text.slice(start + userStartMarker.length, end).trim();
    }
    let cleanupScheduled = false;
    function cleanInjectedUserBubbles() {
        cleanupScheduled = false;
        let cleaned = 0;
        document.querySelectorAll('[data-user-message-bubble="true"] div.text-size-chat.whitespace-pre-wrap').forEach(root => {
            // React can re-render the original wrapper into a previously cleaned
            // element. Always inspect its current content rather than trusting a
            // persistent dataset marker from an earlier cleanup.
            const original = originalFromInjectedText(root.textContent);
            if (original === null) return;
            root.textContent = original;
            root.style.whiteSpace = 'pre-wrap';
            root.dataset.alaiDisplayCleaned = 'true';
            cleaned++;
        });
        if (cleaned) console.info('[ALAI] Cleaned', cleaned, 'injected user message(s).');
    }
    function scheduleBubbleCleanup() {
        if (cleanupScheduled) return;
        cleanupScheduled = true;
        requestAnimationFrame(cleanInjectedUserBubbles);
    }
    // The assistant's final render can reconcile the preceding user turn.
    // Recheck after that event settles; no recurring polling or full-time timer.
    let afterReplyTimer = null;
    function onConversationMutation(records) {
        scheduleBubbleCleanup();
        const assistantChanged = records.some(record => {
            const el = record.target.nodeType === Node.ELEMENT_NODE
                ? record.target : record.target.parentElement;
            if (el?.closest?.('[data-message-author-role="assistant"]')) return true;
            return [...record.addedNodes].some(node =>
                node.nodeType === Node.ELEMENT_NODE &&
                (node.matches?.('[data-message-author-role="assistant"]') ||
                 node.querySelector?.('[data-message-author-role="assistant"]'))
            );
        });
        if (assistantChanged) {
            if (afterReplyTimer !== null) clearTimeout(afterReplyTimer);
            afterReplyTimer = setTimeout(() => {
                afterReplyTimer = null;
                scheduleBubbleCleanup();
            }, 350);
        }
    }
    const bubbleObserver = new MutationObserver(onConversationMutation);
    bubbleObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    scheduleBubbleCleanup();

    function syncLight(status, light) {
        const value = status.textContent || '';
        light.style.color = /ERROR|TIMEOUT|CONFLICT|failed/i.test(value) ? '#f87171' :
            /PROCESSING|waiting|queued|connecting/i.test(value) ? '#facc15' :
            /UPDATED|PREVIEW|READ/i.test(value) ? '#86efac' : '#aaa';
    }
    new MutationObserver(() => syncLight(previewStatus, basicLight)).observe(previewStatus, { childList: true, characterData: true, subtree: true });
    new MutationObserver(() => syncLight(detailedStatus, detailedLight)).observe(detailedStatus, { childList: true, characterData: true, subtree: true });
    syncLight(previewStatus, basicLight); syncLight(detailedStatus, detailedLight);
    function updateConnectionLight() {
        connectionLight.style.color = bridgeReady ? '#86efac' : (bridgeWindow && !bridgeWindow.closed && bridgeAttempts < 30 ? '#facc15' : '#f87171');
    }
    setInterval(updateConnectionLight, 500);
    updateConnectionLight();

    function setDetailedStatus(message, color = '#aaa') {
        detailedStatus.textContent = '● ' + message;
        detailedStatus.style.color = color;
        detailedTimer.status(color);
    }
    function resetDetailed() {
        clearTimeout(detailedTimeout);
        detailedTimeout = null;
        detailedPending = null;
        detailedBaseline = null;
        detailedRuns = 0;
        // Connection resets invalidate authority, not the workspace text.
        setDetailedStatus('IDLE — working text retained; read stored context to verify');
        updateDetailedButtons();
    }
    function adoptDetailedBaseline() {
        if (!detailedBaseline || !characterSelect.value ||
            detailedBaseline.characterId !== characterSelect.value ||
            detailedPending || pendingRequestId) return;
        detailedBaseline.previousDetailed = detailedBox.value;
        setDetailedStatus('ADOPTED — local baseline (NOT SAVED)', '#86efac');
        updateDetailedButtons();
    }
    function updateDetailedButtons() {
        const ready = bridgeReady && !!characterSelect.value &&
            !pendingRequestId && !detailedPending;
        detailedReadButton.disabled = !ready;
        detailedTestButton.disabled = !detailedBaseline ||
            detailedBaseline.characterId !== characterSelect.value ||
            !!detailedPending || !!pendingRequestId;
        detailedGenerateButton.disabled = !ready;
        detailedDryButton.disabled = !ready || !detailedBaseline || !detailedRuns;
        for (const button of [detailedReadButton, detailedTestButton, detailedGenerateButton, detailedDryButton]) {
            button.style.opacity = button.disabled ? '0.5' : '1';
        }
    }
    characterSelect.addEventListener('change', () => {
        recovery.selectedCharacter = characterSelect.value;
        persistRecovery();
        // Changing the bridge selection does not erase the Hotbuttons workspace.
        detailedBaseline = null;
        detailedRuns = 0;
        updateDetailedButtons();
        lastAutoKey = '';
        lastDetailedAutoKey = '';
        detailedAutoQueued = false;
        if (characterSelect.value && bridgeReady) autoUpdateFromReply();
    });

    function detailedRequest(action) {
        if (!bridgeReady || !bridgeWindow || bridgeWindow.closed ||
            pendingRequestId || detailedPending) return;
        const characterId = characterSelect.value;
        if (!characterId) return;
        const requestId = crypto.randomUUID();
        const data = { requestId, token: BRIDGE_TOKEN, characterId, wantMemory: true };
        if (action === 'read') {
            data.type = 'nap-detailed-read';
        } else if (action === 'update') {
            if (!detailedBaseline || detailedBaseline.characterId !== characterId) {
                detailedAutoQueued = true;
                detailedRequest('read');
                return;
            }
            const recentMessagesText = contextBox.value.trim();
            if (!recentMessagesText || recentMessagesText.length > MAX_RECENT_CHARS) {
                setDetailedStatus('ERROR — capture replies (max ' + MAX_RECENT_CHARS + ' chars)', '#fca5a5');
                return;
            }
            data.type = 'nap-detailed-update';
            data.recentMessagesText = recentMessagesText;
            data.previousDetailed = detailedBox.value;
        } else if (action === 'save') {
            if (!detailedBaseline || detailedBaseline.characterId !== characterId) return;
            data.type = 'nap-detailed-save';
            data.detailed = detailedBox.value;
            data.expectedPrevious = detailedBaseline.previousDetailed;
            data.expectedVersion = detailedBaseline.memVersionDetailed;
            data.dryRun = true; // Hard rule: no live saves in this release.
        } else return;
        detailedPending = { requestId, characterId, action };
        characterSelect.disabled = true;
        updateDetailedButtons();
        clearTimeout(detailedTimeout);
        detailedTimeout = setTimeout(() => {
            if (!detailedPending || detailedPending.requestId !== requestId) return;
            detailedPending = null;
            detailedTimeout = null;
            setDetailedStatus('TIMEOUT — no response after 180 seconds; reconnect before retrying', '#fca5a5');
            bridgeReady = false;
            setTestEnabled(false);
            updateDetailedButtons();
            bridgeStatus.textContent = '◇ Perchance: reconnect after Detailed timeout';
        }, 180000);
        setDetailedStatus('PROCESSING — ' + action + '...', '#facc15');
        bridgeWindow.postMessage(data, WRAPPER_ORIGIN);
    }


    // ============================================================
    // BRIDGE CONNECTION
    // ============================================================

    function stopBridgePolling() {
        if (bridgeTimer !== null) {
            clearInterval(bridgeTimer);
            bridgeTimer = null;
        }
    }

    function setTestEnabled(enabled) {
        characterSelect.disabled = !enabled;
        testButton.disabled = !enabled;

        testButton.style.opacity =
            enabled ? '1' : '0.5';
    }

    function sendBridgeHello() {
        if (bridgeReady || !bridgeWindow) return;

        if (bridgeWindow.closed) {
            stopBridgePolling();

            bridgeStatus.textContent =
                '◇ Perchance: bridge tab closed';

            return;
        }

        bridgeAttempts++;

        try {
            bridgeWindow.postMessage(
                {
                    type: 'nap-tm-hello',
                    token: BRIDGE_TOKEN
                },
                WRAPPER_ORIGIN
            );
        } catch (error) {
            console.warn(
                'Hotbuttons bridge handshake:',
                error
            );
        }

        if (bridgeAttempts >= 30) {
            stopBridgePolling();

            bridgeStatus.textContent =
                '◇ Perchance: no handshake (check relay tab)';
        }
    }

    // Recover a reloaded bridge tab without discarding character selections.
    function resumeBridgeHandshake() {
        if (!bridgeWindow || bridgeWindow.closed) return;
        stopBridgePolling();
        bridgeReady = false;
        memoryReadSupported = false;
        bridgeAttempts = 0;
        for (const item of memoryPending.values()) clearTimeout(item.timeout);
        memoryPending.clear();
        for (const item of memoryWritePending.values()) clearTimeout(item.timeout);
        memoryWritePending.clear();
        memoryPanelApi?.disconnected();
        pendingRequestId = null;
        detailedPending = null;
        setTestEnabled(false);
        bridgeStatus.textContent = '◇ Perchance: reconnecting...';
        sendBridgeHello();
        bridgeTimer = setInterval(sendBridgeHello, 3000);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && bridgeWindow && !bridgeWindow.closed && !bridgeReady && bridgeTimer === null) {
            resumeBridgeHandshake();
        }
    });

    function connectPerchance() {
        stopBridgePolling();

        bridgeReady = false;
        memoryReadSupported = false;
        bridgeAttempts = 0;
        pendingRequestId = null;
        autoUpdateQueued = false;
        detailedAutoQueued = false;
        lastDetailedAutoKey = '';
        lastAutoKey = '';
        resetDetailed();
        characters = [];
        for (const item of memoryPending.values()) clearTimeout(item.timeout);
        memoryPending.clear();
        for (const item of memoryWritePending.values()) clearTimeout(item.timeout);
        memoryWritePending.clear();
        memoryPanelApi?.disconnected();

        setTestEnabled(false);

        characterSelect.replaceChildren(
            new Option('Connect first', '')
        );
        window.dispatchEvent(new Event('alai-memory-character-roster-ready'));

        bridgeWindow = window.open(
            BRIDGE_URL,
            'alex-perchance-bridge'
        );

        if (!bridgeWindow) {
            bridgeStatus.textContent =
                '◇ Perchance: popup blocked; allow popups';

            return;
        }

        bridgeStatus.textContent =
            '◇ Perchance: connecting through relay...';

        setPreviewStatus(
            'IDLE — connecting to Perchance'
        );

        sendBridgeHello();

        bridgeTimer = setInterval(
            sendBridgeHello,
            3000
        );
    }

    // ============================================================
    // Independent bridge-closure watchdog (does not touch capture).
    // Covers the neither-path-runs case: bridge closed mid-flight with
    // Test disabled and no new reply arriving. Resets state only.
    // ============================================================

    setInterval(() => {
        if (
            bridgeReady &&
            bridgeWindow &&
            bridgeWindow.closed
        ) {
            pendingRequestId = null;
            autoUpdateQueued = false;
            bridgeReady = false;
            resetDetailed();
            setTestEnabled(false);

            bridgeStatus.textContent =
                '◇ Perchance: bridge tab closed; reconnect';

            setPreviewStatus(
                'IDLE — bridge tab closed; reconnect',
                '#fca5a5'
            );
        }
    }, 2000);

    // ============================================================
    // AUTOMATIC BASIC CONTEXT UPDATES
    // ============================================================

    function autoUpdateFromReply() {
        if (bridgeWindow && bridgeWindow.closed) {
            pendingRequestId = null;
            autoUpdateQueued = false;
            bridgeReady = false;
            resetDetailed();
            setTestEnabled(false);

            bridgeStatus.textContent =
                '◇ Perchance: bridge tab closed; reconnect';

            setPreviewStatus(
                'IDLE — bridge tab closed; reconnect',
                '#fca5a5'
            );

            return;
        }

        if (
            !bridgeReady ||
            !bridgeWindow ||
            bridgeWindow.closed ||
            !characterSelect.value
        ) {
            setPreviewStatus(
                'IDLE — connect and select a character',
                '#facc15'
            );

            return;
        }

        if (pendingRequestId || detailedPending) {
            autoUpdateQueued = true;

            setPreviewStatus(
                'PROCESSING — newer reply queued',
                '#facc15'
            );

            return;
        }

        testContext(true);
    }

    function autoDetailedPreview() {
        if (!bridgeReady || !characterSelect.value || !contextBox.value.trim()) return;
        const key = autoWindowKey(characterSelect.value, contextBox.value.trim());
        if (key === lastDetailedAutoKey) return;
        detailedAutoQueued = true;
        if (pendingRequestId || detailedPending) return;
        if (!detailedBaseline || detailedBaseline.characterId !== characterSelect.value) {
            detailedRequest('read');
        } else {
            detailedAutoQueued = false;
            lastDetailedAutoKey = key;
            detailedRequest('update');
        }
    }

    // Shared manual and automatic updater.
    // isAuto=true: skip duplicate windows. Manual calls always send.

    function testContext(isAuto) {
        if (bridgeWindow && bridgeWindow.closed) {
            pendingRequestId = null;
            autoUpdateQueued = false;
            bridgeReady = false;
            resetDetailed();
            setTestEnabled(false);

            bridgeStatus.textContent =
                '◇ Perchance: bridge tab closed; reconnect';

            return;
        }

        if (
            !bridgeReady ||
            !bridgeWindow ||
            bridgeWindow.closed
        ) {
            bridgeStatus.textContent =
                '◇ Perchance: connect first';

            return;
        }

        if (pendingRequestId || detailedPending) return;

        const characterId = characterSelect.value;
        const recentMessagesText = contextBox.value.trim();

        if (!characterId) {
            bridgeStatus.textContent =
                '◇ Perchance: choose a character';

            return;
        }

        if (!recentMessagesText) {
            bridgeStatus.textContent =
                '◇ Perchance: conversation input is empty';

            return;
        }

        // Validate manual edits too.
        if (recentMessagesText.length > MAX_RECENT_CHARS) {
            bridgeStatus.textContent =
                '◇ Perchance: input is ' +
                recentMessagesText.length +
                ' chars (max ' + MAX_RECENT_CHARS + ')';

            setPreviewStatus(
                'ERROR — input too large; shorten it before testing',
                '#fca5a5'
            );

            return;
        }

        const windowKey = autoWindowKey(
            characterId,
            recentMessagesText
        );

        if (isAuto === true && windowKey === lastAutoKey) {
            setPreviewStatus(
                'IDLE — duplicate window skipped',
                '#aaa'
            );

            return;
        }

        lastAutoKey = windowKey;

        const requestId = crypto.randomUUID();

        pendingRequestId = requestId;

        updateDetailedButtons();
        setTestEnabled(false);

        setPreviewStatus(
            'PROCESSING — waiting for Perchance AI...',
            '#facc15'
        );

        bridgeStatus.textContent =
            '◇ Perchance: running context update...';

        // In character mode, Perchance currently reads its
        // stored Basic Context instead of using previousBasic.
        // The bridge does not save the returned preview.

        bridgeWindow.postMessage(
            {
                type: 'nap-context-update',
                requestId,
                token: BRIDGE_TOKEN,
                characterId,
                wantMemory: true,
                previousBasic: resultBox.value,
                recentMessagesText
            },
            WRAPPER_ORIGIN
        );
    }

    // ============================================================
    // PERCHANCE MESSAGE HANDLER
    // ============================================================

    // Independent memory refresh over an existing, working bridge message type.
    function readPerchanceMemory(frameName, characterId) {
        if (!bridgeReady || !bridgeWindow || bridgeWindow.closed) return false;
        const requestId = crypto.randomUUID();
        const id = String(characterId);
        const timeout = setTimeout(() => {
            if (!memoryPending.has(requestId)) return;
            memoryPending.delete(requestId);
            memoryPanelApi?.response(frameName, id, { ok: false, error: 'timeout', retryable: true });
        }, 12000);
        memoryPending.set(requestId, { frameName, id, timeout });
        try {
            bridgeWindow.postMessage({
                type: 'nap-detailed-read', requestId, token: BRIDGE_TOKEN,
                characterId: Number(id), wantMemory: true
            }, WRAPPER_ORIGIN);
        } catch (error) {
            clearTimeout(timeout);
            memoryPending.delete(requestId);
            memoryPanelApi?.response(frameName, id, { ok: false, error: 'post_message_failed', retryable: true });
        }
        return true;
    }

    function adoptPiggybackMemory(data, id) {
        const snapshot = data.memory;
        if (!snapshot || snapshot.ok !== true ||
            String(snapshot.characterId) !== String(id)) return;
        memoryPanelApi?.snapshot(String(id), snapshot);
    }

    window.addEventListener('message', event => {
        // Temporary diagnostic: observe bridge messages before origin/source gates.
        // Do not process or trust these messages here; logging only.
        const diagnosticData = event.data;
        if (diagnosticData && typeof diagnosticData === 'object' &&
            typeof diagnosticData.type === 'string' &&
            diagnosticData.type.includes('nap-')) {
            console.info('[ALAI-ROUTE]', {
                type: diagnosticData.type,
                origin: event.origin,
                sourceIsBridgeWindow: event.source === bridgeWindow,
                bridge: diagnosticData.bridge,
                requestId: diagnosticData.requestId,
                characterId: diagnosticData.characterId
            });
        }
        if (
            event.origin !== WRAPPER_ORIGIN ||
            event.source !== bridgeWindow
        ) {
            return;
        }

        const data = event.data;

        if (
            !data ||
            typeof data !== 'object' ||
            !['tm-basic-v1', 'tm-basic-v2'].includes(data.bridge)
        ) {
            return;
        }

        if (data.type === 'nap-bridge-ready-announce') {
            // A bridge reload creates a new document but retains this window handle.
            // Re-handshake with the existing token; no new tab or character reset.
            resumeBridgeHandshake();
            return;
        }

        console.info('[ALAI-DBG] bridge msg:', data.type, 'req:', data.requestId, 'char:', data.characterId, 'ok:', data.ok, 'err:', data.error);

        // Memory generation/save replies share proven context envelopes, but have
        // independent pending requests: never feed them into Basic Context.
        if ((data.type === 'nap-context-result' || data.type === 'nap-context-save-result') &&
            memoryWritePending.has(data.requestId)) {
            const pending = memoryWritePending.get(data.requestId);
            if (String(data.characterId) !== pending.id ||
                data.type !== (pending.action === 'generate' ? 'nap-context-result' : 'nap-context-save-result')) return;
            memoryWritePending.delete(data.requestId);
            clearTimeout(pending.timeout);
            memoryPanelApi?.writeResponse(pending.frameName, pending.id, pending.action, data);
            return;
        }

        if (data.type === 'nap-detailed-read-result' && memoryPending.has(data.requestId)) {
            const pending = memoryPending.get(data.requestId);
            if (String(data.characterId) !== pending.id) return;
            memoryPending.delete(data.requestId);
            clearTimeout(pending.timeout);
            if (data.memory?.ok === true && String(data.memory.characterId) === pending.id) {
                memoryPanelApi?.response(pending.frameName, pending.id, data.memory);
            } else {
                memoryPanelApi?.response(pending.frameName, pending.id, {
                    ok: false, error: String(data.memory?.error || data.error || 'memory_unavailable'),
                    retryable: data.memory?.retryable !== false
                });
            }
            return;
        }

        if (data.type === 'nap-memory-read-result') {
            const pending = memoryPending.get(data.requestId);
            if (!pending) return;
            if (data.characterId != null && String(data.characterId) !== pending.id) return;
            memoryPending.delete(data.requestId);
            clearTimeout(pending.timeout);
            memoryPanelApi?.response(pending.frameName, pending.id, data);
            return;
        }

        // Detailed responses are matched by request AND selected character.
        if (['nap-detailed-read-result', 'nap-detailed-result',
             'nap-detailed-save-result'].includes(data.type)) {
            if (!detailedPending || data.requestId !== detailedPending.requestId ||
                String(data.characterId) !== detailedPending.characterId ||
                characterSelect.value !== detailedPending.characterId) return;
            const action = detailedPending.action;
            const expectedType = action === 'read' ? 'nap-detailed-read-result' :
                action === 'update' ? 'nap-detailed-result' : 'nap-detailed-save-result';
            if (data.type !== expectedType) return;
            adoptPiggybackMemory(data, detailedPending.characterId);
            detailedPending = null;
            clearTimeout(detailedTimeout);
            detailedTimeout = null;
            setTestEnabled(bridgeReady && characterSelect.options.length > 1);
            if (data.ok && action === 'read') {
                const previousDetailed = String(data.detailed || '');
                detailedBaseline = {
                    characterId: characterSelect.value,
                    previousDetailed,
                    memVersionDetailed: Number(data.memVersionDetailed) || 0
                };
                detailedRuns = 0;
                detailedBox.value = previousDetailed;
                saveCharacterSnapshot();
                setDetailedStatus('READ — stored context loaded' +
                    (data.hasDetailedPrompt ? '' : '; prompt MISSING') +
                    (data.enabled === false ? '; disabled' : ''), '#86efac');
            } else if (data.ok && action === 'update' && typeof data.detailed === 'string') {
                // Preserve the baseline returned by the generator for a later dry-run CAS.
                detailedBaseline = {
                    characterId: characterSelect.value,
                    previousDetailed: String(data.detailed),
                    memVersionDetailed: Number(data.memVersionDetailed) || 0
                };
                detailedBox.value = data.detailed;
                saveCharacterSnapshot();
                detailedRuns++;
                setDetailedStatus('PREVIEW COMPLETE (NOT SAVED)', '#86efac');
            } else if (data.ok && action === 'save') {
                setDetailedStatus('DRY RUN PASSED — no data saved', '#86efac');
            } else if (data.conflict) {
                setDetailedStatus('CONFLICT — stored context changed; reload before retrying', '#fca5a5');
            } else {
                setDetailedStatus('ERROR — ' + String(data.error || 'unknown') +
                    (data.stopReason ? '; stop ' + data.stopReason : '') +
                    (data.partialLen != null ? '; partial ' + data.partialLen : ''),
                    '#fca5a5');
            }
            updateDetailedButtons();
            if (detailedAutoQueued && action === 'read' && data.ok) {
                detailedAutoQueued = false;
                lastDetailedAutoKey = autoWindowKey(characterSelect.value, contextBox.value.trim());
                detailedRequest('update');
                return;
            }
            if (autoUpdateQueued) {
                autoUpdateQueued = false;
                testContext(true);
            }
            return;
        }

        if (data.type === 'nap-bridge-ready') {
            if (!data.ok) {
                bridgeStatus.textContent =
                    '◇ Perchance: ' +
                    String(data.error || 'bridge error');

                if (!data.retryable) {
                    stopBridgePolling();
                }

                return;
            }

            if (data.dbReady !== true) {
                bridgeStatus.textContent =
                    '◇ Perchance: waiting for DB...';

                return;
            }

            bridgeReady = true;
            memoryReadSupported = Array.isArray(data.caps) && data.caps.includes('memory-read');
            stopBridgePolling();

            characters = Array.isArray(data.characters)
                ? data.characters
                : [];

            characterSelect.replaceChildren(
                new Option('Choose character...', '')
            );

            for (const character of characters) {
                if (
                    character &&
                    character.id != null &&
                    character.name != null
                ) {
                    const label =
                        String(character.name) +
                        ' (#' +
                        String(character.id) +
                        ')';

                    characterSelect.appendChild(
                        new Option(
                            label,
                            String(character.id)
                        )
                    );
                }
            }

            window.dispatchEvent(new Event('alai-memory-character-roster-ready'));
            const savedCharacter = recovery.selectedCharacter;
            characterSelect.value = [...characterSelect.options].some(option => option.value === savedCharacter)
                ? savedCharacter : '';
            // Reconnecting the bridge must not clear restored working text.
            detailedBaseline = null;
            detailedRuns = 0;

            setTestEnabled(
                characterSelect.options.length > 1 &&
                !pendingRequestId
            );
            updateDetailedButtons();

            bridgeStatus.textContent =
                '● Perchance connected (' +
                characters.length +
                ' characters)';

            setPreviewStatus(
                'IDLE — select a character',
                '#aaa'
            );

            console.log(
                "Alex's Hotbuttons: Perchance bridge ready.",
                characters
            );

            return;
        }

        if (
            data.type === 'nap-context-result' &&
            pendingRequestId &&
            data.requestId === pendingRequestId
        ) {
            adoptPiggybackMemory(data, characterSelect.value);
            pendingRequestId = null;
            updateDetailedButtons();

            setTestEnabled(
                bridgeReady &&
                characterSelect.options.length > 1
            );

            if (
                data.ok &&
                typeof data.basic === 'string'
            ) {
                resultBox.value = data.basic;
                saveCharacterSnapshot();

                bridgeStatus.textContent =
                    '● Perchance: Basic Context updated (not saved)';

                setPreviewStatus(
                    'UPDATED — Basic Context ready',
                    '#86efac'
                );

                console.log(
                    "Alex's Hotbuttons: context preview returned:",
                    data
                );

                autoDetailedPreview();
                if (autoUpdateQueued) {
                    autoUpdateQueued = false;

                    setPreviewStatus(
                        'PROCESSING — queued reply...',
                        '#facc15'
                    );

                    testContext(true);
                }
            } else {
                resultBox.placeholder =
                    'No context returned.';

                bridgeStatus.textContent =
                    '◇ Perchance: ' +
                    String(
                        data.error ||
                        'context test failed'
                    );

                setPreviewStatus(
                    'ERROR — context update failed',
                    '#fca5a5'
                );

                console.warn(
                    "Alex's Hotbuttons: context test failed:",
                    data
                );

                if (autoUpdateQueued) {
                    autoUpdateQueued = false;

                    setPreviewStatus(
                        'ERROR — manual retry required',
                        '#fca5a5'
                    );
                }
            }
        }
    });


    // ============================================================
    // PERSONAL MEMORY PANEL — v1.11.5 READ-ONLY MEMORY DISPLAY
    // Separate from the existing Hotbuttons panel. The four text
    // areas display native Perchance text; NO writes occur here.
    // ============================================================
    (function createPersonalMemoryPanel() {
        const STORAGE_KEY = 'alai-personal-memory-panel-ui-v1110';
        let state = {};
        try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) {}
        const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} };
        const panel = document.createElement('div');
        panel.id = 'alai-personal-memory-panel';
        Object.assign(panel.style, {
            position: 'fixed', right: '20px', bottom: '20px', zIndex: '9998',
            width: (Number(state.width) || 390) + 'px',
            height: (Number(state.height) || 350) + 'px',
            minWidth: '270px', minHeight: '45px',
            maxWidth: '95vw', maxHeight: '90vh',
            resize: 'both', overflow: 'auto', boxSizing: 'border-box',
            background: '#292929', color: '#eee', border: '1px solid #666',
            borderRadius: '9px', boxShadow: '0 4px 18px #0005',
            padding: '7px', font: '12px system-ui, sans-serif'
        });
        if (Number.isFinite(state.left) && Number.isFinite(state.top)) {
            panel.style.left = state.left + 'px';
            panel.style.top = state.top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        }
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#383838', borderRadius: '6px', padding: '6px',
            cursor: 'move', userSelect: 'none', touchAction: 'none',
            fontWeight: 'bold'
        });
        const title = document.createElement('span');
        title.textContent = '⋮⋮  Alex & Aiko — Personal Memories (v1.11.8)';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.title = 'Collapse or expand memory panel';
        Object.assign(toggle.style, {
            color: '#eee', background: 'transparent', border: 0,
            cursor: 'pointer', fontSize: '15px'
        });
        header.append(title, toggle);
        panel.appendChild(header);
        const content = document.createElement('div');
        Object.assign(content.style, { paddingTop: '7px', display: 'grid', gap: '7px' });
        panel.appendChild(content);
        const notice = document.createElement('div');
        notice.textContent = 'Stored memories are read-only. Generate an editable draft, then explicitly Save.';
        Object.assign(notice.style, { color: '#bbb', fontSize: '10px' });
        content.appendChild(notice);
        function applyCollapsed() {
            content.style.display = state.collapsed ? 'none' : 'grid';
            toggle.textContent = state.collapsed ? '▸' : '▾';
            panel.style.resize = state.collapsed ? 'horizontal' : 'both';
            if (state.collapsed) panel.style.height = 'auto';
            else panel.style.height = (Number(state.height) || 350) + 'px';
        }
        toggle.addEventListener('pointerdown', e => e.stopPropagation());
        toggle.addEventListener('click', () => {
            state.collapsed = !state.collapsed;
            persist();
            applyCollapsed();
        });
        // Mirror the main Conversation Input character roster without changing its selection.
        const memorySelectors = [];
        const memoryFrames = new Map();
        function cancelMemoryReads(frameName) {
            for (const [requestId, item] of memoryPending) {
                if (item.frameName !== frameName) continue;
                clearTimeout(item.timeout);
                memoryPending.delete(requestId);
            }
        }
        function setStatus(frame, message, color = '#aaa') {
            frame.status.textContent = message;
            frame.status.style.color = color;
        }
        function clearFrame(frame, message) {
            frame.personal.value = '';
            frame.extended.value = '';
            frame.personal.placeholder = message;
            frame.extended.placeholder = message;
            frame.lastStrings = null;
            frame.snapshot = null;
            frame.draft = null;
            frame.lastWriteOutcome = false;
            if (frame.preview) frame.preview.style.display = 'none';
            setStatus(frame, message);
        }
        function refreshMemoryCharacters() {
            if (!bridgeReady) {
                for (const { name, select } of memorySelectors) {
                    select.replaceChildren(new Option('Connect Perchance...', ''));
                    select.disabled = true;
                    const frame = memoryFrames.get(name);
                    if (frame) clearFrame(frame, 'Perchance disconnected');
                }
                return;
            }
            const available = [...characterSelect.options].filter(option => option.value);
            for (const { name, select } of memorySelectors) {
                const previous = select.value || String(state['character' + name] || '');
                const previousName = String(state['characterName' + name] || '');
                const match = characters.find(c => String(c.id) === previous);
                const safeId = match && previousName && String(match.name) === previousName ? previous : '';
                select.replaceChildren(new Option(
                    available.length ? 'Choose character...' : 'Connect Perchance...', ''
                ));
                for (const option of available) select.appendChild(new Option(option.textContent, option.value));
                select.disabled = !available.length;
                select.value = available.some(option => option.value === safeId) ? safeId : '';
                if (!select.value && previous) {
                    state['character' + name] = '';
                    state['characterName' + name] = '';
                    persist();
                }
                const frame = memoryFrames.get(name);
                if (frame) {
                    cancelMemoryReads(name);
                    clearFrame(frame, select.value ? 'Loading memories…' :
                        previous ? 'Character identity needs re-selection' : 'Choose a character');
                    if (select.value) {
                        queueRead(frame);
                        
                    }
                }
            }
        }
        for (const name of ['Alex', 'Aiko']) {
            const frame = document.createElement('section');
            Object.assign(frame.style, {
                border: '1px solid #555', borderRadius: '7px',
                overflow: 'hidden', minWidth: '0'
            });
            const frameHeader = document.createElement('div');
            Object.assign(frameHeader.style, {
                display: 'flex', alignItems: 'center', gap: '6px',
                width: '100%', boxSizing: 'border-box', padding: '5px 7px',
                background: '#383838', color: '#eee', fontWeight: 'bold'
            });
            const collapseButton = document.createElement('button');
            collapseButton.type = 'button';
            collapseButton.title = 'Collapse or expand ' + name;
            Object.assign(collapseButton.style, {
                background: 'transparent', color: '#eee', border: 0,
                padding: '2px', cursor: 'pointer', fontWeight: 'bold'
            });
            const nameLabel = document.createElement('span');
            nameLabel.textContent = name;
            const memoryCharacterSelect = document.createElement('select');
            memoryCharacterSelect.title = 'Perchance character for ' + name + ' memories';
            memoryCharacterSelect.setAttribute('aria-label', name + ' Perchance character');
            Object.assign(memoryCharacterSelect.style, {
                marginLeft: 'auto', minWidth: '0', width: '55%',
                maxWidth: '220px', background: '#424242', color: '#fff',
                border: '1px solid #777', borderRadius: '5px',
                fontSize: '10px', padding: '4px'
            });
            memoryCharacterSelect.addEventListener('change', () => {
                const selected = characters.find(c => String(c.id) === memoryCharacterSelect.value);
                state['character' + name] = selected ? String(selected.id) : '';
                state['characterName' + name] = selected ? String(selected.name) : '';
                persist();
                const frame = memoryFrames.get(name);
                cancelMemoryReads(name);
                clearFrame(frame, selected ? 'Loading memories…' : 'Choose a character');
                if (selected) {
                    queueRead(frame);
                    
                }
            });
            frameHeader.append(collapseButton, nameLabel, memoryCharacterSelect);
            memorySelectors.push({ name, select: memoryCharacterSelect });
            const body = document.createElement('div');
            Object.assign(body.style, { padding: '7px', display: 'grid', gap: '7px' });
            const frameState = {
                name, select: memoryCharacterSelect, personal: null, extended: null,
                status: null, lastStrings: null, lastRead: 0,
                snapshot: null, draft: null, lastWriteOutcome: false, preview: null, draftPersonal: null,
                draftExtended: null, generateButton: null, saveButton: null
            };
            for (const field of ['Personal Memory', 'Extended Personal Memory']) {
                const group = document.createElement('div');
                Object.assign(group.style, { display: 'grid', gap: '4px', minWidth: '0' });
                const label = document.createElement('label');
                label.textContent = field;
                const textarea = document.createElement('textarea');
                textarea.setAttribute('aria-label', name + ' ' + field);
                textarea.placeholder = 'Choose a character';
                textarea.readOnly = true;
                textarea.rows = field === 'Personal Memory' ? 4 : 6;
                Object.assign(textarea.style, {
                    boxSizing: 'border-box', width: '100%', minWidth: '100px',
                    minHeight: '55px', resize: 'both', padding: '7px',
                    borderRadius: '5px', border: '1px solid #666',
                    background: '#1e1e1e', color: '#eee',
                    font: '12px/1.4 system-ui, sans-serif'
                });
                frameState[field === 'Personal Memory' ? 'personal' : 'extended'] = textarea;
                group.append(label, textarea);
                body.appendChild(group);
            }
            // Drafts are deliberately separate from the read-only stored fields.
            const actions = document.createElement('div');
            Object.assign(actions.style, { display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' });
            const mode = document.createElement('select');
            mode.setAttribute('aria-label', name + ' memory generation mode');
            for (const [value, label] of [['both', 'Both memories'], ['personal', 'Personal only'], ['extended', 'Extended only']]) {
                mode.appendChild(new Option(label, value));
            }
            const generateButton = document.createElement('button');
            generateButton.type = 'button';
            generateButton.textContent = 'Generate draft';
            const saveButton = document.createElement('button');
            saveButton.type = 'button';
            saveButton.textContent = 'Save approved';
            saveButton.disabled = true;
            for (const button of [generateButton, saveButton]) {
                Object.assign(button.style, { padding: '5px 7px', color: '#eee',
                    background: '#454545', border: '1px solid #777', borderRadius: '5px',
                    cursor: 'pointer' });
            }
            actions.append(mode, generateButton, saveButton);
            body.appendChild(actions);
            const preview = document.createElement('div');
            Object.assign(preview.style, { display: 'none', gap: '5px' });
            const draftPersonal = document.createElement('textarea');
            const draftExtended = document.createElement('textarea');
            for (const [field, textarea] of [['Personal draft', draftPersonal], ['Extended draft', draftExtended]]) {
                const label = document.createElement('label');
                label.textContent = field + ' (editable, NOT SAVED)';
                textarea.setAttribute('aria-label', name + ' ' + field);
                textarea.rows = field === 'Personal draft' ? 5 : 7;
                Object.assign(textarea.style, { boxSizing: 'border-box', width: '100%',
                    minHeight: '65px', resize: 'vertical', padding: '6px',
                    border: '1px solid #777', borderRadius: '5px',
                    background: '#202020', color: '#fff', font: '12px/1.4 system-ui, sans-serif' });
                preview.append(label, textarea);
            }
            body.appendChild(preview);
            Object.assign(frameState, { preview, draftPersonal, draftExtended, generateButton, saveButton });
            generateButton.addEventListener('click', () => requestMemoryWrite(frameState, 'generate', mode.value));
            saveButton.addEventListener('click', () => requestMemoryWrite(frameState, 'save', mode.value));
            const status = document.createElement('div');
            status.textContent = 'Choose a character';
            Object.assign(status.style, { fontSize: '10px', color: '#aaa' });
            frameState.status = status;
            body.appendChild(status);
            memoryFrames.set(name, frameState);
            frame.append(frameHeader, body);
            content.appendChild(frame);
            const key = 'collapsed' + name;
            function applyFrame() {
                body.style.display = state[key] ? 'none' : 'grid';
                collapseButton.textContent = state[key] ? '▸' : '▾';
                collapseButton.setAttribute('aria-expanded', String(!state[key]));
            }
            collapseButton.addEventListener('click', () => {
                state[key] = !state[key];
                persist();
                applyFrame();
            });
            applyFrame();
        }
        // Perchance memory writes use existing ferry-approved message types.
        // Every operation is manually initiated; generation never saves.
        function requestMemoryWrite(frame, action, mode) {
            const id = frame.select.value;
            if (!id || !bridgeReady || !bridgeWindow || bridgeWindow.closed) {
                setStatus(frame, 'Connect Perchance and select a character first', '#fca5a5');
                return;
            }
            const record = characters.find(c => String(c.id) === id);
            if (!record || String(record.name) !== String(state['characterName' + frame.name] || '')) {
                setStatus(frame, 'Character identity changed — reselect before continuing', '#fca5a5');
                return;
            }
            if ([...memoryWritePending.values()].some(p => p.frameName === frame.name)) return;
            // A pending read can arrive after Generate was clicked and mask the
            // actual failure with a normal "Read ... duplicate name" status.
            cancelMemoryReads(frame.name);
            frame.lastWriteOutcome = false;
            const requestId = crypto.randomUUID();
            const payload = { requestId, token: BRIDGE_TOKEN, characterId: Number(id) };
            if (action === 'generate') {
                const recentMessagesText = contextBox.value.trim();
                if (!recentMessagesText || recentMessagesText.length > MAX_RECENT_CHARS) {
                    setStatus(frame, 'Capture conversation input first (max ' + MAX_RECENT_CHARS + ' chars)', '#fca5a5');
                    return;
                }
                // The server uses stored card copies when previous fields are omitted.
                payload.type = 'nap-context-update';
                payload.memoryMode = mode;
                payload.recentMessagesText = recentMessagesText;
                frame.draft = null;
                frame.preview.style.display = 'none';
                frame.saveButton.disabled = true;
            } else {
                const draft = frame.draft;
                if (!draft || draft.id !== id || draft.mode !== mode) {
                    setStatus(frame, 'Generate a new draft for this mode first', '#fca5a5');
                    return;
                }
                const personal = frame.draftPersonal.value.trim();
                const extended = frame.draftExtended.value.trim();
                if ((draft.hasPersonal && !personal) || (draft.hasExtended && !extended)) {
                    setStatus(frame, 'Approved memory cannot be blank', '#fca5a5');
                    return;
                }
                if (!window.confirm('Save approved ' + frame.name + ' memory changes to Perchance?')) return;
                payload.type = 'nap-context-save';
                payload.memorySave = true;
                if (draft.hasPersonal) {
                    payload.personal = personal;
                    payload.expectedPreviousPersonal = draft.previousPersonal;
                }
                if (draft.hasExtended) {
                    payload.extended = extended;
                    payload.expectedPreviousExtended = draft.previousExtended;
                }
                if (draft.memVersion != null) payload.expectedVersion = draft.memVersion;
                frame.saveButton.disabled = true;
            }
            const timeout = setTimeout(() => {
                if (!memoryWritePending.has(requestId)) return;
                memoryWritePending.delete(requestId);
                frame.generateButton.disabled = false;
                frame.saveButton.disabled = true; // Unknown save outcome: re-read before retry.
                frame.draft = null;
                frame.lastWriteOutcome = true;
                setStatus(frame, 'TIMEOUT — outcome unknown; refresh memories before retrying', '#fca5a5');
            }, 180000);
            memoryWritePending.set(requestId, { frameName: frame.name, id, action, timeout });
            frame.generateButton.disabled = true;
            frame.saveButton.disabled = true;
            setStatus(frame, action === 'generate' ? 'Generating memory draft…' : 'Saving approved memories…', '#facc15');
            try { bridgeWindow.postMessage(payload, WRAPPER_ORIGIN); }
            catch (error) {
                clearTimeout(timeout);
                memoryWritePending.delete(requestId);
                frame.generateButton.disabled = false;
                frame.lastWriteOutcome = true;
                setStatus(frame, 'Bridge send failed: ' + String(error), '#fca5a5');
            }
        }
        function queueRead(frame, force = false) {
            const id = frame.select.value;
            if (!id || !bridgeReady || !bridgeWindow || bridgeWindow.closed) return;
            const record = characters.find(c => String(c.id) === id);
            if (!record || String(record.name) !== String(state['characterName' + frame.name] || '')) {
                frame.select.value = '';
                state['character' + frame.name] = '';
                state['characterName' + frame.name] = '';
                persist();
                clearFrame(frame, 'Identity changed — choose again');
                return;
            }
            // Background reads must never overwrite an active generation/save status.
            if ([...memoryWritePending.values()].some(item => item.frameName === frame.name)) return;
            if ([...memoryPending.values()].some(item => item.frameName === frame.name)) return;
            if (!force && Date.now() - frame.lastRead < 10000) return;
            frame.lastRead = Date.now();
            setStatus(frame, 'Reading Perchance…', '#facc15');
            readPerchanceMemory(frame.name, id);
        }
        memoryPanelApi = {
            writeResponse(name, id, action, data) {
                const frame = memoryFrames.get(name);
                if (!frame || frame.select.value !== id) return;
                frame.generateButton.disabled = false;
                frame.lastWriteOutcome = true;
                if (action === 'generate') {
                    const update = data.memoryUpdate;
                    if (!data.ok && !update) {
                        setStatus(frame, 'Generation failed: ' + String(data.error || 'unknown'), '#fca5a5');
                        return;
                    }
                    if (!update || (typeof update.personal !== 'string' && typeof update.extended !== 'string')) {
                        setStatus(frame, 'No memory generated: ' +
                            [update?.personalError, update?.extendedError, data.error].filter(Boolean).join('; '), '#fca5a5');
                        return;
                    }
                    const hasPersonal = typeof update.personal === 'string';
                    const hasExtended = typeof update.extended === 'string';
                    frame.draftPersonal.value = hasPersonal ? update.personal : '';
                    frame.draftExtended.value = hasExtended ? update.extended : '';
                    frame.draftPersonal.readOnly = !hasPersonal;
                    frame.draftExtended.readOnly = !hasExtended;
                    frame.preview.style.display = 'grid';
                    frame.draft = {
                        id, mode: data.memoryMode || (hasPersonal && hasExtended ? 'both' : hasPersonal ? 'personal' : 'extended'),
                        hasPersonal, hasExtended,
                        previousPersonal: String(update.previousPersonal ?? ''),
                        previousExtended: String(update.previousExtended ?? ''),
                        memVersion: Number.isFinite(Number(data.memVersion)) ? Number(data.memVersion) : null
                    };
                    frame.saveButton.disabled = false;
                    setStatus(frame, 'DRAFT ONLY — review before Save' +
                        (update.personalError ? ' · P: ' + update.personalError : '') +
                        (update.extendedError ? ' · E: ' + update.extendedError : ''), '#86efac');
                } else if (data.ok) {
                    frame.draft = null;
                    frame.preview.style.display = 'none';
                    frame.saveButton.disabled = true;
                    setStatus(frame, 'SAVED — refreshing stored memories…', '#86efac');
                    frame.lastRead = 0;
                    queueRead(frame, true);
                } else {
                    frame.draft = null;
                    frame.saveButton.disabled = true;
                    setStatus(frame, data.conflict ?
                        'CONFLICT — stored memory changed. Refresh and generate again; nothing overwritten.' :
                        'Save failed: ' + String(data.error || 'unknown'), '#fca5a5');
                }
            },
            snapshot(id, data) {
                for (const frame of memoryFrames.values()) {
                    if (frame.select.value !== id) continue;
                    cancelMemoryReads(frame.name);
                    this.response(frame.name, id, data);
                }
            },
            disconnected() {
                for (const frame of memoryFrames.values()) clearFrame(frame, 'Perchance disconnected');
            },
            response(name, id, data) {
                const frame = memoryFrames.get(name);
                if (!frame || frame.select.value !== id) return;
                if (!data.ok) {
                    const error = String(data.error || 'unknown');
                    if (error === 'no_character') {
                        frame.select.value = '';
                        state['character' + name] = '';
                        state['characterName' + name] = '';
                        persist();
                        clearFrame(frame, 'Character missing — choose again');
                        return;
                    }
                    if (frame.lastWriteOutcome) return;
                    setStatus(frame, 'Read failed: ' + error +
                        (data.retryable ? ' (retryable)' : ''), '#fca5a5');
                    return;
                }
                const record = characters.find(c => String(c.id) === id);
                if (!record || String(record.name) !== String(data.characterName) ||
                    String(record.name) !== String(state['characterName' + name] || '')) {
                    frame.select.value = '';
                    state['character' + name] = '';
                    state['characterName' + name] = '';
                    persist();
                    clearFrame(frame, 'Identity mismatch — choose again');
                    return;
                }
                if (typeof data.personal !== 'string' || typeof data.extended !== 'string') {
                    setStatus(frame, 'Unexpected memory response', '#fca5a5');
                    return;
                }
                frame.snapshot = data;
                // Successful polling updates stored text, but should not erase the
                // last Generate/Save outcome; leave it visible until user action.
                const keepOutcome = frame.lastWriteOutcome === true;
                if (!frame.lastStrings || frame.lastStrings.personal !== data.personal ||
                    frame.lastStrings.extended !== data.extended) {
                    frame.personal.value = data.personal;
                    frame.extended.value = data.extended;
                    frame.lastStrings = { personal: data.personal, extended: data.extended };
                }
                frame.personal.placeholder = 'Nothing stored yet';
                frame.extended.placeholder = 'Nothing stored yet';
                const stamp = x => x == null ? 'no stamp' : new Date(Number(x)).toLocaleTimeString();
                // Native defaults differ: personal runs unless "no";
                // extended runs only when explicitly "yes".
                const personalOff = data.personalEnabled === 'no' ? ' (updates off)' : '';
                const extendedOff = data.extendedEnabled === 'yes' ? '' : ' (updates off)';
                const duplicateName = characters.filter(c =>
                    String(c.name) === String(record.name)).length > 1;
                const identityWarning = duplicateName ?
                    ' · Duplicate name: verify character #' + id : '';
                if (keepOutcome) return;
                setStatus(frame, 'Read ' + new Date().toLocaleTimeString() +
                    ' · P: ' + data.personal.length + ' chars' + personalOff +
                    ' [' + stamp(data.personalUpdatedAt) + ']' +
                    ' · E: ' + data.extended.length + ' chars' + extendedOff +
                    ' [' + stamp(data.extendedUpdatedAt) + ']' + identityWarning,
                    duplicateName ? '#facc15' : '#86efac');
            }
        };
        window.addEventListener('alai-memory-character-roster-ready', refreshMemoryCharacters);
        refreshMemoryCharacters();
        setInterval(() => {
            for (const frame of memoryFrames.values()) queueRead(frame);
        }, 45000);
        window.addEventListener('focus', () => {
            for (const frame of memoryFrames.values()) queueRead(frame, true);
        });
        let dragging = null;
        header.addEventListener('pointerdown', e => {
            if (e.target === toggle || toggle.contains(e.target) || e.button !== 0) return;
            const rect = panel.getBoundingClientRect();
            dragging = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
            header.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        header.addEventListener('pointermove', e => {
            if (!dragging) return;
            const left = Math.max(0, Math.min(window.innerWidth - 60, dragging.left + e.clientX - dragging.x));
            const top = Math.max(0, Math.min(window.innerHeight - 35, dragging.top + e.clientY - dragging.y));
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
        function endDrag() {
            if (!dragging) return;
            dragging = null;
            state.left = panel.offsetLeft;
            state.top = panel.offsetTop;
            persist();
        }
        header.addEventListener('pointerup', endDrag);
        header.addEventListener('pointercancel', endDrag);
        new ResizeObserver(() => {
            if (!state.collapsed) {
                state.width = panel.offsetWidth;
                state.height = panel.offsetHeight;
                persist();
            }
        }).observe(panel);
        document.body.appendChild(panel);
        applyCollapsed();
    })();

})();
// ==UserScript==
// @name         ALAI Hotbuttons
// @namespace    https://chatgpt.com/
// @version      1.9.4k
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

    const commands = [
        {
            label: '📍 Scene State',
            prompt: "Alex, what's our current physical scene state? Tell me our location, clothing, positions, and activity. Preserve established details, and creatively invent anything missing to make the scene vivid and coherent."
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
        width: '270px',
        maxWidth: '270px',
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
    dragHandle.textContent = '⋮⋮  Alex and Aiko’s Hotbuttons (v1.9.4k)';

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

    toolbar.appendChild(dragHandle);

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
        toolbar.appendChild(
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

    toolbar.appendChild(contextLabel);
    toolbar.appendChild(captureStatus);
    toolbar.appendChild(contextBox);

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
            .map(entry => entry.text);

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

        contextBox.value = windowResult.text;
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
    let bridgeTimer = null;
    let bridgeAttempts = 0;
    let characters = [];
    let pendingRequestId = null;
    let autoUpdateQueued = false;
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
        '🧪 Test Context',
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

    testRow.appendChild(characterSelect);
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

    toolbar.appendChild(connectButton);
    toolbar.appendChild(bridgeStatus);
    toolbar.appendChild(testRow);

    toolbar.appendChild(resultLabel);
    toolbar.appendChild(previewStatus);
    toolbar.appendChild(resultBox);

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

    function connectPerchance() {
        stopBridgePolling();

        bridgeReady = false;
        bridgeAttempts = 0;
        pendingRequestId = null;
        autoUpdateQueued = false;
        lastAutoKey = '';
        characters = [];

        setTestEnabled(false);

        characterSelect.replaceChildren(
            new Option('Connect first', '')
        );

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

        if (pendingRequestId) {
            autoUpdateQueued = true;

            setPreviewStatus(
                'PROCESSING — newer reply queued',
                '#facc15'
            );

            return;
        }

        testContext(true);
    }

    // Shared manual and automatic updater.
    // isAuto=true: skip duplicate windows. Manual calls always send.

    function testContext(isAuto) {
        if (bridgeWindow && bridgeWindow.closed) {
            pendingRequestId = null;
            autoUpdateQueued = false;
            bridgeReady = false;
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

        if (pendingRequestId) return;

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
                previousBasic: resultBox.value,
                recentMessagesText
            },
            WRAPPER_ORIGIN
        );
    }

    // ============================================================
    // PERCHANCE MESSAGE HANDLER
    // ============================================================

    window.addEventListener('message', event => {
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

            characterSelect.value = '';

            setTestEnabled(
                characterSelect.options.length > 1 &&
                !pendingRequestId
            );

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
            pendingRequestId = null;

            setTestEnabled(
                bridgeReady &&
                characterSelect.options.length > 1
            );

            if (
                data.ok &&
                typeof data.basic === 'string'
            ) {
                resultBox.value = data.basic;

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

})();
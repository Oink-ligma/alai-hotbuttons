// ==UserScript==
// @name         ALAI Hotbuttons
// @namespace    https://chatgpt.com/
// @version      1.12.7
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
    dragHandle.textContent = '⋮⋮  Alex and Aiko’s Hotbuttons (v1.12.7)';

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

    // Copy controls only; no effect on context processing or memory storage.
    function makeCopyIcon(title, getText) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = '⧉'; b.title = title;
        b.setAttribute('aria-label', title);
        Object.assign(b.style, { marginLeft:'auto', padding:'2px 7px', flexShrink:'0',
            border:'1px solid #777', borderRadius:'5px', background:'#424242',
            color:'#eee', cursor:'pointer', fontSize:'13px', lineHeight:'18px' });
        b.addEventListener('pointerdown', e => e.stopPropagation());
        b.addEventListener('click', async e => {
            e.stopPropagation();
            try {
                const value = getText();
                if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
                else {
                    const t = document.createElement('textarea');
                    t.value = value; t.style.cssText = 'position:fixed;left:-9999px;top:0;';
                    document.body.appendChild(t); t.select();
                    const ok = document.execCommand('copy'); t.remove();
                    if (!ok) throw Error('Clipboard unavailable');
                }
                b.textContent = '✓'; setTimeout(() => { b.textContent = '⧉'; }, 1200);
            } catch (error) {
                b.textContent = '!'; console.warn('[ALAI] Copy failed:', error);
                setTimeout(() => { b.textContent = '⧉'; }, 2000);
            }
        });
        return b;
    }
    function copyBundle(entries) {
        return entries.map(([label, box]) => label + '\n' + box.value).join('\n\n');
    }
    function copyRow(label, button) {
        const row = document.createElement('div');
        Object.assign(row.style, { display:'flex', alignItems:'center', gap:'6px', minWidth:'0' });
        label.style.flex = '1'; label.style.minWidth = '0';
        row.append(label, button); return row;
    }
    // Context Memories has its own movable, resizable window.
    // Hotbuttons retains only Bill's composer shortcuts.
    const CONTEXT_PANEL_KEY = 'alai-context-memories-panel-v1';
    let contextPanelState = {};
    try { contextPanelState = JSON.parse(localStorage.getItem(CONTEXT_PANEL_KEY)) || {}; } catch (_) {}
    function persistContextPanel() {
        try { localStorage.setItem(CONTEXT_PANEL_KEY, JSON.stringify(contextPanelState)); } catch (_) {}
    }
    const contextPanel = document.createElement('div');
    contextPanel.id = 'alai-context-memories-panel';
    Object.assign(contextPanel.style, {
        position: 'fixed', left: '20px', top: '110px', zIndex: '9998',
        width: (Number(contextPanelState.width) || 350) + 'px',
        height: (Number(contextPanelState.height) || 420) + 'px',
        minWidth: '270px', minHeight: '45px', maxWidth: '95vw', maxHeight: '90vh',
        resize: 'both', overflow: 'auto', boxSizing: 'border-box',
        background: '#292929', color: '#eee', border: '1px solid #666',
        borderRadius: '9px', boxShadow: '0 4px 18px #0005', padding: '7px',
        font: '12px system-ui, sans-serif'
    });
    if (Number.isFinite(contextPanelState.left) && Number.isFinite(contextPanelState.top)) {
        contextPanel.style.left = contextPanelState.left + 'px';
        contextPanel.style.top = contextPanelState.top + 'px';
    }
    const contextPanelHeader = document.createElement('div');
    Object.assign(contextPanelHeader.style, {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#383838', borderRadius: '6px', padding: '6px',
        cursor: 'move', userSelect: 'none', touchAction: 'none', fontWeight: 'bold'
    });
    const contextPanelTitle = document.createElement('span');
    contextPanelTitle.textContent = '⋮⋮  Alex & Aiko — Context Memories (v1.12.7)';
    const contextPanelToggle = document.createElement('button');
    contextPanelToggle.type = 'button';
    contextPanelToggle.title = 'Collapse or expand Context Memories';
    Object.assign(contextPanelToggle.style, {
        color: '#eee', background: 'transparent', border: 0, cursor: 'pointer', fontSize: '15px'
    });
    const contextCopyAll = makeCopyIcon('Copy all Context Memories', () => copyBundle([
        ['Conversation Input', contextBox], ['Context Information', resultBox], ['Detailed Context', detailedBox]
    ]));
    contextPanelTitle.style.flex = '1';
    contextPanelHeader.append(contextPanelTitle, contextCopyAll, contextPanelToggle);
    contextPanel.appendChild(contextPanelHeader);
    const contextPanelContent = document.createElement('div');
    Object.assign(contextPanelContent.style, {
        paddingTop: '7px', display: 'flex', flexDirection: 'column', gap: '7px'
    });
    contextPanel.appendChild(contextPanelContent);
    function applyContextPanelCollapse() {
        contextPanelContent.style.display = contextPanelState.collapsed ? 'none' : 'flex';
        contextPanelToggle.textContent = contextPanelState.collapsed ? '▸' : '▾';
        contextPanel.style.resize = contextPanelState.collapsed ? 'horizontal' : 'both';
        contextPanel.style.height = contextPanelState.collapsed ? 'auto' :
            (Number(contextPanelState.height) || 420) + 'px';
    }
    contextPanelToggle.addEventListener('pointerdown', e => e.stopPropagation());
    contextPanelToggle.addEventListener('click', () => {
        contextPanelState.collapsed = !contextPanelState.collapsed;
        persistContextPanel();
        applyContextPanelCollapse();
    });
    let contextDragging = null;
    contextPanelHeader.addEventListener('pointerdown', e => {
        if (e.target === contextPanelToggle || e.button !== 0) return;
        const rect = contextPanel.getBoundingClientRect();
        contextDragging = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
        contextPanelHeader.setPointerCapture(e.pointerId);
        e.preventDefault();
    });
    contextPanelHeader.addEventListener('pointermove', e => {
        if (!contextDragging) return;
        contextPanel.style.left = Math.max(0, Math.min(window.innerWidth - 60,
            contextDragging.left + e.clientX - contextDragging.x)) + 'px';
        contextPanel.style.top = Math.max(0, Math.min(window.innerHeight - 35,
            contextDragging.top + e.clientY - contextDragging.y)) + 'px';
    });
    function endContextDrag() {
        if (!contextDragging) return;
        contextDragging = null;
        contextPanelState.left = contextPanel.offsetLeft;
        contextPanelState.top = contextPanel.offsetTop;
        persistContextPanel();
    }
    contextPanelHeader.addEventListener('pointerup', endContextDrag);
    contextPanelHeader.addEventListener('pointercancel', endContextDrag);
    new ResizeObserver(() => {
        if (!contextPanelState.collapsed) {
            contextPanelState.width = contextPanel.offsetWidth;
            contextPanelState.height = contextPanel.offsetHeight;
            persistContextPanel();
        }
    }).observe(contextPanel);
    document.body.appendChild(contextPanel);
    applyContextPanelCollapse();

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
    let bridgeTimer = null;
    let bridgeAttempts = 0;
    let characters = [];
    // Publish the bridge roster for the independent Personal Memories frame selectors.
    function publishMemoryRoster(ready) {
        window.dispatchEvent(new CustomEvent('alai-memory-roster', {
            detail: { ready, characters: ready ? characters.map(c => ({ id: String(c.id), name: String(c.name) })) : [] }
        }));
    }
    let pmPending = null, pmHandler = null;
    let pendingRequestId = null;
    let detailedPending = null;
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
    const conversationCopyRow = copyRow(captureStatus, makeCopyIcon('Copy Conversation Input', () => contextBox.value));
    const conversationSection = section('Conversation Input', 'conversationCollapsed', [conversationCopyRow, contextBox, bridgeStatus], [connectionLight, connectIcon, characterAnchor], captureLight, captureTimer.label);
    contextPanelContent.appendChild(conversationSection);
    testButton.textContent = '↻'; testButton.title = 'Refresh Context Information';
    const basicLight = document.createElement('span');
    basicLight.textContent = '●'; basicLight.title = 'Context update status';
    contextPanelContent.appendChild(section('Context Information', 'basicCollapsed', [copyRow(previewStatus, makeCopyIcon('Copy Context Information', () => resultBox.value)), resultBox], [testButton], basicLight, basicTimer.label));

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
    contextPanelContent.appendChild(section('Detailed Context', 'detailedCollapsed', [copyRow(detailedStatus, makeCopyIcon('Copy Detailed Context', () => detailedBox.value)), detailedBox], [detailedTestButton, detailedGenerateButton], detailedLight, detailedTimer.label));

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
    contextPanelContent.appendChild(section('Outgoing Injection', 'injectionCollapsed', [injectionLabel, injectionStatus]));

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
        const data = { requestId, token: BRIDGE_TOKEN, characterId };
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

    function connectPerchance() {
        stopBridgePolling();

        bridgeReady = false;
        bridgeAttempts = 0;
        pendingRequestId = null;
        autoUpdateQueued = false;
        detailedAutoQueued = false;
        lastDetailedAutoKey = '';
        lastAutoKey = '';
        resetDetailed();
        characters = [];
        publishMemoryRoster(false);

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

        if (data.type === 'nap-context-result' && pmPending && data.requestId === pmPending.id) {
            const pending = pmPending; pmPending = null; clearTimeout(pending.timer);
            if (pmHandler) pmHandler(pending, data);
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
            publishMemoryRoster(true);

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
    // PERSONAL MEMORY PANEL — v1.12.7 BASE UI ONLY
    // Separate from the existing Hotbuttons panel. The four text
    // areas are local drafts; NO Perchance read/write occurs here.
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
        title.textContent = '⋮⋮  Alex & Aiko — Personal Memories (v1.12.7)';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.title = 'Collapse or expand memory panel';
        Object.assign(toggle.style, {
            color: '#eee', background: 'transparent', border: 0,
            cursor: 'pointer', fontSize: '15px'
        });
        const personalCopyAll = makeCopyIcon('Copy all Personal Memories', () => copyBundle([
            ['Alex — Personal Memory', frames.Alex.textareas.personal],
            ['Alex — Extended Personal Memory', frames.Alex.textareas.extended],
            ['Aiko — Personal Memory', frames.Aiko.textareas.personal],
            ['Aiko — Extended Personal Memory', frames.Aiko.textareas.extended]
        ]));
        title.style.flex = '1';
        header.append(title, personalCopyAll, toggle);
        panel.appendChild(header);
        const content = document.createElement('div');
        Object.assign(content.style, { paddingTop: '7px', display: 'grid', gap: '7px' });
        panel.appendChild(content);
        const frameSelectors = [];
        let liveRoster = [];
        let rosterReady = false;
        const ASSIGNMENTS_KEY = 'alai-personal-memory-character-assignments-v1';
        let assignments = {};
        try { assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY)) || {}; } catch (_) {}
        function saveAssignments() {
            try { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)); } catch (_) {}
        }
        function refreshSelectors() {
            for (const { name, select, status } of frameSelectors) {
                const saved = assignments[name];
                select.replaceChildren(new Option(rosterReady ? 'Select character...' : 'Connect Perchance first', ''));
                for (const character of liveRoster) {
                    select.add(new Option(character.name + ' (#' + character.id + ')', character.id));
                }
                select.disabled = !rosterReady;
                const valid = saved && liveRoster.some(c => c.id === saved.id && c.name === saved.name);
                select.value = valid ? saved.id : '';
                status.textContent = !rosterReady ? 'Waiting for bridge roster' :
                    valid ? 'Assigned: ' + saved.name + ' (#' + saved.id + ')' :
                    saved ? 'Saved character mismatch — select again' : 'Choose a character';
                status.style.color = valid ? '#86efac' : '#facc15';
            }
        }
        window.addEventListener('alai-memory-roster', event => {
            rosterReady = event.detail?.ready === true;
            liveRoster = rosterReady && Array.isArray(event.detail.characters) ?
                event.detail.characters.filter(c => c && c.id && c.name) : [];
            refreshSelectors();
        });
        const MEMORY_KEY = 'alai-personal-memory-canon-v1';
        let canon = {};
        try { canon = JSON.parse(localStorage.getItem(MEMORY_KEY)) || {}; } catch (_) {}
        const frames = {};
        const record = n => canon[n] || (canon[n] = { personal: '', extended: '' });
        const store = () => { try { localStorage.setItem(MEMORY_KEY, JSON.stringify(canon)); return true; } catch (_) { alert('Memory save failed'); return false; } };
        const status = (n, msg) => { if (frames[n]) frames[n].status.textContent = msg; };
        const enable = () => { for (const [n,f] of Object.entries(frames)) {
            const a = assignments[n]; f.generate.disabled = !!pmPending || !bridgeReady || !rosterReady ||
                !a || !liveRoster.some(c => c.id === a.id && c.name === a.name);
        }};
        const notice = document.createElement('div');
        notice.textContent = 'Personal and Extended memories update automatically and save locally.';
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
        for (const name of ['Alex', 'Aiko']) {
            const frame = document.createElement('section');
            Object.assign(frame.style, {
                border: '1px solid #555', borderRadius: '7px',
                overflow: 'hidden', minWidth: '0'
            });
            const frameHeader = document.createElement('button');
            frameHeader.type = 'button';
            Object.assign(frameHeader.style, {
                width: '100%', textAlign: 'left', padding: '7px',
                background: '#383838', color: '#eee', border: 0,
                cursor: 'pointer', fontWeight: 'bold'
            });
            const frameHeading = document.createElement('div');
            Object.assign(frameHeading.style, { display:'flex', alignItems:'center', background:'#383838' });
            frameHeader.style.flex = '1';
            const characterCopyAll = makeCopyIcon('Copy all ' + name + ' memories', () => copyBundle([
                [name + ' — Personal Memory', textareas.personal],
                [name + ' — Extended Personal Memory', textareas.extended]
            ]));
            characterCopyAll.style.marginRight = '7px';
            const refreshMemories = document.createElement('button');
            refreshMemories.type = 'button';
            refreshMemories.textContent = '↻';
            refreshMemories.title = 'Refresh ' + name + ' Personal and Extended Memories through Perchance';
            refreshMemories.setAttribute('aria-label', refreshMemories.title);
            Object.assign(refreshMemories.style, {
                padding:'2px 7px', flexShrink:'0', border:'1px solid #777',
                borderRadius:'5px', background:'#424242', color:'#eee',
                cursor:'pointer', fontSize:'16px', lineHeight:'18px', marginRight:'6px'
            });
            refreshMemories.addEventListener('pointerdown', e => e.stopPropagation());
            refreshMemories.addEventListener('click', e => {
                e.stopPropagation();
                frames[name].run();
            });
            frameHeading.append(frameHeader, refreshMemories, characterCopyAll);
            const body = document.createElement('div');
            Object.assign(body.style, { padding: '7px', display: 'grid', gap: '7px' });
            const selectorGroup = document.createElement('div');
            Object.assign(selectorGroup.style, { display: 'grid', gap: '4px' });
            const selectorLabel = document.createElement('label');
            selectorLabel.textContent = 'Processing character';
            const selector = document.createElement('select');
            selector.setAttribute('aria-label', name + ' processing character');
            Object.assign(selector.style, {
                width: '100%', minWidth: '0', boxSizing: 'border-box', padding: '6px',
                background: '#424242', color: '#eee', border: '1px solid #777', borderRadius: '5px'
            });
            const assignmentStatus = document.createElement('div');
            assignmentStatus.style.cssText = 'font-size:10px;color:#facc15;';
            selectorGroup.append(selectorLabel, selector, assignmentStatus);
            body.appendChild(selectorGroup);
            frameSelectors.push({ name, select: selector, status: assignmentStatus });
            selector.addEventListener('change', () => {
                const selected = liveRoster.find(c => c.id === selector.value);
                if (selected) assignments[name] = { id: selected.id, name: selected.name };
                else delete assignments[name];
                saveAssignments();
                refreshSelectors();
            });
            const textareas = {};
            for (const field of ['Personal Memory', 'Extended Personal Memory']) {
                const group = document.createElement('div');
                Object.assign(group.style, { display: 'grid', gap: '4px', minWidth: '0' });
                const label = document.createElement('label');
                label.textContent = field;
                const textarea = document.createElement('textarea');
                textarea.setAttribute('aria-label', name + ' ' + field);
                const slot = field === 'Personal Memory' ? 'personal' : 'extended';
                textarea.value = record(name)[slot] || '';
                textarea.placeholder = 'Locally stored memory';
                textareas[slot] = textarea;
                textarea.addEventListener('input', () => {
                    const rec = record(name), old = rec[slot]; rec[slot] = textarea.value;
                    if (!store()) rec[slot] = old;
                });
                textarea.rows = field === 'Personal Memory' ? 4 : 6;
                Object.assign(textarea.style, {
                    boxSizing: 'border-box', width: '100%', minWidth: '100px',
                    minHeight: '55px', resize: 'both', padding: '7px',
                    borderRadius: '5px', border: '1px solid #666',
                    background: '#1e1e1e', color: '#eee',
                    font: '12px/1.4 system-ui, sans-serif'
                });
                group.append(copyRow(label, makeCopyIcon('Copy ' + name + ' ' + field, () => textarea.value)), textarea);
                body.appendChild(group);
            }
            const generate = document.createElement('button'); generate.type = 'button'; generate.textContent = 'Automatic memory processing'; generate.hidden = true;
            const resultStatus = document.createElement('div'); resultStatus.style.color = '#facc15';
            const drafts = document.createElement('div'); drafts.style.cssText = 'display:grid;gap:6px;';
            body.append(resultStatus);
            frames[name] = { textareas, generate, status: resultStatus, drafts };
            const runMemory = () => {
                const a = assignments[name];
                if (!bridgeReady || !rosterReady || !bridgeWindow || bridgeWindow.closed || !a ||
                    !liveRoster.some(c => c.id === a.id && c.name === a.name)) return status(name,'Connect and validate character first');
                if (pmPending || pendingRequestId || detailedPending) return status(name,'Bridge busy; retry later');
                const recentMessagesText = contextBox.value.trim();
                if (!recentMessagesText || recentMessagesText.length > 30000) return status(name,'Conversation Input must be 1–30,000 chars');
                const previousPersonal = textareas.personal.value, previousExtended = textareas.extended.value;
                if (previousPersonal.length > 20000 || previousExtended.length > 20000) return status(name,'Previous memory too long');
                const id = crypto.randomUUID(); drafts.replaceChildren();
                pmPending = { id, name, assignment: { ...a }, sourceKey: autoWindowKey(a.id, recentMessagesText) };
                pmPending.timer = setTimeout(() => {
                    if (pmPending && pmPending.id === id) { pmPending = null; status(name,'Timeout; memory unchanged'); enable(); }
                },180000);
                enable(); status(name,'Processing; memory unchanged');
                try {
                    bridgeWindow.postMessage({ type:'nap-context-update', requestId:id, token:BRIDGE_TOKEN,
                        characterId:Number(a.id), memoryMode:'both', previousPersonal,
                        previousExtended, recentMessagesText },WRAPPER_ORIGIN);
                } catch(e) { clearTimeout(pmPending.timer); pmPending=null; status(name,'Send failed: '+e.message); enable(); }
            };
            frames[name].run = runMemory;
            frame.append(frameHeading, body);
            content.appendChild(frame);
            const key = 'collapsed' + name;
            function applyFrame() {
                body.style.display = state[key] ? 'none' : 'grid';
                frameHeader.textContent = (state[key] ? '▸  ' : '▾  ') + name;
                frameHeader.setAttribute('aria-expanded', String(!state[key]));
            }
            frameHeader.addEventListener('click', () => {
                state[key] = !state[key];
                persist();
                applyFrame();
            });
            applyFrame();
        }
        const completed = {};
        const queued = {};
        let processingTimer = null;
        function scheduleMemory() {
            clearTimeout(processingTimer);
            processingTimer = setTimeout(processMemoryQueue, 1500);
        }
        function processMemoryQueue() {
            if (!bridgeReady || !rosterReady || !bridgeWindow || bridgeWindow.closed) return;
            if (pmPending || pendingRequestId || detailedPending) { scheduleMemory(); return; }
            const recent = contextBox.value.trim();
            if (!recent || recent.length > 30000) return;
            for (const name of ['Alex', 'Aiko']) {
                const a = assignments[name];
                if (!a || !liveRoster.some(c => c.id === a.id && c.name === a.name)) continue;
                const key = autoWindowKey(a.id, recent);
                if (completed[name] === key || queued[name] === key) continue;
                queued[name] = key;
                frames[name].run();
                if (pmPending) return;
                delete queued[name];
            }
        }
        // Automatic Personal Memory requests paused to protect Context processing.
        pmHandler = (pending, data) => {
            const f = frames[pending.name], a = assignments[pending.name];
            if (!a || !rosterReady || !liveRoster.some(c => c.id === a.id && c.name === a.name) ||
                a.id !== pending.assignment.id || a.name !== pending.assignment.name ||
                String(data.characterId) !== a.id ||
                (data.characterName && String(data.characterName) !== a.name)) {
                status(pending.name, 'Character mismatch; result rejected');
                delete queued[pending.name]; enable(); scheduleMemory(); return;
            }
            let count = 0;
            const rec = record(pending.name);
            const old = { personal: rec.personal, extended: rec.extended };
            for (const slot of ['personal', 'extended']) {
                if (typeof data[slot] !== 'string' || !data[slot].trim()) continue;
                rec[slot] = data[slot];
                count++;
            }
            if (count && store()) {
                for (const slot of ['personal', 'extended']) f.textareas[slot].value = rec[slot] || '';
                completed[pending.name] = pending.sourceKey;
                status(pending.name, count + ' memory fields updated locally' +
                    (data.personalError ? '; ' + data.personalError : '') +
                    (data.extendedError ? '; ' + data.extendedError : ''));
            } else {
                rec.personal = old.personal; rec.extended = old.extended;
                status(pending.name, 'No usable memory returned; existing text preserved' +
                    (data.error ? ': ' + data.error : ''));
                // Avoid hammering a failing processor on an unchanged conversation.
                completed[pending.name] = pending.sourceKey;
            }
            delete queued[pending.name];
            enable(); scheduleMemory();
        };
        refreshSelectors(); enable();
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
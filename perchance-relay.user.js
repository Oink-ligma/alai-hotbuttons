// ==UserScript==
// @name         ALAI Perchance Relay
// @namespace    https://perchance.org/
// @version      1.0.1
// @description  Relays authenticated bridge messages between ChatGPT and the Perchance generator
// @match        https://perchance.org/l99sbhokca*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Oink-ligma/alai-hotbuttons/main/perchance-relay.user.js
// @downloadURL  https://raw.githubusercontent.com/Oink-ligma/alai-hotbuttons/main/perchance-relay.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.__alexPerchanceRelayInstalled) return;
    window.__alexPerchanceRelayInstalled = true;

    const CHATGPT_ORIGINS = new Set([
        'https://chatgpt.com',
        'https://www.chatgpt.com',
        'https://chat.openai.com'
    ]);

    const INNER_ORIGIN =
        'https://b0db7d90c2834ef417352b30f0cb8da7.perchance.org';

    const REQUEST_TYPES = new Set([
        'nap-tm-hello',
        'nap-context-update',
        'nap-bridge-ping'
    ]);

    const RESPONSE_TYPES = new Set([
        'nap-bridge-ready',
        'nap-context-result',
        'nap-bridge-pong',
        'nap-bridge-ready-announce'
    ]);

    let generatorFrame = null;
    let authenticatedOpenerOrigin = null;

    function findGeneratorFrame() {
        const frames = [...document.querySelectorAll('iframe')];

        return frames.find(frame => {
            try {
                const url = new URL(frame.src, location.href);
                return url.origin === INNER_ORIGIN;
            } catch {
                return false;
            }
        }) || null;
    }

    function refreshFrame() {
        const found = findGeneratorFrame();

        if (found && found !== generatorFrame) {
            generatorFrame = found;
            console.log('[Alex Relay] Generator iframe found.');
        }

        if (!found) generatorFrame = null;
    }

    function isPlainMessage(data) {
        return data !== null &&
            typeof data === 'object' &&
            !Array.isArray(data) &&
            typeof data.type === 'string';
    }

    window.addEventListener('message', event => {
        if (!isPlainMessage(event.data)) return;

        refreshFrame();

        // ChatGPT opener -> Perchance generator
        if (
            CHATGPT_ORIGINS.has(event.origin) &&
            window.opener &&
            event.source === window.opener &&
            REQUEST_TYPES.has(event.data.type)
        ) {
            authenticatedOpenerOrigin = event.origin;

            if (!generatorFrame?.contentWindow) {
                console.warn('[Alex Relay] Generator iframe not found.');
                return;
            }

            generatorFrame.contentWindow.postMessage(
                event.data,
                INNER_ORIGIN
            );

            console.log('[Alex Relay] Forwarded:', event.data.type);
            return;
        }

        // Perchance generator -> ChatGPT opener
        if (
            event.origin === INNER_ORIGIN &&
            generatorFrame?.contentWindow &&
            event.source === generatorFrame.contentWindow &&
            RESPONSE_TYPES.has(event.data.type)
        ) {
            if (!window.opener || !authenticatedOpenerOrigin) return;

            window.opener.postMessage(
                event.data,
                authenticatedOpenerOrigin
            );

            console.log('[Alex Relay] Returned:', event.data.type);
        }
    });

    refreshFrame();

    const frameWatcher = new MutationObserver(refreshFrame);
    frameWatcher.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log('[Alex Relay] Installed on Perchance wrapper.');
})();

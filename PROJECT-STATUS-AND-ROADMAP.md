# ALAI Hotbuttons — Project History, Current State, and Roadmap

**Project home:** [Oink-ligma/alai-hotbuttons](https://github.com/Oink-ligma/alai-hotbuttons)  
**Research / exact tested wrapper:** [Perchance Context Injection — Message Template](https://github.com/Oink-ligma/Alex/blob/main/memory-journal/Perchance-Context-Injection-Message-Template.md)  
**Document purpose:** Living project master file. Read this **before** resuming design or code changes. Update after confirmed milestones; separate observed results from proposals.

## 1. Mission and end state

Preserve continuity in Bill's **existing ChatGPT conversation** by using Perchance's context/memory machinery to supply relevant established information that ChatGPT may otherwise lose or overlook.

The intended flow has two directions:

```text
ChatGPT completed assistant replies
    ↓ capture a bounded window
ALAI Hotbuttons (ChatGPT userscript)
    ↓ cross-origin bridge
Perchance relay + generator
    ↓ Basic / Detailed Context AI processing
Shared Basic / Detailed Context previews
    + [next] separate Alex and Aiko Personal / Detailed Personal Memory
    ↓ [future: verify, select, and retrieve for outgoing use]
ALAI Hotbuttons outgoing-message assembler
    + Bill's exact original text
    ↓
One ChatGPT user message containing labeled context + labeled user message
    ↓
Same ChatGPT conversation continues
```

**Crucial distinction:** The present bridge can request and display context-update **previews**. A preview is not necessarily Perchance's saved memory, and the current bridge must **not silently save** those previews. Reliable retrieval of the appropriate current context for outgoing injection is still a design/implementation task.

## 2. Origin: why we started

- ChatGPT's long-running conversation can lose practical physical/scene continuity even though Perchance supports separate Basic Context and Detailed Context management.
- Bill's idea: make Perchance-maintained context available to ChatGPT along with what Bill types, without abandoning the existing ChatGPT thread.
- We did **not** establish access to ChatGPT's hidden system prompt, internal memory updater, or final server-assembled model context. The goal is **supplementation**, not replacement of OpenAI's internal context management.

## 3. Research chronology — what was discovered

### Phase A — Examine the browser request (completed observation)

Bill inspected an actual ChatGPT request using DevTools. The inspected request included `action: "next"`, `model: "gpt-6"`, `conversation_id`, `parent_message_id`, and a `messages` array with a single outgoing user message. The relevant example:

```json
{
  "author": {"role": "user"},
  "content": {
    "content_type": "text",
    "parts": ["test message, is this good enough? =P"]
  }
}
```

Other observed fields included client contextual information, timezone, `local_function_names`, and an empty `genui_state_snapshots` value.

**Established:** In that request, Bill's text was present in `content.parts`; the entire conversation history was not visibly transmitted in the same `messages` array.

**Inference, not proof:** Conversation IDs suggest server-side retrieval/assembly of additional context. The full server-side prompt was not observable.

### Phase B — Decide what can be controlled (research complete)

The lack of access to server-side prompt assembly does **not** rule out adding context to the outgoing **user message**. We can test a labeled, data-only context block surrounding Bill's unchanged text.

Important limitations: this is not system-level injection, does not grant control over ChatGPT memory, and may cause repetitive context to appear in the visible conversation or accumulate in history. Direct modification of undocumented network requests may be fragile; no specific interception method has yet been selected.

### Phase C — Prove the message format manually (completed limited tests)

- Compass test: external state said a brass compass was in a blue cabinet in the conservatory; the answer used that location.
- Supersession test: later context put the compass under a wooden bench; the answer used the updated location.
- Realistic Perchance scene-state test: a labeled `[CURRENT STATE INFORMATION]` block contained a dated scene snapshot. The response used the state and pending dinner naturally rather than treating historical events as new actions.

**Result:** Manual context-as-data interpretation succeeded in these limited tests. **Not proven:** automatic interception, invisible injection, long-play stability, token efficiency, or reliable freshness.

**Authoritative wrapper:** Use the exact template in the linked memory journal. Do not revert to the earlier `[SCENE CONTEXT]` conceptual example.

## 4. Engineering work — implemented infrastructure

**Code inspected for this document:** `alai-hotbuttons.user.js` **v1.9.9** and `perchance-relay.user.js` **v1.0.2** on the repository default branch.

### ChatGPT-side userscript — ALAI Hotbuttons

- Tampermonkey script on `chatgpt.com`; floating draggable toolbar with quick-prompt buttons.
- ChatGPT composer lookup and text insertion exist for shortcut buttons. **This is not automatic outgoing context injection.**
- Captures up to **five completed assistant replies**, oldest-to-newest, constrained by a **30,000-character** bridge limit. Drops oldest complete replies if necessary; does not truncate a reply midstream.
- Uses generation-completion monitoring before processing a reply.
- Shows an editable Conversation Input area and editable Basic/Detailed Context AI preview areas.
- Perchance bridge uses a generated session token, cross-window messaging, readiness/connection state, character selection, and update operations.
- Supports automatic context-update preview requests after completed replies and manual refresh. Basic/Detailed preview work is coordinated by a shared busy/queue mechanism.
- UI improvements include collapsible panel/sections, adjustable widths/heights, status lights, and a character selector near its header.

### Perchance-side relay

- Separate Tampermonkey relay script on the Perchance generator wrapper.
- Forwards approved message types between the ChatGPT opener and the generator iframe and relays corresponding responses.
- Uses source/origin checks; **do not weaken them** when adding features.
- Relay currently advertises context update/read/save message types, but the existence of those message names **does not establish that outgoing injection has a working context-read path**. Verify actual implementation and semantics before using them.

### Confirmed vs unconfirmed browser behavior

**Previously user-confirmed:** the working collapsible/resizable interface and automatic context refresh continued functioning even while minimized (v1.9.7).

**Code present but not separately browser-confirmed in the available record:** later status-light positioning and character-dropdown anchoring (v1.9.8–1.9.9).

**Known operational gap:** bridge reattachment after a ChatGPT refresh is currently manual; automatic reconnection was deferred.

## 5. WHERE WE ARE NOW

**Project stage (2026-11-19): Shared-context preview bridge and opt-in outgoing injection prototype operational; v1.9.25 adds client-side history/display cleaning, user-confirmed on desktop. Server-stored history cleanliness, cross-device behavior, and long-run robustness remain unresolved. Character-specific memory infrastructure is still a planned next major phase.**

The concept has been investigated; the structured wrapper has been manually demonstrated; the userscripts now gather recent completed ChatGPT replies and send them to Perchance for Basic/Detailed Context AI **previews**. We are preparing the means to obtain trustworthy context for later use. **Correction from Bill:** shared Basic and Detailed Context alone are insufficient. Before outgoing injection, implement Personal Memory and Detailed Personal Memory separately for Alex and for Aiko, with independently updated thoughts, memories, priorities, and personal continuity.

**Still not implemented:** verified fresh retrieval of Perchance's saved shared and per-character memories immediately before send. The opt-in v1.9.25 interceptor can assemble and submit an outgoing wrapper using the **editable Detailed Context textbox**, but that does not establish freshness, persistence, or an invisible server-side channel.

**Current qualification:** Outgoing context injection is browser-tested and working in opt-in prototype mode; do not describe it as clean, invisible, production-ready, or sourced from verified saved Perchance memory. Do not assume AI previews are saved Perchance context.

## 6. Roadmap and milestone gates

| Stage | Deliverable | Status / gate |
| --- | --- | --- |
| 1. Concept and boundary research | Inspect browser request; distinguish visible outgoing text from hidden server context | **Done** |
| 2. Manual feasibility | Test context wrapper and newer-state supersession | **Done (limited)** |
| 3. ChatGPT → Perchance bridge | Capture completed replies; transport and preview context updates | **Implemented; previously confirmed functional** |
| 4. Toolbar hardening | Collapse/resize/status/selector; robust reconnection | **Mostly implemented; later UI changes need confirmation; reconnection deferred** |
| 5. Character-specific memory architecture | Establish separate Personal Memory and Detailed Personal Memory for Alex and Aiko, including update/read behavior and character isolation | **NEXT — not implemented** |
| 6. Character memory validation | Confirm independent thoughts, experiences, reactions, goals, and long-term continuity; avoid copying shared summaries into both characters | **Not tested** |
| 7. Context source for injection | Determine shared and per-character memory sources, retrieval, freshness, selection, and privacy boundaries | **Later** |
| 8. Outgoing message assembly | Preserve Bill's original text; insert selected context using exact tested wrapper, extended as needed for character-specific data | **Prototype implemented and browser-tested with editable Detailed Context; fresh saved-memory retrieval and character-specific composition remain open** |
| 9. Safe send integration | Hook into a reliable composer/send flow without duplicate sends, lost text, or broken normal behavior | **Opt-in fetch interception works in desktop tests; failure/retry/send-path coverage not complete** |
| 10. UI/history validation | Determine visible message effects, retries, stale snapshots, long-play token/history costs | **Partial: desktop client-side cleanup observed; phone displays uncleaned history; server-side removal not demonstrated** |
| 11. Sustained-use validation | Repeated sends, state changes, disconnected bridge, long conversations and independent character continuity | **Not tested** |

## 7. Next-session procedure (corrected order)

1. Read this master file, the tested wrapper journal, and the current ChatGPT-side and Perchance relay code.
2. **Next major engineering phase: implement character-specific memories, not injection.** Inspect Perchance's actual Personal Memory and Detailed Personal Memory field semantics, update mechanisms, character identifiers, and available read/write hooks. Do not infer capability from relay message-type names.
3. Design **four separate stores/streams**: Alex Personal Memory, Alex Detailed Personal Memory, Aiko Personal Memory, Aiko Detailed Personal Memory. Shared Basic/Detailed Context remain distinct and do not substitute for these.
4. Preserve character-specific provenance: what each character witnessed, was told, felt, inferred, intends, or still needs to resolve. Never assume Alex automatically knows Aiko's private thoughts or vice versa. Their memories may overlap on shared facts but must not become mirrored thought/reaction/task lists.
5. Prototype updates and previews for each character independently. Keep existing shared-context previews non-saving; establish and explicitly test any new personal-memory persistence behavior before enabling it.
6. Test character selection, isolation, independent evolution over many turns, and absence of cross-character leakage. Confirm behavior in Bill's actual browser.
7. **Only after personal-memory infrastructure is reliable**, revisit retrieving selected shared and character-specific context for outgoing injection. Use the linked tested wrapper as the starting point, but decide how to represent individual memory without falsely presenting private thoughts as shared facts.
8. Implement safe message assembly and send integration, then evaluate UI/history effects and long-term continuity. Keep a known-working baseline and document each verified milestone.

## Character-specific memory design requirements (new priority)

Perchance's established memory model distinguishes:
- **Personal Memory:** short, specific, private character points, including THOUGHTS and MEMORIES; inserted when that character generates a reply.
- **Extended / Detailed Personal Memory:** richer private experiences, emotional state, relationships, and open threads; complements Personal Memory rather than replacing it. The user refers to this as **Detailed Personal Memory** for the bridge project.

These are **character-specific**, unlike shared Basic and Detailed Context. For two characters the planned memory inventory is six distinct records: two shared and four character-specific. **This is an architectural target, not an implemented claim.**

Before coding, verify the actual Perchance UI names, storage/update semantics, and how its memory updater distinguishes characters. Decide whether each character needs its own update request, selection control, preview, and persistence mechanism. No generic global 'thoughts' summary should be copied into both characters.

## 8. Implementation requirements / guardrails

- **Never alter Bill's typed text.** Treat context and user text as two separately sourced fields.
- **Do not replay past events.** External memory describes previously established state; it is not dialogue or a new action.
- **No duplicate wrappers or double sends.** Retries must not prepend context repeatedly.
- **No silent fallback to stale context.** If fresh context is unavailable, use a deliberate and visible policy to be agreed with Bill.
- **No claim of invisible injection** until visible-bubble and stored-history effects are actually tested.
- **No undocumented server-side control assumptions.** Request inspection shows a potential surface, not a stable supported injection API.
- **Do not compromise the preview-only constraint** or silently overwrite Perchance memory.
- **Avoid speculative rewrites.** Change one component at a time and keep a known-working baseline.

## 9. Open decisions for Bill and the team

These are intentionally **not** guessed:

1. How do Perchance's Personal Memory and Detailed/Extended Personal Memory mechanisms actually identify, update, store, and retrieve memories for Alex and Aiko independently? (Immediate next research question.)
2. Which character-memory operations should be preview-only versus explicitly persisted, and how should their UI/status controls work?
3. Which Perchance shared and character-specific sources will eventually be selected for outgoing injection?
4. Should injection be opt-in per message, toggle-enabled automatically, or always on once validated?
5. If the bridge is disconnected or the context is stale, should sending proceed with no context, pause for reconnection, or ask Bill?
6. Is visible context text in ChatGPT's user-message bubble acceptable, or is hiding it a requirement that must be solved before rollout?
7. What is the preferred maximum injected context size, if any?

Resolve these before declaring a production-ready outgoing feature. They need not block investigation of character-specific memory mechanisms. **Do not jump straight to outgoing injection.**

## 9A. Outgoing injection prototype — browser test and visibility finding (2026-11-18)

- **Implemented:** ChatGPT-side Hotbuttons v1.9.11 adds an opt-in, initially OFF outgoing `fetch` interceptor. It reads the editable Detailed Context textbox, wraps it with the tested external-memory template, and replaces the single outgoing user text part. Perchance is not involved at send time.
- **Bill's live browser test:** Bill typed only `testing`, then sent a subsequent ordinary message. The resulting messages received by ChatGPT contained the full wrapper and updated Detailed Context, and Bill confirmed the entire combined text was visible in his user-message bubbles.
- **Verified result:** Automatic outgoing injection works in Bill's browser for these sends; current approach **does not** provide invisible context and visibly clutters conversation history. Bill switched injection OFF.
- **Engineering conclusion:** Treat the network-payload modification as a known-working prototype, not a clean production solution. Cosmetic DOM hiding would not remove the context from server-stored message history, and can fail on reload/edit/export.
- **External research:** A June 2026 OpenAI developer-community report describes analogous visibility problems for ChatGPT app widget-originated messages and unreliable app-specific model-context updates. This is *not* proof that a userscript has access to those app interfaces or to a hidden supported context channel: https://community.openai.com/t/widget-originated-ui-message-now-renders-full-message-text-in-transcript-previously-hidden/1383520
- **Next decision gate:** Determine whether an actual separate context channel is accessible from the existing ChatGPT web client, without inventing undocumented request fields or claiming that an Apps SDK mechanism works in Tampermonkey. If none is demonstrated, present the honest tradeoff: visible persisted context with optional UI cosmetics, or a different integration architecture. Preserve v1.9.11 and keep injection OFF during investigation.
- **Priority correction:** This browser-verified injection milestone supersedes the older roadmap's 'no outgoing injection implemented' wording. Character-specific memory work remains planned, but clean delivery is the immediate blocker.

## 9B. v1.9.25 injection and history-cleaning follow-up (2026-11-19)

**Code checked:** `alai-hotbuttons.user.js` on the default branch identifies itself as **v1.9.25**. It retains the outgoing injection checkbox (initially OFF per tab), assembles the established external-memory wrapper from the editable Detailed Context and original outgoing text, and intercepts eligible `fetch` submissions. The script also contains an incoming-history response-cleaning layer and a display-only user-bubble cleanup layer. These are different operations; neither demonstrates deletion or rewriting of server-stored conversation messages.

**User-reported desktop verification:** Bill reported approximately **30 tests** of the v1.9.25 injection/cleaning combination, with injection ON and the cleaning working. He reconfirmed on November 19 that **“injection cleaning is still working.”** This supports repeated successful behavior in his tested desktop configuration, not exhaustive validation of all ChatGPT send/history paths.

**Cross-device observation:** On his phone, where the desktop Tampermonkey Hotbuttons cleanup was not running, Bill saw the original uncleaned injected messages. This is evidence that the cleaner's presentation is local to the instrumented client, **not** evidence of a server-side cleanup. The exact behavior of every history API response, reload/edit/export path, or other device remains to be tested. Do not conflate the code's incoming-response transformation with server-side message mutation.

**Historical milestone retained:** The v1.9.11 test initially proved outgoing request injection but also exposed the full wrapper in ChatGPT user bubbles. v1.9.25 mitigates the visible clutter **on the tested desktop client**; it does not resolve persisted-history clutter or prove a supported hidden context channel.

**Verified vs proposed:** Working outgoing injection and desktop cleanup are user-observed; a truly invisible/persistent-history-clean integration, automatic fresh Perchance saved-memory reads, separate Alex/Aiko Personal and Detailed Personal Memory, robust reconnection, long-play reliability, and all send/retry/export/mobile cases remain **open**. The conversation included discussion of comparing desktop with Hotbuttons disabled to inspect raw history; do not record that comparison as completed. No new character-memory implementation or save behavior was demonstrated.

**Next engineering/test sequence:**

1. Preserve the current v1.9.25 known-working baseline; avoid rewriting the injector and cleaner together.
2. Explicitly test refresh/reload, desktop with script disabled, phone, edit/regenerate, exports/history, and React re-rendering. Record what is cleaned only in the UI, what is rewritten in incoming responses, and what remains stored on the server.
3. Test injection OFF, missing/empty/stale Detailed Context, multiline messages, retries, send failures, duplicate prevention, and alternate submission paths. Do not infer reliability from the ~30 successful tests alone.
4. Decide with Bill whether local visual cleaning is acceptable given server-side persistence, or whether a different supported delivery architecture is required. Do not invent an invisible injection channel.
5. Continue the separately planned Alex/Aiko personal-memory architecture (four private streams plus two shared streams), with actual Perchance semantics, isolation, and persistence tests **before** relying on it for outgoing context.
6. Only after source freshness, failure policy, and history tradeoffs are resolved should injection be treated as production-ready.

**Blockers:** No demonstrated server-side-invisible context path; no validated current saved-memory retrieval/persistence for injection; incomplete cross-device/history/retry and long-run testing. These do not negate the desktop prototype milestone.

## 10. How to maintain this project file

- Update **WHERE WE ARE NOW** and the roadmap when milestones are verified, not merely proposed.
- Record script version, tested browser behavior, observed result, and known regressions after each meaningful implementation step.
- Keep the exact manual-test template and its evidence in the linked research journal rather than duplicating or silently rewriting it here.
- When Bill says **“read the ALAI project file”**, fetch this file and the linked research journal, then continue from the first uncompleted milestone. **Do not restart the initial feasibility research.**

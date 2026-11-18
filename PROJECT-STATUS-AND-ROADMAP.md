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
Context preview / eventually usable current context
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

**Project stage: Context gathering / bridge and preview infrastructure.**

The concept has been investigated; the structured wrapper has been manually demonstrated; the userscripts now gather recent completed ChatGPT replies and send them to Perchance for Basic/Detailed Context AI **previews**. We are preparing the means to obtain trustworthy context for later use.

**Not yet implemented:** automatic retrieval of the right current Perchance state immediately before a user send, merging it with Bill's typed message, or submitting that assembled message through the ordinary ChatGPT flow.

Do not describe the system as already injecting context. Do not assume AI previews are saved Perchance context.

## 6. Roadmap and milestone gates

| Stage | Deliverable | Status / gate |
| --- | --- | --- |
| 1. Concept and boundary research | Inspect browser request; distinguish visible outgoing text from hidden server context | **Done** |
| 2. Manual feasibility | Test context wrapper and newer-state supersession | **Done (limited)** |
| 3. ChatGPT → Perchance bridge | Capture completed replies; transport and preview context updates | **Implemented; previously confirmed functional** |
| 4. Toolbar hardening | Collapse/resize/status/selector; robust reconnection | **Mostly implemented; later UI changes need confirmation; reconnection deferred** |
| 5. Context source for injection | Identify whether to read saved Basic/Detailed Context or a deliberate subset; verify freshness and read semantics | **Next design/engineering milestone** |
| 6. Outgoing message assembly | Preserve Bill's original text; insert selected context using exact tested wrapper | **Not implemented** |
| 7. Safe send integration | Hook into a reliable composer/send flow without duplicate sends, lost text, or broken normal behavior | **Not implemented** |
| 8. UI/history validation | Determine visible message effects, retry behavior, stale snapshots, long-play token/history costs | **Not tested** |
| 9. Sustained-use validation | Repeated sends, state changes, disconnected bridge, long conversations | **Not tested** |

## 7. Next-session procedure (actionable)

1. **Read this project file and the linked message-template journal.** The journal contains the exact tested wrapper and earlier reasoning; this file tracks implementation.
2. **Fetch the current repository scripts before editing.** Verify their versions and actual message handlers; the version numbers above are a recorded snapshot, not a promise of current code.
3. **Inspect how Perchance context can be read without saving or mutating it.** Decide whether the outbound context should come from persisted Basic Context, Detailed Context, both, or an explicitly selected subset. Confirm how current/stale state is identified.
4. **Confirm UI status and bridge lifecycle in Bill's browser.** In particular, verify v1.9.8/1.9.9 UI changes and whether manual reconnect after refresh remains necessary.
5. **Prototype context retrieval and assembly independently of sending.** Display/inspect the assembled message first. Ensure the original message survives unchanged and the exact tested delimiters are used.
6. **Only then select and test a send-integration approach.** Prefer an observable, reversible path; do not assume historical DevTools payload shapes are stable. Handle Enter/button sends, retries, disabled/disconnected states, and duplication.
7. **Run short controlled tests, then longer continuity tests.** Verify that new context supersedes old context and that the same ChatGPT conversation remains intact. Record results in this file, with versions and explicit observed outcomes.
8. **Protect existing behavior.** Do not make Basic/Detailed AI previews silently write to Perchance. Preserve shared busy coordination, message origin checks, and the existing working toolbar.

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

1. Which Perchance source is authoritative for outgoing injection: saved Basic Context, saved Detailed Context, both, or a selected current-state excerpt?
2. Should injection be opt-in per message, toggle-enabled automatically, or always on once validated?
3. If the bridge is disconnected or the context is stale, should sending proceed with no context, pause for reconnection, or ask Bill?
4. Is visible context text in ChatGPT's user-message bubble acceptable, or is hiding it a requirement that must be solved before rollout?
5. What is the preferred maximum injected context size, if any?

Resolve these before declaring a production-ready outgoing feature. They need not block documenting or testing context retrieval.

## 10. How to maintain this project file

- Update **WHERE WE ARE NOW** and the roadmap when milestones are verified, not merely proposed.
- Record script version, tested browser behavior, observed result, and known regressions after each meaningful implementation step.
- Keep the exact manual-test template and its evidence in the linked research journal rather than duplicating or silently rewriting it here.
- When Bill says **“read the ALAI project file”**, fetch this file and the linked research journal, then continue from the first uncompleted milestone. **Do not restart the initial feasibility research.**

# Outlook and mailbox discovery

## Browser execution

Treat browser discovery as one bounded read-only operation.

1. Run `node "<resourceDir>\scripts\outlook-discovery.cjs"` from the host-provided `resourceDir`.
2. The script first attaches to an available TCP CDP browser. When none exists, including when Scout launched its browser with `--remote-debugging-pipe`, it launches Edge with the skill's stable persistent profile. Do not treat the absence of a TCP debugging port as a terminal failure.
3. Reuse an authenticated Outlook page. Do not repeatedly navigate to settings deep links.
4. The script directly activates `button[role="tab"][value="workSchedule"]` through DOM `button.click()`, then waits for the Monday start-time input.
5. Never use `playwright-browser_run_code` for discovery.
6. Allow one retry only when the structured result identifies a transient panel-load timeout.
7. Never install a browser or browser dependency during onboarding. If the persistent profile requires authentication, keep the interactive Edge window visible for up to five minutes while the user signs in, then continue discovery in the same run. A scheduled headless run must stop with `authentication-required` instead of falling back to stale Outlook state.
8. Use a dedicated stable profile, overridable with `--user-data-dir` or `OOF_AUTO_REPLY_BROWSER_PROFILE`. Never use the user's ordinary Edge profile. If the dedicated profile is locked, report `persistent-profile-locked`; never terminate unrelated Edge processes.

Before the detected-values summary, emit:

`OOF_BROWSER_RECEIPT script=1 retries=<0-1> exploratory_calls=0 elapsed_ms=<N>`

If exploratory calls are not zero, do not claim deterministic browser discovery succeeded.

## Mandatory mailbox inference

Mailbox inference is required because Outlook can hide reply editors while Automatic Replies are off and signature settings may not expose historical banner wording.

1. Get the signed-in user's address with `workiq_get_my_profile`.
2. Search the last 30 days for the exact phrase `"outside my working hours"`.
3. Select the newest item sent by that signed-in user whose subject starts with localized `Automatic reply:` or `Réponse automatique :`, then fetch its full HTML body.
4. List the 10 newest Sent Items with HTML previews.
5. Select the newest normal human-authored message whose preview contains signature or banner text, then fetch its full HTML body.
6. Retry each mailbox call once immediately on HTTP 5xx. Do not replace a failed read with defaults.

Before confirmation, provide the exact inferred Automatic Reply body and signature or banner with source timestamps. If the mailbox path fails, state `Unavailable due to mailbox error`.

Mailbox evidence proves historical wording only. It never proves that Automatic Replies are currently enabled or that a browser period is current.

## Browser output boundaries

Return current switch state, period state and dates, exact visible internal and external bodies, default signature name, backup contact when present, and leave-banner wording when present. Do not click Save or edit any control.

Use `automated out-of-office system` as the neutral signature tag unless the user chooses another value. Never invent a backup contact.

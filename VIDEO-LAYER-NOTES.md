# Video layer — requirements

For the video-production system that will be built on top of the demo master. **None of this is
built into the Sherbet product UI, and none of it should be.** The demo has to stay credible as a
genuine client platform, which it stops being the moment it contains a booking button or sits
inside a decorated frame.

The demo master is now stable enough to build on. That was the point of this pass.

---

## What the video layer is responsible for

| Concern | Owner |
|---|---|
| Simulated browser frame | Video layer |
| Background tabs | Video layer |
| Persona selection of moments | Video layer |
| Narration and spoken CTA | Video layer |
| Delivery message and actionable CTA | Outbound, not video |
| The demo itself | Demo master. Contains none of the above |

## 1. Simulated browser frame

The teaser shows the demo inside a simulated Chrome window. Simulated, not captured: the frame is a
graphical element the video layer draws, never a screenshot of a real browser.

The impression to create is **"Phil is quickly showing me something he's been working on"**, not
"this is a produced video pretending to be a browser".

What makes it read as real:

- numerous open tabs, more than would fit comfortably
- compressed tab widths, with titles truncating naturally
- recognisable favicons
- a mixture of work tools, research, prospects and client activity
- a slightly untidy arrangement
- the active prospect demo sitting among ordinary working tabs, not centred or highlighted
- realistic Chrome proportions, address bar and window chrome
- nothing that looks like a template

Vary it between videos. Tab count, widths, ordering and the active tab's position should not be
identical twice. A frame that is pixel-identical across five videos is a template and will be read
as one.

### Never capture or expose

This is a hard rule, not a preference. The frame is drawn from a configured pool of fictional tab
definitions. It never reads from a real browser.

- real emails or email subjects
- CRM contact information
- LinkedIn messages or connection data
- notifications of any kind
- personal information
- authenticated client sessions or content
- browser history
- passwords, tokens or account details

If the production system ever needs a screenshot of a real browser to build the frame, the design is
wrong. Build the frame from a tab list.

## 2. Background tab pool

Draw from a configurable pool. A natural mix, not an impressive one.

Plausible: HubSpot, Gmail, LinkedIn, Claude, ChatGPT, Google search, Netlify, a trade publication,
a prospect's own website, one client programme.

**Use at most one client or programme credibility cue in a typical recording.** A frame reading

```
BYD | Renault | Stellantis | Geely | Porsche
```

is obviously staged and will be read that way. Something like

```
HubSpot | Gmail | LinkedIn | Claude | Netlify | BYD Mission Hub | [ACTIVE PROSPECT]
```

reads as a working browser.

### Social proof stays incidental

If a client tab is present, it must remain in the background in every sense:

- do not highlight it
- do not animate it
- do not move the cursor towards it
- do not caption or explain it
- do not repeat client tabs across the video
- do not arrange them prominently
- **do not let the narration depend on the viewer noticing it**

If the prospect notices, good. If they do not, the video should lose nothing. That test is the
design constraint: write the narration so it works for a viewer who never reads the tab strip.

## 3. Persona selection

One prospect build, several narratives. The system selects moments from
`RECORDABLE-MOMENTS.json` by the recipient's role.

Each moment carries `personas`, `strength`, `dwell`, `settle`, `scroll`, a `selector` and a
`navigation` array. Suggested three-moment cuts are in `suggestedTeasers`.

| Recipient | Emphasise |
|---|---|
| Senior / regional leadership | Programme adoption, cross-market visibility, management insight |
| Sales / commercial | Campaigns, individual performance, leaderboard, target achievement |
| Aftersales | Parts and service campaigns, site performance, retention and quality |
| Network / dealer development | Onboarding, dealer adoption, engagement, drill-down |
| Marketing / CX | Campaign activation, participant engagement, recognition |

**Two or three moments per teaser.** Not five. The catalogue exists so the system can choose, not so
it can use everything.

## 4. What the demo master gives the recorder

Already built, so the video system does not have to work around anything:

| Capability | How |
|---|---|
| Reset to a known state | `?reset=1` on any URL, or `Shift+0`. Clears language, drill level and scroll |
| Deterministic entry to any depth | Level held in the URL hash. `network.html#United%20Kingdom/Geely%20Bristol` |
| Stable targets | `data-rm="..."` on every recordable surface, independent of class names and text |
| No loading states | No network calls at runtime, no fonts fetched, no first-run state, no cookie banner |
| Settle time | Everything settles within 700ms. Documented per moment |
| Nothing hover-only | Asserted. A recording cannot hover |
| Language on camera | Two flags in the chrome, whole interface changes, persists across navigation |

**Reset between takes.** The language choice persists in `localStorage`, so a take that ends in
German starts the next one in German unless reset.

## 5. Narration

The spoken CTA belongs at the end of the narration, not in the product. Something like:

> "I've only shown you a little of it here. If it's relevant I'd be happy to take you through the
> full version. Fifteen minutes is probably enough."

Wording is personalised per recipient at production time.

Three things learned from the earlier Geely walkthrough that still apply:

- **Do not say "AI"** over the SherBot screen. The screen speaks for itself, and the word invites
  scepticism from a buyer whose problem is operational.
- **Do not read the numbers out.** They are illustrative, the pages say so, and reading them invites
  the question of where they came from.
- **On the language switch, stop talking.** Change it, let it change, then speak. The pause is the
  moment.

## 6. Delivery CTA

The actionable CTA lives in the LinkedIn or email message carrying the video, never in the video and
never in the demo.

> "Happy to take you through the full working version. Fifteen minutes is plenty."

A low-pressure forwarding line is worth including:

> "If someone else in the team owns this area, feel free to pass it on."

## 7. The commercial principle

The teaser deliberately does not show everything.

Two or three moments in 45 to 60 seconds. The rest stays unseen so the fifteen minutes Phil is
asking for is worth somebody's time. A demo that fits entirely into a teaser has nothing left to
demonstrate, and a teaser that shows everything removes the reason to take the meeting.

`RECORDABLE-MOMENTS.json` carries a `doNotRecord` block for the same reason: the commercial pages
are built and reachable, and at cold stage they stay off camera.

## 8. Out of scope for this pass

The automated pipeline itself is not built. What exists is a demo master stable enough to build one
against: fixed selectors, deterministic navigation, a reset, a verified moment catalogue and a
verification suite that fails loudly when any of it drifts.

Re-run the moment resolver after any change to the build. A catalogue that has drifted from the
demo is worse than no catalogue.

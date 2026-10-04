# XPENG Vector — build notes

Cloned from the Geely Uptime master on 31 August 2026. First real test of the demo factory:
one prospect build producing another without rebuilding the engine.

**70 assertions passing. 11 of 11 recordable moments resolve. VideoSpec dry-run clean.**

---

## What this build is

XPENG UK, a single-market retail programme through one distributor. The layout, menu naming
and page structure are identical to the master, which is identical to BYD Mission Hub and
Renault Équipe. What changed is the side of the business.

**Geely Uptime rewards aftersales behaviour. Vector rewards retail sales behaviour.**
A distributor launching an unfamiliar brand does not have a servicing problem yet. It has a
demonstration problem: people who sell several brands, defaulting to the one they can already
explain.

| Archetype | Geely Uptime | XPENG Vector |
|---|---|---|
| Accelerator, banded ladder | First Time Fix | **Test Drive** |
| Conversion, capped pot | Genuine Parts | **Order to Delivery** |
| Certification, modules | EV Service Ready | **Product Certification** |
| League, individual and site | The Service League | **The Retailer League** |
| Retention, monthly threshold | Next Service Booked | **Demonstrator Days** |

Same five mechanisms, same pages, same verification. Different behaviours.

## The hierarchy

Geely drills Europe → market → service centre → individual. This drills **United Kingdom →
region → retailer → individual**, on the same code. Seven regions, 68 retailers, 640 people
in the target network, with the South East expanded to retailer level and XPENG Guildford to
individual level.

## What took the time, and what did not

**Fast:** the engine, the page structure, the drill-down, the verification suite, the
recordable moment catalogue, the VideoSpec harness. All of it carried over.

**Slow, and unavoidable:** the prose. A Geely "job" is a repair order and an XPENG "drive" is
a test drive, and every rule, exclusion, FAQ and T&C hanging off those words is different.
Substitution gets the nouns; it does not get the rules. That was three passes and it is where
a clone actually costs something.

**The lesson for the next one:** budget for the rules, not the branding. Branding is an
afternoon. The rules are the day.

## Decisions worth keeping

**English only, deliberately.** A single-market programme through one distributor has no use
for a language switch. The runtime is unchanged and language-agnostic, so a second language
here is a data addition. The switch renders only when the build carries more than one, so a
single-language build does not show a control that does nothing.

**The Geely dictionaries do not port.** 664 phrases and 75 pattern rules each, keyed on
Geely's own campaign names and aftersales vocabulary. A language here would be a fresh
translation pass against this build's English, not a copy. Worth knowing before anyone
promises a multilingual XPENG build in half a day.

**Key names are archetype slots, not campaign names.** `DEMO.firstTimeFix` carries whatever
accelerator campaign a build runs. Renaming the keys to the archetypes properly is a factory
job worth doing once across every build, not a per-clone edit. Recorded here rather than done,
because doing it mid-clone risks the thing that is working.

**`units()` and `days()` are separate helpers.** The accelerator counts drives and Demonstrator
Days counts working days. Borrowing one unit for the other is how a screen quietly says the
wrong word, and it did until it was caught.

**Resolved 11 September: home page order swapped, Campaigns now ahead of Voice of the Network.**
`index.html` carried the Voice of the Network prompt block above the Campaigns rail; both are
plain `<div class="wrap section tight">` siblings referencing no shared state, so this was a
straight block reorder, no data or selector changes. `RECORDABLE-MOMENTS.json` targets both
sections by `data-rm` attribute, not by position, so no recordable moment was affected.
`verify.js` back to 113/113 after the change. Mirrors the same reorder already made on the AION
Great Eight build.

**Resolved 11 September: two real XPENG photos added, supplied by Phil ("china visit and track
day").** `assets/img/xpeng-china-track-day.jpg` (a P7 on a circuit) replaces the studio shot on
the home hero's "Test Drive" slide thumbnail — the strongest available pairing, since the image
is a car in motion on a track rather than static studio artwork. `assets/img/xpeng-china-
production-milestone.jpg` (the factory line-off ceremony) replaces the first Newsfeed card's
image, and that card's headline and body were rewritten to match what the photo actually shows
("XPENG's production line passes another milestone") rather than keep the old EX2-specific
copy paired with an unrelated picture. Both new strings were added to all four foreign-language
dictionaries in `assets/i18n-build.js`, replacing the retired EX2 entries. Neither original file
(`x9-studio.jpg`, `l03-studio.jpg`) was touched, so `genuine-parts.html` — which also uses
`x9-studio.jpg` — is unaffected. `verify.js` back to 113/113 after the change.

**Resolved 11 September: the five campaign pages restyled to be "much more zingy," per Mike's
request and the Renault TLC reference file he sent (`Renault TLC - Native App`, Figma).** Visual
treatment only — no mechanic, payout, or copy changed on any of the five campaigns. The reference
runs a magenta/cyan gradient palette; that was deliberately not carried over. Instead XPENG's own
black/white chrome stays as the base and the existing `--citrus` accent (`#00E0C6`) is used far
more aggressively, everywhere the reference used colour to create energy:

- `.ctype` (the "Accelerator Incentive" / "Conversion Incentive" etc. kicker) is now a solid
  citrus pill with a soft glow, not plain uppercase text.
- A new `.cam-countdown` chip sits under every campaign's hero copy, showing `DEMO.daysLeft` —
  real data already computed elsewhere on each page (the nudge banner), not a new number. Text
  reads "N days left in the period" to match the existing core-dictionary phrase, so it inherits
  translation into all four foreign languages for free rather than adding new untranslated copy.
- The hero key-visual (`.keyvis`) and the status nudge bar (`.nudge-in`) both gained a citrus glow
  shadow. The `kv2` sub-label under each campaign's key-art headline gained a short citrus rule.
- The gamification module (`assets/gamification.css`, shared by all three demo builds) gained a
  citrus glow ring on the Spin & Win wheel, a citrus edge on the slot-machine reels and the
  scratchcard, and a stronger glow on a completed badge ring.
- Biggest change: every game's result line (`.gg-result.show`, `.gg-badge-complete.show` — slots,
  wheel, badges, scratchcard, match-three all render through the same two classes) now renders as
  a solid citrus pill with a checkmark, not a plain sentence of blue text. This is the direct
  equivalent of the "Congratulations, you've won £150" moment in Mike's reference, adapted to
  XPENG's palette rather than copying Renault's.

Because the gamification CSS is shared, Geely Uptime and LEPAS Ascent pick up the same glow
treatment through their own `--citrus`/`--blue` tokens next time either is rebuilt or re-verified
— nobody has yet asked for that, so neither build was touched, but it is a one-file change if
they do. `verify.js` back to 113/113, including layout at 390px and 1440px across all five
languages, after the restyle.

**Resolved 11 September: the two real XPENG photos placed on the Shop hero and the Campaigns
hub carousel, and that shared carousel component given the same citrus energy as the campaign
pages.** Phil's first pass at the restyle only reached the home hero and the newsfeed card —
the Shop page and the Campaigns hub run their own hero/carousel, which still showed generic
stock (`demonstrator.jpg`, `drive-handover.jpg`). `shop.html`'s hero background is now
`xpeng-china-track-day.jpg` and its "Today's top pick" thumb (copy already mentions "a track
day for two, or a place on the brand home visit") is now `xpeng-china-production-milestone.jpg`
— the China visit photo pairs directly with "brand home visit". `campaigns.html`'s first slide,
the literal Test Drive campaign, now carries the track day photo too, matching the same pairing
already used on the home hero. `index.html`, `shop.html` and `campaigns.html` are the only three
pages using the shared `.hero`/`.carousel` component, so one CSS pass in `app.css` covers all
three: the slide card now carries a citrus ring and glow (matching `.keyvis`/`.nudge-in`
elsewhere), the slide thumbnail has a citrus glow edge, the active carousel dot glows, the arrow
buttons pick up a citrus ring, and the "Learn more" button inside a slide gets a citrus glow —
scoped to `.slide-actions .btn` rather than the shared `.btn` class, so reward-shop buttons and
every other button on the site are untouched. Visual only, same scope Phil agreed for the
campaign pages. `verify.js` back to 113/113 after the change.

## Blocker

**No XPENG photography.** Fifteen image slots render labelled dark placeholders reading
`IMAGE PENDING · SUPPLY XPENG ASSET`. They are honest and they are not embarrassing, but three
are visible in the video's opening scene.

Needed:

| File | What it should be |
|---|---|
| `retailer-front.jpg` | Retailer exterior |
| `showroom-desk.jpg` | Showroom, handover desk |
| `drive-handover.jpg` | Test drive, keys to customer |
| `demonstrator.jpg` | Demonstrator on the road |
| `charging-explained.jpg` | Charging explained to a customer |
| `product-briefing.jpg` | Product briefing, staff |
| `handover-keys.jpg` | Handover |
| `first-ninety.jpg` | Customer with the car, first ninety days |
| `g6-studio.jpg` `g9-studio.jpg` `p7-studio.jpg` | Studio car shots |
| `detail-charge.jpg` `detail-light.jpg` | Details |
| `accessory-mat.jpg` `accessory-boot.jpg` | Accessories |

Drop them into `assets/img/` under those names and nothing else has to change.

## Known limits

- **Only the South East drills to retailer level, and only XPENG Guildford to individual
  level.** The other six regions say so and offer a route to the expanded one, rather than
  faking depth.
- **The programme name is invented.** Vector has had no trademark check.
- **The accent colour is chosen, not XPENG's.** The mark is their own black and white artwork,
  extracted from the June deck and split into a horizontal lockup. The palette around it is a
  reconstruction and should be eyedroppered before anything reaches a named contact.
- **The reward catalogue is the UK one**, which is correct here because the whole programme is
  UK. This is the one place the XPENG build is simpler than the Geely one.

## Shared tooling added this pass

`verify-spec.js` now takes a VideoSpec path as an argument and drives it end to end: every
selector in frame without an auto-scroll, every scroll landing where it says, the end state
the spec declares, and the narration timing coherent. Build-agnostic, and copied back into the
Geely build so both are checked by the same harness.

Run it:

```
node verify-spec.js outbound/XPENG-UK-VIDEO-SPEC.json
```

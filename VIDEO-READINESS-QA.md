# Geely Uptime — video readiness QA

Assessed 30 August 2026 against the Demo Master Enhancement brief. Machine-checked results come
from `verify.js` (68 assertions) and a separate pass that drives every recordable moment in a
headless browser.

**Overall: PASS.** 70 of 70 assertions passing, 12 of 12 recordable moments resolving.

Re-checked 30 August against the first production VideoSpec. Two further defects were found while measuring the actual camera path and both are fixed. See the addendum at the foot of this document.

---

## 1. Visual clarity — PASS

| Check | Result |
|---|---|
| Prospect branding immediate | Geely logo and Uptime wordmark in the chrome on all 15 pages |
| Opening screen impact | Workshop hero, participant name and balance, five campaign cards above the fold at 1440×900 |
| Headline KPIs readable in a recording | Funnel figures 34px, ratio tiles 30px, adoption band 31px. Asserted: nothing below 26px |
| Management view comprehension | Adoption funnel is four figures and two percentages, readable in about three seconds |
| Leaderboard movement obvious | Coloured arrows with place counts, plus a "to next" column in points |
| Onboarding against target obvious | Target is the first tile, dark, with each subsequent stage barred against it |
| Individual performance obvious | Four KPI tiles, then a table with target and achievement percentage per campaign |

Colour is not the only carrier: every bar has its number beside it, and the market rows print the
percentage as well as colouring it.

## 2. Navigation — PASS

| Check | Result |
|---|---|
| Deterministic | Every level reachable by URL. No click sequence required |
| Deep links | `#France`, `#United%20Kingdom/Geely%20Bristol`, `#.../GEE-BRS-02` all verified |
| Back button | Level held in the hash, so browser history works |
| Breadcrumb return | Verified from level 3 back to level 0 |
| Dead ends | None. Every page reachable from the nav in one click; markets without site detail say so and link on |
| Management pages discoverable | Dashboard, Network, AI Analytic and Commercial are all in the management nav |
| Loading states | None. No network calls, no fonts fetched at runtime, no first-run state, no cookie banner |

The management pages used to sit behind the Role dropdown only, which meant a viewer had to know
they existed. They are now in the navigation.

## 3. Selectors — PASS

20 `data-rm` targets across the build, stable against content and class changes.

All 11 recordable moments were driven end to end in a headless browser at 1440×900. Every selector
resolved and was visible. Re-run with `node /tmp/rmcheck.js` style harness against
`RECORDABLE-MOMENTS.json` after any change to the build.

## 4. Reset state — PASS

| Mechanism | Result |
|---|---|
| `?reset=1` | Clears language, drill level and scroll. Verified |
| `Shift+0` | Same, with a reload |
| What persists otherwise | Only the language choice. Nothing else in the build carries state |

Verified from a dirtied state: German selected and drilled into a market, then reset returns
English, no hash, breadcrumb at Europe.

## 5. Data reconciliation — PASS

31 assertions. Selected results:

```
ledger sums to balance                      533 = 533
wallet value = ledger redemptions           140 = 140
market targets sum to programme           3,000 = 3,000
market registered sum to programme        2,211 = 2,211
market sites sum to programme               187 = 187
funnel never widens                          at every level
site targets sum to market                  600 = 600
site registered sum to market               441 = 441
roster size = site registered                11 = 11
participant points = campaign sum           529 = 529
league points = roster points               529 = 529
one job population across campaigns          48 = 48
subsets never exceed the job pool     38/31/21 of 48
reward by campaign = points issued       96,400 = 96,400
```

Claire Bowen's 529 points are not typed anywhere. They are what her own campaign screens add up to:
114 from First Time Fix, 310 from Genuine Parts, 105 from EV Service Ready. The individual
leaderboard, the site roster and the individual performance view all show the same number because
they read the same field.

**One error was caught by these assertions and not by eye:** Hungary had 173 people invited against
a target network of 170. Corrected by raising Hungary to 180 and lowering Italy to 270, which keeps
the programme target at 3,000.

## 6. Campaign count — PASS

Five campaigns with full pages, five distinct mechanisms:

| Campaign | Mechanism |
|---|---|
| First Time Fix | Accelerator, banded ladder, non-marginal rate |
| Genuine Parts | Conversion, capped pot depleting live |
| EV Service Ready | Certification, four modules plus completion award |
| The Service League | League, individual and site |
| Next Service Booked | Retention, monthly threshold with a volume floor |

Three more exist as summary cards with modals: Warranty First Time Right (quality), Technician
Pathway (development), Tyres and Wear (attachment).

## 7. Leaderboard — PASS

Individual league is the default tab. Carries participant, role, service centre, points earned this
period, gap to the position above, previous rank and movement. Ten shown, the participant
highlighted at 7th of 441, up four.

A "Closing the gap" panel names who is ahead, by how much, and which campaign closes it: 72 points,
which is seven more jobs with a genuine part attached, with a button to that campaign. The
arithmetic is checked, not asserted: 72 ÷ £10 per job = 7.2.

The service centre league is the second tab, 24 sites on four operational measures.

Both are strictly ordered and sequentially ranked, asserted.

## 8. Onboarding — PASS

Programme-wide: target 3,000, invited 2,860, registered 2,211, active 1,834. Registration against
target 74%. Active against registered 83%.

Per market, all seven, with a clear spread:

| Market | Registration vs target | Active vs registered |
|---|---|---|
| Germany | 82% | 85% |
| Netherlands | 80% | 85% |
| United Kingdom | 74% | 84% |
| Hungary | 70% | 77% |
| Spain | 72% | 82% |
| France | **63%** | 78% |
| Italy | **61%** | 81% |

France and Italy are visibly behind, in colour and in figures. A programme office can see where to
act in about three seconds, which is the point.

Also shown: 649 invited but not yet registered, 377 registered but not active this month. Both
derived, so they cannot contradict the figures above them.

## 9. Individual performance — PASS

Reached by drilling Europe → United Kingdom → Geely Bristol → Claire Bowen, or by deep link.

Shows: name, role, market, site, account, active-since status, points this period, individual
league position, campaigns active, points balance, performance by campaign with position, target
and achievement percentage, a six-period trend and recent activity.

The trend is drawn as an inline chart rather than a hover tooltip, because a recording cannot
hover.

## 10. Recording suitability — PASS

| Check | Result |
|---|---|
| Viewport | 1440×900. No horizontal overflow at 1440 or 390, in either language |
| Animation | Bars and fills settle within 700ms. Nothing runs indefinitely |
| Hover dependency | Zero elements carry a `title` as their only content. Asserted |
| Scroll predictability | Documented per moment in `RECORDABLE-MOMENTS.json` |
| Language switch on camera | Two flags in the chrome, whole interface changes, verified across 12 pages |
| Depth left unshown | Five campaigns, two leagues, four drill levels, SherBot, the shop and two commercial modules. A 45 to 60 second teaser can show two or three |

## 11. Commercial guardrails — PASS

Checked against rendered text on all 15 pages with every tab pane opened:

- no "transparent" in a commercial sense
- no per-user rates, setup fees or monthly fees
- no reward or redemption margins
- no "the OEM" in generic copy
- no "book a call", "get in touch", "contact us" or "request a demo"

The product UI contains no prospecting language of any kind.

---

## Failures found and fixed during this pass

1. **Hungary invited more people than its target network allowed.** Found by assertion. Fixed.
2. **The league nudge described the site league** while the individual league was the default tab.
   Fixed to lead on the individual position and name both.
3. **The drill-down bar carried a tooltip as its only explanation.** A recording cannot hover.
   Replaced with an accessible label, with the explanation printed under the table.
4. **The person drill wrote a bare hash** instead of the full path, so it reset to Europe. Fixed.
5. **The admin nav overflowed the top bar at 1440** with eight items, and offered a programme
   manager a personal shop and voucher wallet. Replaced with a management nav of five.

## Known limits

Not defects, but worth stating before this is filmed.

- **Only the United Kingdom drills to site level, and only Geely Bristol to individual level.** The
  other six markets say so and offer a route to the expanded one, rather than faking depth.
- **The programme name is invented.** "Uptime" is a placeholder with no trademark check.
- **The brand blue is a reconstruction** and the cyan accent is chosen, not Geely's.
- **The reward catalogue is UK**, which is why the participant is a UK service adviser. A German
  participant needs German card artwork first.

## The final test

> Could this demo support a convincing 45 to 60 second personalised teaser, filmed through
> deterministic browser automation, showing only two or three compelling features, followed by a
> worthwhile 15-minute live demonstration, without changing or rebuilding the demo?

**Yes.**

Filming is deterministic: every moment is a URL and a stable selector, with no click sequence to get
right, no loading states and a one-command reset between takes. Eleven moments were driven end to
end and all resolved.

A teaser has room to spare: three moments at six to eight seconds each is roughly 20 seconds of
screen time inside a 45 to 60 second cut.

There is plenty left for the meeting. A leadership teaser showing the participant home, network
adoption and the drill to an individual leaves five campaign pages, both leagues, the shop, the
Points Bank, SherBot and the commercial modules unseen.

The one thing to settle before it goes to a named contact is the programme name.


---

# Addendum — findings from building the first VideoSpec

Measuring the real camera path found two things that reading the build had not.

## 1. The UK site table claimed an order it did not keep

The 24 UK service centres render in data order, unsorted, so the data order **is** the
displayed order. The list runs descending by network size: 34, 32, 31, 25, 25 and so on.
Geely Bristol, with a target network of 14, sat at position 11, between two sites of 25.

On camera that is a broken sort in a table of dealer performance, shown to a man who reads
dealer performance tables for a living. Nobody had spotted it because the *percentages*
looked fine: Bristol at 79% sat plausibly among its neighbours. Only the absolute figures
gave it away.

**Fixed** by moving the row to its correct place, which is last. No figure changed, so every
sum still reconciles. Now asserted, so it cannot drift back.

It also improved the story. Bristol is the smallest site in the UK and has the highest
registration rate in the bottom third, the only green bar in a run of red. The drill now
ends on the smallest site in the network rather than a mid-table one, which is closer to
Geely's actual problem: service centres appointed this year, from nothing.

## 2. Points and pounds were printed as if they were the same thing

The participant home showed `533` under the caption "Points balance", and directly beneath
it `£533 to spend`. The Points Bank did the same. One number, two units, nothing joining
them.

In German it was worse: `533 £ verfügbar` under `Punktestand`.

The convention in this build is that points travel across seven markets and sterling is what
a UK participant's points are worth. Both screens broke it.

**Fixed** to `worth £533` and `im Wert von 533 £`. Now asserted across every participant
page: a currency figure equal to the points balance must carry a qualifying word.

## 3. The language flags are in a top bar that does not stick

Not a defect, but it constrains filming and nobody had recorded it.

The top bar scrolls away, so the language switch can only be operated at the top of a page.
A recorder that scrolls down and then reaches for the flags will make the page jump.

This changed the video's structure. The switch now happens on the participant home at scroll
0, where the entire visible interface turns over at once and no sterling figure is on screen
to contradict the German. That turned out to be a stronger shot than the one originally
planned, and it removed a scene rather than adding one.

## What this says about the QA above

The original pass verified that every moment *resolved* and every selector was *visible*. It
did not verify what a viewer would actually be looking at while the camera moved between
them. Both defects sat in plain sight on the most-filmed screen in the build.

Driving the camera path is a different test from driving the moment catalogue, and it should
be run for every prospect build before anything is filmed.

# Geely Uptime — changelog

Against the Demo Master Enhancement and Video-Readiness brief, 30 August 2026.

Nothing in the Sherbet platform was redesigned. The participant navigation, campaign
architecture, Points Bank, Shop, Voucher Wallet, Help, SherBot and the localisation approach
are unchanged except where the brief specifically required a change.

---

## A. What already satisfied the brief

Carried forward untouched.

| Requirement | Already present |
|---|---|
| Prospect branding immediate | Geely logo and Uptime wordmark in the chrome on every page |
| Campaign experiences | Four full campaign pages on the established archetype anatomy |
| A league | Service centre league across four operational measures |
| Participant experience | Home, Campaigns, Points Bank, Shop, Voucher Wallet, Help |
| Management experience | Programme dashboard with market rescope, activation bars, campaign health, logins |
| SherBot | Prepared analytic answer with sources and saved reviews |
| Localisation | English and German, whole participant journey, persists across navigation |
| Reconciled data | One spine in `assets/data.js`, sixteen assertions passing |
| No sales CTA in the product | Nothing in the UI asks for a meeting |
| Commercial modules | Pilot and Scale, Commercial Model, stage recorded in config |

## B. What was modified

**The service league gained an individual leaderboard.** The brief prefers individual ranking
where commercially appropriate. Individual is now the default tab; the service centre league is
the second tab. The terms that previously said "It does not rank individuals, and no individual's
performance is published or scored" were amended, because they contradicted what the brief asks
for. The replacement is explicit about the two leagues, about ranking within a market only, and
about neither league having any connection to pay or appraisal.

**The site league now ranks 24 service centres, not 37**, matching the United Kingdom market row
so the number is real rather than decorative.

**The programme data gained targets.** `programme.targetNetwork` and a per-market
`targetNetwork`, because a dashboard without a target can say how many people joined but never
whether that is good. `notRegistered` and `lapsed` are derived at render time rather than stored,
so they cannot drift.

**Market figures were re-spread** so two markets are visibly ahead and two visibly behind. Seven
near-identical rows demonstrate nothing. France at 63% and Italy at 61% registration against
target are the two a programme office would open first.

**The admin navigation was replaced with a management navigation.** It was Home, Campaigns, Shop,
Points Bank, Voucher Wallet, AI Analytic, Commercial. It is now Dashboard, Network, Campaigns, AI
Analytic, Commercial. A programme office has no personal points balance, shop or voucher wallet,
so showing them was wrong as well as crowded, and eight items overflowed the top bar at 1440.
**The participant navigation is untouched** and still matches the other Sherbet builds label for
label.

**The dashboard gained an adoption band** above the KPI tiles, carrying the four funnel figures
and the two ratios, and linking into the Network page. Adoption is the first question a programme
owner asks, so it now sits at the top of the page.

**Hungary's target was raised from 170 to 180 and Italy's lowered from 280 to 270.** Hungary had
173 invited against a target of 170, which cannot happen. Found by the verification suite, not by
eye.

**Two bugs were fixed while in the area.** The league nudge described the site league while the
individual tab was the default. The drill-down bar carried a tooltip as its only explanation,
which a screen recording cannot reveal; it is now an accessible label with the explanation printed
under the table.

## C. What was added

**A fifth campaign: Next Service Booked** (`next-service-booked.html`), a retention incentive.
A monthly threshold rather than a ladder, a pot or a module count: 40% booking rate on a minimum
of fifteen jobs, paid in full or not at all. It counts the same 48-job population as the other
campaigns, of which 38 closed first time, 31 left with a genuine part, and 21 left with the next
service booked. Five campaigns, five different mechanisms.

**An individual leaderboard** with participant, role, site, points earned this period, gap to the
position above, previous rank and movement. Plus a "Closing the gap" panel naming who is ahead, by
how much, and which campaign would close it.

**A Network page** (`network.html`) carrying both the onboarding-against-target view and the
management drill-down, on one page at four depths:

```
Europe  ›  United Kingdom  ›  Geely Bristol  ›  Claire Bowen
```

The level is held in the URL hash, so the back button works, a recording can deep-link straight to
a depth, and automation has a deterministic entry point for every level rather than a click
sequence it has to get right. The same funnel component renders at every level, so the shape a
viewer learns at Europe still reads two clicks down.

**An individual performance view** at the bottom of that drill: name, role, market, site, status,
active campaigns, performance by campaign with targets and achievement percentages, points earned,
points balance, leaderboard position, a six-period trend and recent activity. Every figure is the
same figure the participant sees on their own campaign screens.

**A United Kingdom site roster** of 24 service centres and a **Geely Bristol roster** of 11 people,
both summing exactly to the level above them on all four funnel columns.

**A recording reset.** `?reset=1` in the URL for a scripted run, `Shift+0` from the keyboard for a
manual take. Clears the language, the drill level and the scroll position. Deliberately not a
visible control: it belongs to whoever is filming.

**Twenty stable recording selectors** (`data-rm="..."`) on the surfaces the recordable moments
target. Stable across content changes, independent of class names and text.

**`verify.js`**, a 68-assertion suite covering reconciliation, campaign count and mechanism range,
page health, drill-down determinism, recording readiness, language, commercial guardrails and
layout. It found the Hungary error.

## D. What became reusable for the next prospect

Everything added is config-driven from `assets/data.js`. A new prospect build changes data, not
code:

| Config key | Drives |
|---|---|
| `programme.targetNetwork`, `regionRows[].targetNetwork` | Every adoption figure and percentage at every level |
| `network.sites`, `network.people` | The drill-down tables |
| `network.expandedMarket`, `network.expandedSite` | Which market and site drill to full depth |
| `individualLeague` | The individual leaderboard, gaps derived |
| `nextService` and the four other campaign objects | The five campaign pages |
| `commercial.stage`, `commercial.modules`, `commercial.terms` | Which commercial modules appear, and the vocabulary in them |
| `rail[].href` | Whether a campaign is a full page or a summary modal |

`app.js` gained `funnelOf`, `funnelHTML`, `drillRow`, `personRow`, `renderNetwork`,
`personViewHTML`, `renderIndividualLeague`, `resetDemo` and `sparkHTML`. None of them mention
Geely.

## Verification

68 assertions, all passing. 11 recordable moments, all resolving under browser automation.

```
DATA RECONCILIATION   31 assertions   funnel integrity, cross-level sums, campaign arithmetic
CAMPAIGNS              2              five usable pages, five distinct mechanisms
PAGES                 15              no JS errors, no failed requests, no broken images, no stale content
DRILL-DOWN             8              four levels, breadcrumb return, three deep links
RECORDING              4              selectors, KPI size, nothing hover-only, reset
LANGUAGE               3              switch, restore, survives navigation
COMMERCIAL             1              no forbidden or sales language anywhere in the UI
LAYOUT                 4              no overflow, both languages, 1440 and 390
```

## Still open

1. **The programme name is invented.** "Uptime" appears nowhere in Geely's material or the
   research. No trademark check, like FORWARD, ADVANCE and NEXT MOVE.
2. **The brand blue is a reconstruction.** `#0B5FE0`. Borderless Blue has no published hex.
3. **The cyan accent is chosen, not Geely's.** `#3FD2E6`.
4. **A German participant needs German card artwork.** The catalogue is sixteen UK brands from
   Sherbet's own shop, which is why the participant is in the UK.


---

# Addendum — first production VideoSpec pass, 30 August 2026

Written while building `outbound/MARCEL-VIDEO-SPEC.json`. Nothing was redesigned. Two data
defects were fixed and two assertions added.

## Changed

| File | Change | Why |
|---|---|---|
| `assets/data.js` | Geely Bristol moved from position 11 to position 24 in the UK site list | The list renders unsorted, so data order is display order. The list runs descending by network size and Bristol, at 14, sat between two sites of 25. No figure changed, so every sum still reconciles |
| `index.html` | Rail reads `worth £533` rather than `£533 to spend` | It sat directly under the caption "Points balance" showing `533`. One number, two units, nothing joining them |
| `points-bank.html` | Same change | Same reason |
| `assets/i18n.js` | Pattern `^£(n) to spend$` replaced with `^worth £(n)$` → `im Wert von $1 £` | The German faithfully carried the English error through as `533 £ verfügbar` under `Punktestand` |
| `verify.js` | Two assertions added: site table ordered by network size; points balance never printed as bare currency | Both defects were invisible to the existing 68 |
| `RECORDABLE-MOMENTS.json` | RM09 retargeted to the participant home at scroll 0. RM05 and RM06 notes corrected | The language flags are in a top bar that does not stick, so the switch only works at scroll 0 |
| `VIDEO-READINESS-QA.md` | Addendum recording all three findings | |

## Assertion count

68 → 70, all passing. 12 of 12 recordable moments resolve.

## Not changed

The programme name, the brand blue, the cyan accent, the reward catalogue, the campaign
architecture, the commercial modules and the German dictionary are all untouched.

## The lesson worth keeping

The original QA pass verified that every recordable moment resolved and every selector was
visible. Both of these defects were on the participant home, the single most-filmed screen
in the build, and neither was caught. Driving the camera path is a different test from
driving the moment catalogue. Run it for every prospect build before filming.


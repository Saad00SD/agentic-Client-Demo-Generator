# Sherbet demo master rules

Inherited by every prospect build. Geely Uptime is the reference implementation.

The demo is not the outbound asset. The video is. The demo is the environment the video is
recorded from, and the platform Phil demonstrates on the call that follows. Everything below
follows from that: it has to be credible as a genuine client platform first, and easy to film
second.

---

## The floor

A build is not finished until all of this is true.

| # | Rule | How it is checked |
|---|---|---|
| 1 | **Five usable campaign experiences**, minimum | `verify.js` counts rail entries with a real page |
| 2 | **Five different mechanisms**, not five volume incentives | `verify.js` counts distinct campaign types |
| 3 | **At least one leaderboard**, individual preferred | Individual league present and reconciled |
| 4 | **Individual participant performance** available to management | Bottom level of the drill-down |
| 5 | **Network onboarding and adoption against target** | Funnel with target, programme-wide and per market |
| 6 | **Programme → market → site → individual** visibility | Four levels, one page, breadcrumb |
| 7 | **All illustrative data reconciles** | Every cross-level sum asserted |
| 8 | **Deterministic navigation** suitable for recording | Deep links, stable selectors, no loading states |
| 9 | **Defined recordable moments** | `RECORDABLE-MOMENTS.json`, every selector resolving |
| 10 | **Video-safe layout** | No overflow at 1440 and 390, both languages |
| 11 | **No sales CTA inside the product UI** | Forbidden-language assertion over rendered text |

## Structure

Every prospect build is a fork of the reference build with a new `assets/data.js`, new imagery and
a new set of colour tokens. Same layout, same participant menu naming, same page structure, same
campaign archetypes. Only branding, imagery and content change.

If you find yourself editing `app.js` to add a prospect, what you are adding almost certainly
belongs in `data.js`.

**The participant navigation is fixed** and matches the other Sherbet builds label for label:
Home · Campaigns · Shop · Points Bank · Voucher Wallet · Help.

**The management navigation is separate**, because a programme office has no personal points
balance, shop or voucher wallet: Dashboard · Network · Campaigns · AI Analytic · Commercial.

## Campaigns

Five is the floor, not the target. What matters more is the range: a build with five variations
of the same volume incentive demonstrates one idea five times.

The five archetypes the platform already carries:

| Archetype | Shape | Reference implementation |
|---|---|---|
| Accelerator | Banded ladder, rate applies to every unit, not marginal | First Time Fix |
| Conversion / attachment | Capped pot, depleting live, rate per qualifying event | Genuine Parts |
| Certification | Modules with a completion award | EV Service Ready |
| League | Ranked table, individual and site | The Service League |
| Retention / quality | Monthly threshold with a minimum volume floor, binary | Next Service Booked |

Others available where the research supports them: launch activation, team objective, recognition,
customer experience, tactical booster, development pathway.

**Campaign selection is research-driven per prospect.** Pick the mechanisms that match what the
prospect actually manages. A sales-led build and an aftersales-led build should not carry the same
five.

Campaigns beyond the five may exist as summary cards with a modal. Five must open.

## Leaderboards

Individual ranking should normally be demonstrated somewhere. Rank sites, teams or dealers instead
only where that genuinely fits the proposition better.

A useful leaderboard carries participant, site, current rank, previous rank, movement, the measure,
the achievement, points where appropriate, and the distance to the position above. A table without
a gap is a table, not a leaderboard.

**Rank individuals within their own market only.** A market running more campaigns would otherwise
win on volume rather than performance.

**Say plainly that ranking has no connection to pay, employment or appraisal.** It is the first
objection a network development director raises and it is cheap to answer in the terms.

Leaderboard figures must reconcile with the same individuals wherever else they appear.

## Adoption against target

Every build needs a target network. Without it a dashboard can say how many people joined but
never whether that is good, which is the question the programme owner actually has.

The funnel, at every level:

```
TARGET NETWORK  →  INVITED  →  REGISTERED  →  ACTIVE
                            ↘ not yet registered   ↘ lapsed
```

Two ratios carry the story: **registration against target** and **active against registered**.

Rules:

- `notRegistered` and `lapsed` are **derived at render time**, never stored, so they cannot drift.
- The funnel must never widen. Target ≥ invited ≥ registered ≥ active, at every level. Assert it.
- Programme-wide total **and** a market or region breakdown.
- **Spread the market figures.** Two markets clearly ahead, two clearly behind. Seven near-identical
  rows demonstrate nothing, and the whole point is that a manager can see where to act.

## Drill-down

One page, several depths, a breadcrumb. Not four pages that happen to be linked.

Hold the level in the URL hash. That gives the back button, deep links for recording, and a
deterministic entry point for automation at every level.

Render the same funnel component at every level, so the shape a viewer learns at the top still
reads three clicks down.

Expand one market and one site to full depth. Say so on the other markets rather than faking a
depth that is not there.

## Data integrity

One spine in `data.js`. Every view derives from it.

The same figure may appear on the participant home, a campaign page, a leaderboard, an individual
view, a site view, a market view, the programme dashboard, the onboarding view, the Points Bank
and SherBot. It must be the same number in all of them.

Assert, at minimum:

- the ledger sums to the balance, and the wallet to the ledger's redemptions
- every child level sums to its parent on every funnel column
- a participant's points equal the sum of what their own campaign screens show
- campaign weekly rows sum to the campaign totals
- subsets never exceed the population they are drawn from
- the funnel never widens

Write the assertions before the data is finished. They catch what the eye does not: the reference
build had one market invited more people than its target allowed, and nobody spotted it by reading.

## Recording readiness

The build must be filmable by browser automation without a human steadying it.

- **Immediate visual impact on the opening screen**, prospect branding included.
- **Management views understandable in three to five seconds.**
- **Headline KPIs at 26px or larger.** Assert it.
- **Nothing important behind hover.** A recording cannot hover. Assert that no element carries a
  `title` as its only content.
- **Stable selectors.** `data-rm="..."` on every surface a moment targets, independent of class
  names and text.
- **Deterministic navigation.** Deep links to every level. No click sequence the automation has to
  get right.
- **No loading states, no network calls, no first-run state, no cookie banner.**
- **Predictable scrolling.** Important content above the fold at 1440×900 wherever possible.
- **A reset to a known state.** `?reset=1` and a keyboard shortcut. Clears language, level and
  scroll. Not a visible control: it belongs to whoever is filming.
- **Animations must settle.** Nothing that runs indefinitely or that the capture can catch halfway.

None of this may cost the product its credibility. If a change makes the demo easier to film and
less believable, do not make it.

## Recordable moments

Document six to ten. A smaller number of excellent moments beats a padded list.

Each carries: id, page, purpose, what is on screen, persona relevance, navigation steps, dwell
time, whether scrolling is needed, and the DOM selector.

**Verify that every selector actually resolves** by driving the navigation in a headless browser.
A catalogue that has drifted from the build is worse than none.

Mark which pages must **not** be recorded, and why.

## Personas from one build

One prospect build, several narratives. Do not build five demos.

| Persona | Emphasise |
|---|---|
| Senior / regional leadership | Programme adoption, cross-market visibility, management insight |
| Sales / commercial | Campaigns, individual performance, leaderboard, target achievement |
| Aftersales | Parts and service campaigns, site performance, retention and quality |
| Network / dealer development | Onboarding, dealer adoption, engagement, market and site drill-down |
| Marketing / CX | Campaign activation, participant engagement, recognition |

## Commercial modules and stage

Two reusable modules, built for every prospect, shown according to stage. Record the decision in
config rather than improvising it at build time.

| Stage | Pilot and Scale | Commercial Model | Indicative investment |
|---|---|---|---|
| Cold or first outreach | Available, sometimes shown | Built, kept off the recommended path | No |
| First live demo | Available | Available, do not lead with it | No |
| Qualified or second stage | In the journey | In the journey | Consider, prospect-specific |
| Proposal | In the journey | Explicit and prospect-specific | Yes |

Generic commercial copy carries `{network}` and `{networkSize}` resolved from config. Referring to
"the OEM" tells a dealer group, a distributor and a fleet operator that this was written for
somebody else.

No prices, fees, margins, per-user rates or budget figures in a prospect-facing demo. Never
describe Sherbet's own reward or redemption economics. Avoid the word "transparent" in relation to
redemption, fulfilment, margins, fees or commercial structure: it invites the question it is trying
to close.

## What never goes in the product UI

No prospecting language. No meeting CTAs. No booking buttons. No "get in touch". No sales
messaging of any kind.

The demo must be credible as a genuine client platform. The CTA lives in the video narration and in
the message that delivers it, and both belong to the video layer.

Assert this over rendered text rather than trusting it.

## Depth, deliberately

The teaser shows two or three things in 45 to 60 seconds. The build must have enough depth that
plenty is left unseen, so the live demonstration is worth fifteen minutes of somebody's time.

Do not optimise the build around producing a complete video walkthrough. A demo that fits entirely
into a teaser has nothing left to demonstrate.

## Deliverables per build

1. The working demo
2. `CHANGELOG.md`
3. `RECORDABLE-MOMENTS.json`
4. `VIDEO-READINESS-QA.md`
5. `verify.js`, passing
6. A build note in the project, including anything invented and not yet verified

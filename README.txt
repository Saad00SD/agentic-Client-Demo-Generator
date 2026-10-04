GEELY UPTIME — Sherbet demonstration build
==========================================

Open index.html in a browser. No server needed, no build step, no network calls.

WHAT THIS IS
This is the Lepas Ascent build with Geely branding, Geely imagery and aftersales
content. Same layout, same menu naming, same page structure, same four campaign
archetypes. Only branding, imagery and content change, which is the rule for
every prospect mock-up.

PAGES
Participant
  index.html               Home
  campaigns.html           Campaigns
  first-time-fix.html      Accelerator      · banded ladder
  genuine-parts.html       Conversion       · capped pot
  ev-service-ready.html    Certification    · four modules
  service-league.html      League           · individual and service centre
  next-service-booked.html Retention        · monthly threshold
  points-bank.html         Points Bank
  shop.html                Shop
  voucher-wallet.html      Voucher Wallet
  help.html                Help

Programme office (Role selector, or the management nav)
  dashboard.html           Programme dashboard, adoption band at the top
  network.html             Adoption against target, and the drill-down
  sherbot.html             AI Analytic
  commercial.html          Pilot and Scale, Commercial Model

THE DRILL-DOWN
network.html walks Europe > market > service centre > individual on one page.
The level is in the URL, so you can link straight to a depth:

  network.html#France
  network.html#United%20Kingdom/Geely%20Bristol
  network.html#United%20Kingdom/Geely%20Bristol/GEE-BRS-02

BEFORE RECORDING
Reset to a known state with ?reset=1 on any URL, or press Shift+0.
That clears the language, the drill level and the scroll position. Nothing
else in the build carries state.

VERIFY
  python3 -m http.server 8099 &
  node verify.js
68 assertions covering reconciliation, campaigns, pages, drill-down,
recording readiness, language, commercial guardrails and layout.

OTHER DOCUMENTS
  CHANGELOG.md             What changed in this pass and why
  MASTER-DEMO-RULES.md     Rules every future prospect build inherits
  RECORDABLE-MOMENTS.json  The catalogue the video system reads
  VIDEO-READINESS-QA.md    Pass/fail assessment
  VIDEO-LAYER-NOTES.md     Requirements for the video system

SWITCHING PERSPECTIVE
The Role selector in the dark bar moves between the two sides of the programme.
Geely service partner roles land on the participant view. Geely Europe roles land
on the programme dashboard. On the dashboard the Market selector rescopes every
KPI to one market.

THE COMMERCIAL PAGE
Two modules, Pilot and Scale and Commercial Model. They sit behind the Role
switch because they answer a buyer's question, not a service adviser's.

Marcel has not replied to anything, so this is a cold approach, and at cold stage
neither belongs in the recorded walkthrough. They are built and reachable so the
answer exists the moment a conversation needs it.

There are no prices on that page, deliberately. A seven-market programme prices
differently from a single-market pilot, and Indicative Investment is not built.

LANGUAGE
Two flags at the top right, English and German. The switch translates the whole
participant journey, holds across every page, and survives navigation. It is a
language setting, not a market one: sites, currency and the reward catalogue are
the same in both.

The programme office view stays in English, because Geely Europe's office in
Amsterdam works in English.

THE PARTICIPANT
Claire Bowen, Service Adviser, Geely Bristol, account GEE-BRS-02. Invented. No
real Geely partner, site or colleague is named anywhere in this build.

The participant is in the UK because every reward card in the catalogue is a UK
brand from Sherbet's own shop. A German participant needs German card artwork
first; that is a supply question, not a build one.

CURRENCY AND POINTS
One point is one unit of the participant's own currency, so the participant
screens are in sterling. Programme-wide figures are shown in points rather than
converted, because points are the unit that travels across seven markets.
Points are credited when the job is invoiced and spent in the shop. There is no
cash-out route and no account-credit route, which follows the evidenced BYD
manufacturer-funded model.

ASSETS
Vehicle and workshop photography is Geely's own, supplied by the client. The
logo is Geely's, converted to a transparent PNG. Nothing is generated, traced or
upscaled, and no stock photography is used.

Reward card artwork is Sherbet's own shop artwork at native resolution. The two
signature-tier lines have no card artwork and use the built-in icon treatment,
which is what the source build does.

TWO THINGS TO CHECK BEFORE THIS GOES TO A NAMED CONTACT
1. The brand blue is #0B5FE0, a reconstruction. Geely's primary is named
   Borderless Blue but no hex is published. Eyedropper it from their site.
2. The cyan accent #3FD2E6 is chosen, not Geely's. Their identity carries no
   bright secondary and the template needs one light enough for black text.

EVERY FIGURE IS ILLUSTRATIVE. The pages say so throughout.

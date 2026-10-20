/* ============================================================
   XPENG Proving Ground — demonstration data spine
   ------------------------------------------------------------
   ALL FIGURES BELOW ARE ILLUSTRATIVE CONCEPT DATA.
   Defined once here so every screen reconciles.

   Cloned from the XPENG Vector master. Same layout, same menu
   naming, same five campaign archetypes. What changed is the
   side of the business: XPENG Vector rewards aftersales
   behaviour, this rewards retail sales behaviour, because the
   problem a distributor has with a brand nobody has heard of is
   getting people to demonstrate it, not to service it.

   KEY NAMES ARE ARCHETYPE SLOTS, NOT CAMPAIGN NAMES. The key
   `firstTimeFix` carries whatever accelerator campaign this
   build runs, here Test Drive. Renaming the keys to the
   archetypes properly is a factory job worth doing once across
   every build, not a per-clone edit. Recorded in the build
   notes rather than done here.

   Points convention: one point equals one unit of the
   participant's own local currency. This programme is UK only,
   so participant screens and programme figures are both in
   sterling, and the points-versus-currency question the
   multi-market builds have does not arise.

   Vocabulary note: this is the English master. Every nav label,
   section name and campaign name matches the other Sherbet
   builds. Only the content changes.
   ============================================================ */

const DEMO = {

  asOf: '24 September',
  period: 'September 2026',
  daysLeft: 6,

  /* --- The participant --------------------------------------
     A sales executive at an XPENG retailer in the UK. The
     retailer and the person are invented; no real XPENG retailer
     or colleague is named anywhere in this build.

     Every reward card in the catalogue is a UK brand from
     Sherbet's own shop, which is correct here because the whole
     programme is UK.
     -------------------------------------------------------- */
  customer: {
    business : 'XPENG Guildford',
    town     : 'Guildford',
    owner    : 'Dan Whitfield',
    initials : 'DW',
    account  : 'XP-GLD-04',
    branch   : 'Guildford',
    since    : 'February 2026',
    profile  : 'Sales Executive · United Kingdom',
    rolling  : 12             // rolling monthly average, completed test drives
  },

  /* --- Points balance --------------------------------------
     Credited when the drive is logged and the order delivered.
     -------------------------------------------------------- */
  points: {
    balance : 346,
    ledger  : [
      { date:'30 Aug', dir:'in',  label:'Test Drive',            sub:'August · Accelerate rate on 18 drives', pts: 126 },
      { date:'12 Sep', dir:'in',  label:'Order to Delivery',     sub:'Orders converted from a test drive',    pts: 175 },
      { date:'18 Sep', dir:'in',  label:'Product Certification', sub:'Three modules completed',               pts: 105 },
      { date:'22 Sep', dir:'in',  label:'Demonstrator Days',     sub:'August availability award',             pts:  80 },
      { date:'05 Sep', dir:'out', label:'Tui gift card',          sub:'Redeemed from the shop',                pts:-100 },
      { date:'14 Sep', dir:'out', label:'Wagamama gift card',     sub:'Redeemed from the shop',                pts: -20 },
      { date:'19 Sep', dir:'out', label:'Ticketmaster gift card', sub:'Redeemed from the shop',                pts: -20 }
    ]
  },

  /* --- Voucher wallet --------------------------------------
     Every voucher matches a redemption in the ledger above.
     -------------------------------------------------------- */
  wallet: [
    { name:'Tui',          value:100, pts:100, code:'TUI-6614-2073-GE',
      issued:'05 Sep 2026', expires:'05 Sep 2027', status:'ready',
      img:'assets/rewards/tui.jpg' },
    { name:'Wagamama',     value:20,  pts:20,  code:'WAG-3390-8815-DR',
      issued:'14 Sep 2026', expires:'14 Sep 2027', status:'ready',
      img:'assets/rewards/wagamama.jpg' },
    { name:'Ticketmaster', value:20,  pts:20,  code:'TKM-1128-4506-QN',
      issued:'19 Sep 2026', expires:'19 Sep 2027', status:'used', usedOn:'21 Sep 2026',
      img:'assets/rewards/ticketmaster.jpg' }
  ],

  /* --- Voice of the Network ---------------------------------
     COMING SOON. Not live functionality.

     Rendered by the shared master module, assets/von.js. Nothing
     here is carried from another build: despite sharing Geely
     Uptime's page skeleton, Vector rewards retail sales
     behaviour, so it draws its question from the Sales bank
     rather than the Aftersales one Geely Uptime uses — a
     different pick again from the ones Polestar and Ascent
     already use, so no two of the four builds read identically.
     The competitor set is a fresh cross-shop for an unfamiliar
     EV brand's own retail segment (Tesla, BYD, MG, Volvo), not a
     copy of Polestar's premium set or Ascent's value set, even
     where an individual brand name legitimately appears in more
     than one list.
     -------------------------------------------------------- */
  von: {
    status     : 'Coming soon',
    brandLabel : 'Voice of the Network',

    trigger: {
      amount : '+140',
      label  : 'Points credited',
      sub    : 'Order to Delivery · latest confirmed order this month'
    },

    question  : 'What would have made this sale easier?',
    options   : ['Test drive availability','Finance approval speed','Stock availability','Delivery timing','Nothing'],
    preselect : 'Test drive availability',
    record    : 'Record audio',
    type      : 'Type a few words',
    footnote  : 'Occasional. Never more than one question at a time, and always skippable.',

    classify: {
      label     : 'Competitor mentioned',
      question  : 'Who came up?',
      options   : ['Tesla','BYD','MG','Volvo','Other'],
      preselect : 'Tesla'
    },

    recording: {
      label      : 'One sentence',
      time       : '00:06',
      transcript : '“Customer was cross-shopping a Model Y, but a same-day demonstrator slot and a clear range comparison closed it.”',
      stop       : 'Stop & send'
    },

    always: {
      label : "Tell us what you're seeing",
      sub   : 'Any time, not only after a result. One tap, then say it or type it.',
      categories: [
        { t:'Lost a sale',          s:'What stopped the customer ordering?' },
        { t:'Competitor mentioned', s:'Which competitor came up?' },
        { t:'Customer objection',   s:'What objection are you hearing?' },
        { t:'Something we need',    s:'What would help you sell more?' }
      ]
    },

    intelligence: {
      status   : 'Coming soon',
      headline : 'What your network is telling you',
      basis    : 'Illustrative. Read across 274 signals · 478 enrolled specialists · United Kingdom · September 2026',
      signals: [
        { k:'Competitor',        v:'Tesla mentions up 22% this quarter' },
        { k:'Objection',         v:'Demonstrator availability now the leading customer objection' },
        { k:'Winning behaviour', v:'A same-day test drive strongly associated with a placed order' },
        { k:'Network request',   v:'Retailers asking for range-comparison material against Tesla and BYD' }
      ],
      recommendation:
        'Protect same-day demonstrator availability at the retailers where it has slipped, and get a clear range '
        + 'comparison against Tesla and BYD into every showroom. Both sit inside Demonstrator Days and Product '
        + 'Certification rather than needing a new campaign, and both are evidenced by the network rather than by a consultant.',
      /* 96 competitor + 84 objection + 61 won or lost + 33 requests = 274 */
      breakdown: [
        { k:'Competitor mentioned', v:96 },
        { k:'Customer objection',   v:84 },
        { k:'Won or lost',          v:61 },
        { k:'Something we need',    v:33 }
      ]
    }
  },

  /* --- Test Drive (Accelerator Incentive) -------------------
     Bands are completed test drives, set from the retailer's own
     rolling monthly average of twelve. A drive counts when the
     customer has driven the car and the drive is logged against
     a named prospect record, which is why it is credited in
     arrears rather than on the day.

     Every qualifying drive earns at the rate of the highest band
     reached, applied to every drive in the period, not just the
     ones above the line. At 24 September the executive has 14
     completed drives and is two from Accelerate with six days to
     go. Five of those have converted to an order, which is the
     population the conversion campaign counts.

     The test drive is the measure because an unfamiliar brand is
     not sold from a brochure. It is the one behaviour a
     distributor can ask for and a retailer can control.
     -------------------------------------------------------- */
  firstTimeFix: {
    unitsToDate : 14,
    bands: [
      { name:'Qualify',    target:12, rate:5 },
      { name:'Accelerate', target:16, rate:7 },
      { name:'Elevate',    target:20, rate:9 }
    ],
    weekly: [
      { range:'01 – 07 Sep', cumulative: 4 },
      { range:'08 – 14 Sep', cumulative: 8 },
      { range:'15 – 21 Sep', cumulative:11 },
      { range:'22 – 24 Sep', cumulative:14 }
    ]
  },

  /* --- Order to Delivery (Conversion Incentive) -------------
     Points on every order placed by a customer who took a test
     drive first. The measure is conversion, not order value, so
     a G6 counts the same as a G9 and nobody is pushed at the
     expensive car.

     The pot is capped nationally and depletes live, which is what
     makes the campaign budgetable before it starts.
     -------------------------------------------------------- */
  genuineParts: {
    ratePerOrder : 25,          // per order converted from a test drive
    drives       : 14,          // completed test drives, the population the ladder counts
    orders       :  5,          // of those, orders placed
    networkRate  : 31,          // network average conversion rate, %
    potTotal     : 90000,
    potIssued    : 38150,
    rows: [
      { date:'01 – 07 Sep', n: 1, reward: 25 },
      { date:'08 – 14 Sep', n: 2, reward: 50 },
      { date:'15 – 21 Sep', n: 1, reward: 25 },
      { date:'22 – 24 Sep', n: 1, reward: 25 }
    ]
  },

  /* --- Product Certification -------------------------------
     A retailer network selling an unfamiliar brand has people
     who can sell a car but cannot yet explain this one. Four
     modules, paid per module, with a completion award.
     -------------------------------------------------------- */
  certification: {
    perModule  : 35,
    completion : 140,           // paid on finishing all four
    modules: [
      { name:'The range, and who each car is for', done:true  },
      { name:'Charging, range and running costs',  done:true  },
      { name:'Assisted driving, explained simply', done:true  },
      { name:'Handover and the first ninety days', done:false }
    ]
  },

  /* --- Campaigns running now (home rail) -------------------
     Cards 1-5 open real campaign pages. Cards 6-8 open a summary
     modal: the mechanics are evidenced, the detail pages simply
     are not part of this walkthrough.

     Five usable campaigns is the floor, and they have to be five
     different mechanisms rather than five volume incentives.
     Here: a ladder, a capped pot, a module count, a league and a
     monthly threshold.
     -------------------------------------------------------- */
  rail: [
    { id:'test-drive', name:'Test Drive', type:'Accelerator Incentive',
      img:'assets/img/kv-test-drive.jpg', href:'first-time-fix.html',
      blurb:'Every completed test drive earns, and the rate accelerates across the whole month once you clear the next band.',
      status:'2 drives from Accelerate' },
    { id:'order-to-delivery', name:'Order to Delivery', type:'Conversion Incentive',
      img:'assets/img/kv-order-to-delivery.jpg', href:'genuine-parts.html',
      blurb:'Points on every order placed by a customer who drove the car first. Conversion counts, not order value.',
      status:'£125 earned' },
    { id:'product-certification', name:'Product Certification', type:'Certification',
      img:'assets/img/kv-product-certification.jpg', href:'ev-service-ready.html',
      blurb:'Four modules on the range, charging and running costs, assisted driving and handover. Paid per module, with a completion award.',
      status:'3 of 4 modules' },
    { id:'league', name:'The Retailer League', type:'League Incentive',
      img:'assets/img/kv-retailer-league.jpg', href:'service-league.html',
      blurb:'Your retailer against the rest of the UK network across four measures. Provisional standings update weekly.',
      status:'9th of 68, up 4' },
    { id:'demonstrator', name:'Demonstrator Days', type:'Retention Incentive',
      img:'assets/img/kv-demonstrator-days.jpg', href:'next-service-booked.html',
      blurb:'A monthly award for keeping the demonstrator out with customers rather than parked, because a car nobody drives sells nothing.',
      status:'62% of days out',
      modal:{
        lede:'A demonstrator sitting on the forecourt is the most expensive parked car in the business. This campaign pays for it being out with customers, not for it existing.',
        rows:[['Mechanic','Fixed award at or above a 55% availability rate, on a minimum of fifteen working days.'],
              ['Measure','Days the demonstrator is booked out to a named customer, logged in the diary.'],
              ['Award','80 points a month, £80 to a UK participant.'],
              ['Period','Monthly, running continuously.'],
              ['Your rate','58% across 19 working days in August.']],
        note:'Volume campaigns and utilisation campaigns run at the same time on purpose. A programme that only pays for throughput teaches the network to chase throughput.' } },
    { id:'finance', name:'Finance and Protection', type:'Attachment Incentive',
      img:'assets/img/kv-finance.jpg', href:'#',
      blurb:'Points on finance and protection products arranged alongside the car, measured per order rather than in total value.',
      status:'Opens 1 October',
      modal:{
        lede:'Attachment is where a retail order either stands on its own or does not. This campaign pays per order rather than on value, so nobody is pushed at the expensive product.',
        rows:[['Mechanic','Rate per order with a finance or protection product attached.'],
              ['Qualifying','Arranged and activated on the same order as the vehicle.'],
              ['Pot','45,000 points nationally, capped, depleting live.'],
              ['Period','1 October to 31 December.'],
              ['Note','Measured per order, never on value, so the incentive cannot pull against the customer.']],
        note:'Two campaigns can run at once on different behaviours without competing, because each carries its own pot and its own baseline.' } },
    { id:'pathway', name:'Sales Pathway', type:'Development Incentive',
      img:'assets/img/kv-sales-pathway.jpg', href:'#',
      blurb:'Points as executives move through the product levels, awarded to the individual and again to the retailer when the whole team clears a level.',
      status:'Illustrative concept',
      modal:{
        lede:'An illustrative concept only. It shows how a development mechanic would sit on the platform, not a campaign anybody has agreed.',
        rows:[['Mechanic','Two stage. Points to the individual on each level cleared, and to the retailer when every executive has cleared it.'],
              ['Qualifying','Level confirmed on the distributor’s own training record.'],
              ['Award','120 points per level to the individual, 400 to the retailer.'],
              ['Period','Illustrative.'],
              ['Status','Concept. Nothing here is contracted.']],
        note:'Shown because a network selling an unfamiliar brand has a knowledge backlog before it has a volume problem, and the platform can read the training record without any new system.' } },
    { id:'handover', name:'Handover Quality', type:'Quality Incentive',
      img:'assets/img/kv-handover-quality.jpg', href:'#',
      blurb:'Points for handovers scored well by the customer in the first ninety days, because the second car is decided at the first one.',
      status:'Opens with the new plate',
      modal:{
        lede:'A poor handover on an unfamiliar brand costs the next purchase and the referral behind it. This campaign pays for the score, not for the delivery.',
        rows:[['Mechanic','Points per handover scored above the retailer’s own current baseline.'],
              ['Qualifying','Customer survey returned inside ninety days of delivery.'],
              ['Award','30 points per qualifying handover.'],
              ['Period','From the new plate.'],
              ['Note','Aftersales, parts and the contact centre can be brought alongside sales on the same platform.']],
        note:'The BYD regional programme runs the same pattern: one department first, then the rest of the business on the same pot and the same reporting.' } }
  ],

  /* --- The Retailer League ---------------------------------
     Retailers are ranked, never individuals. Retailer names are
     invented; no real XPENG retailer is named.
     -------------------------------------------------------- */
  league: {
    region     : 'the UK',
    participants: 68,          // retailers in the network, matches programme.branches
    status     : 'PROVISIONAL',
    updated    : '24 September',
    metrics    : ['Test drive rate','Order conversion','Product certification','Handover score'],
    maxPerMetric: 10,
    rows: [
      { rank: 1, prev: 2, name:'XPENG Croydon',    town:'Croydon',    s:[10,9,9,8],  total:36 },
      { rank: 2, prev: 1, name:'XPENG Reading',    town:'Reading',    s:[9,9,8,9],   total:35 },
      { rank: 3, prev: 5, name:'XPENG Brighton',   town:'Brighton',   s:[8,9,9,7],   total:33 },
      { rank: 4, prev: 3, name:'XPENG Maidstone',  town:'Maidstone',  s:[9,7,8,7],   total:31 },
      { rank: 5, prev: 8, name:'XPENG Chelmsford', town:'Chelmsford', s:[8,8,7,7],   total:30 }
    ],
    me: { rank:9, prev:13, name:'XPENG Guildford', town:'Guildford', s:[8,9,5,7], total:29 },
    prizes: [
      { place:'1st', pts:600, cash:600 },
      { place:'2nd', pts:350, cash:350 },
      { place:'3rd', pts:200, cash:200 }
    ]
  },

  /* --- Recognition ----------------------------------------- */
  recognition: {
    winners: [
      { name:'XPENG Croydon',    town:'Croydon',
        why:'Highest test drive rate in the UK network across the launch quarter.' },
      { name:'XPENG Reading',    town:'Reading',
        why:'Highest handover score in the network, held across the whole quarter.' },
      { name:'XPENG Chelmsford', town:'Chelmsford',
        why:'Smallest retailer in the region, and the biggest climb of the quarter, up three places.' }
    ]
  },


  /* --- Reward catalogue -------------------------------------
     Card artwork is Sherbet's own shop artwork, at the native
     resolution it ships at. Nothing redrawn, generated or
     upscaled. The catalogue is the UK one, which is why the
     participant is a UK sales executive.

     Points are spent here and nowhere else: there is no
     cash-out and no account credit on a distributor-funded
     programme, which is the evidenced BYD model.
     -------------------------------------------------------- */
  rewards: [
    { n:'Ticketmaster',     t:'Entertainment', p:20,  img:'assets/rewards/ticketmaster.jpg' },
    { n:'JD Sports',        t:'Retail',        p:20,  img:'assets/rewards/jd-sports.jpg' },
    { n:'Superdry',         t:'Retail',        p:25,  img:'assets/rewards/superdry.jpg' },
    { n:'The Body Shop',    t:'Retail',        p:15,  img:'assets/rewards/the-body-shop.jpg' },
    { n:'Screwfix',         t:'Retail',        p:25,  img:'assets/rewards/screwfix.jpg' },
    { n:'Pizza Express',    t:'Dining',        p:15,  img:'assets/rewards/pizza-express.jpg' },
    { n:'Zizzi',            t:'Dining',        p:15,  img:'assets/rewards/zizzi.jpg' },
    { n:'Wagamama',         t:'Dining',        p:20,  img:'assets/rewards/wagamama.jpg' },
    { n:'Ernest Jones',     t:'Retail',        p:50,  img:'assets/rewards/ernest-jones.jpg' },
    { n:'National Express', t:'Travel',        p:25,  img:'assets/rewards/national-express.jpg' },
    { n:'TravelCard',       t:'Travel',        p:50,  img:'assets/rewards/travel-card.jpg' },
    { n:'Tui',              t:'Travel',        p:100, img:'assets/rewards/tui.jpg' }
  ],

  /* --- Signature tier --------------------------------------
     The top of the catalogue.
     -------------------------------------------------------- */
  signature: [
    { n:'Track day for two',       t:'Signature', p:250, icon:'track',
      img:'assets/img/xpeng-china-track-day.jpg',
      note:'A UK circuit, tuition included' },
    { n:'Brand home visit, China', t:'Signature', p:900, icon:'plant',
      img:'assets/img/shop_img1.jpg',
      note:'Four places a quarter, travel included' }
  ],

  experiences: [
    { n:'Supercar driving experience', t:'Experiences', p:75,  img:'assets/rewards/supercar-driving.jpg' },
    { n:'Team day for eight',          t:'Team days',   p:75,  img:'assets/rewards/paintballing.jpg' },
    { n:'Gin experience for 2',        t:'Experiences', p:80,  img:'assets/rewards/gin-experience.jpg' },
    { n:'Unique dining for 2',         t:'Experiences', p:100, img:'assets/rewards/unique-dining.jpg' }
  ],

  /* --- Programme-wide (XPENG UK programme office) -------
     The four live views evidenced in the BYD material:
     enrolment, engagement, activity attribution, reward spend.

     Region rows must sum to the totals above them, because the
     first question a programme office asks a dashboard is
     whether it adds up.
     -------------------------------------------------------- */
  programme: {
    /* The adoption funnel. targetNetwork is the network the distributor
       intends to have on the programme, which is the number every other
       figure is judged against. Without it a dashboard can only say how
       many people joined, never whether that is good.

       notRegistered and lapsed are derived, not stored, so they cannot
       drift: notRegistered = invited - enrolled, lapsed = enrolled - active. */
    targetNetwork: 640,         // people the programme is meant to reach
    branches   : 68,            // retailers
    regions    : 7,             // UK regions
    invited    : 606,
    enrolled   : 478,
    activeMonth: 394,
    rewardPts  : 41800,
    onTrack    : 246,           // of activeMonth, Test Drive

    /* Region rows carry their own target so the distributor can see where
       onboarding is ahead and where it is behind, rather than only who is
       biggest. The South West and Wales & West are deliberately behind: a
       dashboard where every region looks the same demonstrates nothing. */
    regionRows: [
      { region:'South East',   targetNetwork:132, sites:14, invited:126, enrolled:108, active:92 },
      { region:'North West',   targetNetwork:108, sites:12, invited:103, enrolled: 86, active:72 },
      { region:'Midlands',     targetNetwork:102, sites:11, invited: 97, enrolled: 79, active:66 },
      { region:'Scotland',     targetNetwork: 84, sites: 9, invited: 79, enrolled: 61, active:49 },
      { region:'Yorkshire',    targetNetwork: 78, sites: 8, invited: 74, enrolled: 57, active:46 },
      { region:'South West',   targetNetwork: 76, sites: 8, invited: 71, enrolled: 50, active:40 },
      { region:'Wales & West', targetNetwork: 60, sites: 6, invited: 56, enrolled: 37, active:29 }
    ],
    rewardByCampaign: [
      { name:'Test Drive',            pts:16400 },
      { name:'Order to Delivery',     pts:13900 },
      { name:'Product Certification', pts: 7900 },
      { name:'Demonstrator Days',     pts: 3600 }
    ],
    campaignHealth: [
      { name:'Test Drive',            onTarget:246, below:148, avg:'88% of band target'  },
      { name:'Order to Delivery',     onTarget:201, below:193, avg:'31% conversion'      },
      { name:'Product Certification', onTarget:274, below:120, avg:'2.8 of 4 modules'    }
    ],
    logins: [
      { d:'01 Sep', v:131 }, { d:'04 Sep', v:189 }, { d:'07 Sep', v:224 },
      { d:'10 Sep', v:158 }, { d:'13 Sep', v:257 }, { d:'16 Sep', v:204 },
      { d:'19 Sep', v:289 }
    ]
  },


  /* --- The network, one level down -------------------------
     The drill is United Kingdom -> region -> retailer ->
     individual. Only the South East is expanded to retailer level
     and only XPENG Guildford to individual level, because that is
     the path the demonstration walks. Every other region drills to
     its own summary and says so, rather than pretending to a depth
     that is not there.

     Retailer rows sum exactly to the South East region row on all
     four columns: target 132, invited 126, registered 108, active
     92. The table is ordered by network size, descending, because
     the data order is the displayed order. Canterbury and
     Tunbridge Wells are deliberately behind.
     -------------------------------------------------------- */
  network: {
    expandedRegion: 'South East',
    expandedSite  : 'XPENG Guildford',
    sites: [
      { name:'XPENG Croydon',         town:'Croydon',         targetNetwork:13, invited:13, enrolled:12, active:10 },
      { name:'XPENG Reading',         town:'Reading',         targetNetwork:12, invited:12, enrolled:11, active: 9 },
      { name:'XPENG Brighton',        town:'Brighton',        targetNetwork:12, invited:11, enrolled:10, active: 9 },
      { name:'XPENG Maidstone',       town:'Maidstone',       targetNetwork:11, invited:11, enrolled:10, active: 9 },
      { name:'XPENG Chelmsford',      town:'Chelmsford',      targetNetwork:11, invited:10, enrolled: 9, active: 8 },
      { name:'XPENG Watford',         town:'Watford',         targetNetwork:10, invited:10, enrolled: 9, active: 8 },
      { name:'XPENG Milton Keynes',   town:'Milton Keynes',   targetNetwork:10, invited: 9, enrolled: 8, active: 7 },
      { name:'XPENG Guildford',       town:'Guildford',       targetNetwork: 9, invited: 9, enrolled: 8, active: 7 },
      { name:'XPENG Basingstoke',     town:'Basingstoke',     targetNetwork: 9, invited: 9, enrolled: 8, active: 7 },
      { name:'XPENG Southampton',     town:'Southampton',     targetNetwork: 9, invited: 8, enrolled: 7, active: 6 },
      { name:'XPENG Oxford',          town:'Oxford',          targetNetwork: 8, invited: 8, enrolled: 6, active: 5 },
      { name:'XPENG Portsmouth',      town:'Portsmouth',      targetNetwork: 8, invited: 7, enrolled: 5, active: 4 },
      { name:'XPENG Canterbury',      town:'Canterbury',      targetNetwork: 6, invited: 5, enrolled: 4, active: 2 },
      { name:'XPENG Tunbridge Wells', town:'Tunbridge Wells', targetNetwork: 4, invited: 4, enrolled: 1, active: 1 }
    ],

    /* XPENG Guildford's roster. Eight registered, seven active, which is
       exactly the retailer row above. Points are period earnings and Dan
       Whitfield's own figure is the sum of his campaign screens, not a
       number typed here. */
    people: [
      { id:'XP-GLD-01', name:'Priya Raman', role:'Sales Manager', status:'active', pts:385 },
      { id:'XP-GLD-04', name:'Dan Whitfield', role:'Sales Executive', status:'active', pts:300, me:true },
      { id:'XP-GLD-02', name:'Owen Traynor', role:'Sales Executive', status:'active', pts:284 },
      { id:'XP-GLD-06', name:'Sofia Nkemelu', role:'Sales Executive', status:'active', pts:241 },
      { id:'XP-GLD-03', name:'Callum Reid', role:'Sales Executive', status:'active', pts:228 },
      { id:'XP-GLD-07', name:'Hannah Beecroft', role:'Business Manager', status:'active', pts:196 },
      { id:'XP-GLD-05', name:'Jacob Ellery', role:'Sales Executive', status:'active', pts:154 },
      { id:'XP-GLD-08', name:'Marta Kowal', role:'Transaction Manager', status:'lapsed', pts:0 }
    ]
  },

  individualLeague: {
    region      : 'the UK',
    participants: 478,
    measure     : 'Points earned this period',
    status      : 'PROVISIONAL',
    updated     : '24 September',
    rows: [
      { rank: 1, prev: 1, name:'Leah Ashworth',  site:'XPENG Croydon',     role:'Sales Executive',  pts:438 },
      { rank: 2, prev: 3, name:'Marcus Reid',    site:'XPENG Reading',     role:'Sales Executive',  pts:412 },
      { rank: 3, prev: 2, name:'Priya Raman',    site:'XPENG Guildford',   role:'Sales Manager',    pts:385 },
      { rank: 4, prev: 6, name:'Tom Ellery',     site:'XPENG Brighton',    role:'Sales Executive',  pts:356 },
      { rank: 5, prev: 4, name:'Sofia Almeida',  site:'XPENG Maidstone',   role:'Business Manager', pts:331 },
      { rank: 6, prev: 9, name:'Dan Whitfield',  site:'XPENG Guildford',   role:'Sales Executive',  pts:300, me:true },
      { rank: 7, prev: 7, name:'Ryan Mercer',    site:'XPENG Chelmsford',  role:'Sales Executive',  pts:284 },
      { rank: 8, prev: 8, name:'Aisha Karim',    site:'XPENG Watford',     role:'Sales Executive',  pts:267 },
      { rank: 9, prev:12, name:'Joe Fenton',     site:'XPENG Southampton', role:'Sales Executive',  pts:241 },
      { rank:10, prev:10, name:'Hannah Coe',     site:'XPENG Oxford',      role:'Business Manager', pts:228 }
    ],
    prizes: [
      { place:'1st', pts:300 },
      { place:'2nd', pts:200 },
      { place:'3rd', pts:100 }
    ]
  },


  /* --- Demonstrator Days (Retention Incentive) --------------
     The fifth campaign, and a different mechanism again: a
     threshold rather than a ladder, a pot or a module count. The
     award is monthly and binary, which is the right shape for a
     behaviour that either happened on a given day or did not.

     The day population is the twenty-six working days in the
     period. Of those, the demonstrator was booked out to a named
     customer on sixteen.
     -------------------------------------------------------- */
  nextService: {
    threshold  : 55,            // % of working days required
    minJobs    : 15,            // qualifying floor, working days
    award      : 80,            // points, paid monthly
    jobs       : 26,            // working days in the period
    booked     : 16,            // days the demonstrator was out
    networkRate: 47,            // network average, %
    lastPeriod : { jobs:19, booked:11, achieved:true },
    weekly: [
      { range:'01 – 07 Sep', jobs: 5, booked:3 },
      { range:'08 – 14 Sep', jobs: 6, booked:4 },
      { range:'15 – 21 Sep', jobs: 6, booked:4 },
      { range:'22 – 24 Sep', jobs: 9, booked:5 }
    ]
  },


  commercial: {
    stage   : 'warm',
    modules : { pilotAndScale:true, commercialModel:true, indicativeInvestment:false },
    terms   : { network:'the retailer network', networkSize:'network size' },

    pilot: {
      title: 'Start small. Prove it. Scale it.',
      sub  : 'Beginning does not mean committing everything at once.',
      steps: [
        { n:'Pilot',        b:'One market, one objective, or a selected part of {network}.' },
        { n:'Prove',        b:'Measure engagement, behaviour change and performance against the baseline.' },
        { n:'Scale',        b:'Extend campaigns, participants and {network} coverage.' },
        { n:'Multi-market', b:'One platform, local execution, central visibility.' }
      ],
      note : 'Each stage earns the next. Nothing here requires a commitment across the whole network on day one.'
    },

    model: {
      title: 'A model designed to scale with your network',
      sub  : 'Commercial structure tailored to {networkSize}, regions, programme scope and reward funding.',
      parts: [
        { n:'Platform and management', b:'Programme setup, platform, campaign management, reporting and support.' },
        { n:'Programme funding',       b:'Flexible budgets allocated to campaigns, incentives and performance initiatives.' },
        { n:'Rewards and fulfilment',  b:'A fully managed reward experience, from participant choice through to redemption and fulfilment.' },
        { n:'Scale',                   b:'Start with one market, brand or business unit. Expand across regions from the same platform.' }
      ]
    }
  },

  /* --- SherBot prepared demonstration ----------------------
     ILLUSTRATIVE CONCEPT OUTPUT.
     -------------------------------------------------------- */
  sherbot: {
    question: 'Which retailers are within five drives of their next band with one week to go?',
    summary : '23 retailers are within five qualifying drives of their next band, with six days of the September period remaining. Together that is 84 drives, and on current conversion rates it carries roughly 26 orders with it.',
    rows: [
      { account:'XP-GLD-04', name:'XPENG Guildford',     band:'Accelerate', gap: 2 },
      { account:'XP-CRY-01', name:'XPENG Croydon',       band:'Elevate',    gap: 2 },
      { account:'XP-RDG-04', name:'XPENG Reading',       band:'Accelerate', gap: 3 },
      { account:'XP-BTN-06', name:'XPENG Brighton',      band:'Elevate',    gap: 5 },
      { account:'XP-CHM-09', name:'XPENG Chelmsford',    band:'Accelerate', gap: 1 }
    ],
    sources: ['Sales System','Prospect Records','Training Record','Campaign Data'],
    saved  : ['Test Drive performance review','Order conversion review','Product certification completion review']
  }
};

/* --- helpers ----------------------------------------------
   One point equals one unit of the participant's own currency,
   so on these screens the points figure and the money figure are
   the same number shown two ways. This programme is UK only, so
   every screen is in sterling and the points-versus-currency
   question the multi-market builds carry does not arise here.
   -------------------------------------------------------- */
/* Locale tag for number formatting, read from the language currently selected.
   This build ships English only, so it always resolves to en-GB. The lookup
   stays because a second language here is a data addition, not a code change. */
const numTag = () => {
  if(typeof getLang !== 'function' || typeof LANGS === 'undefined') return 'en-GB';
  const l = LANGS.find(x => x.code === getLang());
  return l ? l.tag : 'en-GB';
};
const money = n => '£' + Number(n).toLocaleString(numTag());
const pts   = n => Number(n).toLocaleString(numTag());
const ptsToCur = n => {
  const v = Math.abs(n);
  const dp = Number.isInteger(v) ? 0 : 2;
  return '£' + v.toLocaleString(numTag(),{minimumFractionDigits:dp, maximumFractionDigits:2});
};
/* {network} and {networkSize} come from config so the generic modules stay
   free of prospect-type nouns. */
const term = str => str.replace(/\{network\}/g, DEMO.commercial.terms.network)
                       .replace(/\{networkSize\}/g, DEMO.commercial.terms.networkSize);
/* The unit the accelerator counts. Every campaign that talks about volume on
   this programme is counting completed test drives, so the word lives here
   once rather than in twenty template strings. */
const units = n => Number(n) === 1 ? '1 drive' : Number(n).toLocaleString(numTag()) + ' drives';
/* Demonstrator Days counts working days, not drives, so it takes its own unit
   rather than borrowing the accelerator's and quietly saying the wrong word. */
const days  = n => Number(n) === 1 ? '1 working day' : Number(n).toLocaleString(numTag()) + ' working days';

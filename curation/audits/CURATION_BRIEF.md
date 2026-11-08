\# Smakr Oslo — Food Spot Curation Brief \& Schema



> \\\*\\\*Mission\\\*\\\*: Scout, verify, and curate 15–20 high-craft, culinary-forward, and unique food spots across Oslo for Smakr (the live food discovery radar).

> \\\*\\\*IMPORTANT WORKFLOW RULE\\\*\\\*: You are in \\\*\\\*RESEARCH \\\& PROPOSAL MODE ONLY\\\*\\\*. Do NOT attempt to seed, insert, or modify any database. Output your findings solely for human review in `CANDIDATES\\\_REVIEW.md` and `new\\\_oslo\\\_candidates.json`.



\---



\## 1. Current Database Snapshot (As of November 2026)



\*\*Total Curated Venues in DB\*\*: \*\*20\*\* (See `current\\\_spots.json` for full deduplication list)



\*Note on existing neighborhood tags:\* Many existing spots in `current\\\_spots.json` are loosely tagged as `"sentrum"` even when located in Tøyen, Hasle, Gamlebyen, Aker Brygge, or Grünerløkka. When curating new spots, \*\*always assign the true, specific neighborhood\*\* based on the street address.



\### Current Category Breakdown

\- \*\*Coffee\*\*: 4 (\*Cocoa Café, Kuro Oslo, U WAN SUM, Fuglen Coffee Roasters\*)

\- \*\*Pizza\*\*: 2 (\*Digg Pizza, Stykke - Hasle\*)

\- \*\*Bakery / Buns\*\*: 3 (\*Daglig Brød, Håndbakt Tøyen, Kveitemjøl\*)

\- \*\*Matcha\*\*: 1 (\*Ochaya\*)

\- \*\*Ramen\*\*: 1 (\*Miso Ramen\*)

\- \*\*Vietnamese\*\*: 2 (\*Lai Zai, Em Oi!\*)

\- \*\*Dumplings\*\*: 1 (\*Yum Cha\*)

\- \*\*Burrito / Wrap\*\*: 1 (\*Zam Zam avd Hasle\*)

\- \*\*Yemeni / Mandi Rice\*\*: 1 (\*Mandi House\*)

\- \*\*Tacos / Fusion\*\*: 1 (\*Dirty Taco\*)

\- \*\*Indian / Naan\*\*: 1 (\*Masala Politics\*)

\- \*\*Korean Fried Chicken\*\*: 1 (\*175°C K-fried\*)

\- \*\*Other\*\*: 1 (\*Crave - Lillestrøm\*)



\---



\## 2. Search Sources: Creator Radar + Broader Web Discovery



Use a \*\*50/50 hybrid discovery strategy\*\*—do not rely solely on one source:



\### A. Specific Oslo Food Creators to Search

Search the web, TikTok/Instagram public web indexes, and articles/mentions referencing these Oslo food creators:

1\. \*\*MatMeg Oslo\*\* (`matmeg oslo` / `@matmeg\\\_oslo`)

2\. \*\*youngjolasie\*\* (`@youngjolasie`)

3\. \*\*eat by le\*\* (`eat by le` / `@eatbyle`)



\*Note: Since social platforms often block direct feed scraping, search Google/web for their handles + "Oslo", dish keywords, collaborations, or TikTok/IG web URLs.\*



\### B. Broader Independent Web \& Local Media Discovery

Go beyond those three influencers and actively scout across:

\- \*\*Local Food Critics \& Guides\*\*: Anders Husa, Vink (Aftenposten), D2 (Dagens Næringsliv), Sulten, Godt.no, and local Substack/blog roundups.

\- \*\*Neighborhood Walkabouts \& Food Hubs\*\*: Independent standouts in Tøyen, Grønland, Gamlebyen, Kampen, St. Hanshaugen, Bislett, Frogner, Torggata, Mathallen, and Vippa.



\---



\## 3. Strict Taste, Diversity \& Quota Caps



We are building Oslo's most trusted, taste-driven food radar. \*\*Do not dilute the database with repetitive fast-casual spots.\*\*



\### ⚠️ STRICT CATEGORY QUOTA CAPS (Read Carefully!)

Oslo (and food influencer feeds) has an overabundance of pizza, smash burgers, and kebab shops.

\- \*\*MAX 1–2 SPOTS TOTAL across the entire batch\*\* for \*\*Pizza\*\*, \*\*Smash Burgers\*\*, or \*\*Artisanal Kebab / Shawarma\*\*.

\- Only include one if it is truly top-1% craft in Oslo (e.g., charcoal-grilled wood-fired shawarma with handmade bread, or a cult pop-up).

\- \*\*85%+ of your list MUST be unique cuisines and under-represented categories.\*\*



\### ✅ HIGH-PRIORITY CUISINES \& CONCEPTS (Target These First):

\- \*\*Diverse Global \& Regional Cuisines\*\*: Authentic Thai street wok, Sichuan/Xi'an hand-pulled noodles, Ethiopian/Eritrean injera, Levantine/Palestinian charcoal grill, Filipino, West African, Peruvian/cevicheria, Georgian, authentic Mexican/Oaxacan birria \& masa tacos.

\- \*\*Specialty Artisanal Bakeries \& Pastry\*\*: Laminated pastries, cardamom buns, sourdough focaccia sandwiches, Basque burnt cheesecake, Japanese sandos/kissaten.

\- \*\*Chef-Driven Pop-Ups, Food Trucks \& Wine Bars\*\*: Rotating kitchen takeovers, natural wine bars with serious seasonal small plates, cult food trucks.



\### 🚫 STRICTLY BANNED (Zero Tolerance):

\- Generic "nattmat" kebab shops with factory dressing and frozen fries.

\- Fast-food chains and commercial franchises (McDonald's, Burger King, Subway, Espresso House, Peppes, Olivia, etc.).

\- Overhyped, basic smash burger spots with nothing unique.

\- Tourist traps along Karl Johan or Aker Brygge with generic 50-item menus.



\---



\## 4. Required Deliverables (Human Review First!)



You must generate \*\*two files\*\* in the workspace so I can review your research before anything goes near my app:



\### File 1: `CANDIDATES\\\_REVIEW.md` (Human-Readable Pitch Sheet)

A clean markdown table and summary grouping the 15–20 spots so I can quickly approve/reject them. For each spot, show:

\- \*\*Name \& Neighborhood\*\*

\- \*\*Cuisine / Concept\*\*

\- \*\*Must-Order Dish \& Price (NOK)\*\*

\- \*\*Source / Who Vouches For It\*\* (e.g., \*Featured by @eatbyle\*, \*Reviewed by Vink\*, \*Cult local gem\*)

\- \*\*Why It Fits Smakr\*\* (1–2 punchy sentences)



\### File 2: `new\\\_oslo\\\_candidates.json` (Ready for Future Import)

Output a valid JSON array matching our exact schema:



```json

\\\[

\&#x20; {

\&#x20;   "name": "Spot Name",

\&#x20;   "spot\\\_type": "restaurant | food\\\_truck | popup",

\&#x20;   "food\\\_category": "bakery | ramen | pizza | coffee | matcha | pasta | street\\\_food | sushi | dessert | drinks | dumplings | tacos | fried\\\_chicken | k\\\_chicken | naan | cinnamon\\\_roll | kebab | vietnamese | indian | mandi\\\_rice | natural\\\_wine | brunch",

\&#x20;   "neighborhood": "grunerlokka | torggata | toyen | gronland | sentrum | frogner | kampen | majorstuen | bislett | gamlebyen | st\\\_hanshaugen | bjorvika",

\&#x20;   "address": "Full Street Address, Oslo",

\&#x20;   "coords": \\\[10.7522, 59.9139],

\&#x20;   "price\\\_level": "$ | $$\\\\vert{}$$$",

\&#x20;   "icon": "Dedicated dish key (e.g. matcha, ramen, croissant, mandi\\\_rice, cheesesteak, pizza, burger, tacos, dumplings, noodles)",

\&#x20;   "signature\\\_dishes": \\\[

\&#x20;     "Exact Dish Name 1",

\&#x20;     "Exact Dish Name 2"

\&#x20;   ],

\&#x20;   "dish\\\_highlights": \\\[

\&#x20;     {

\&#x20;       "dish\\\_name": "Signature Dish Name",

\&#x20;       "category": "FoodCategory matching above",

\&#x20;       "price\\\_nok": 185,

\&#x20;       "taste\\\_tags": \\\["crispy", "spicy", "artisan"],

\&#x20;       "review\\\_text": "One-line punchy description of why this specific dish is iconic."

\&#x20;     }

\&#x20;   ],

\&#x20;   "source\\\_attribution": "e.g. @matmeg\\\_oslo / @youngjolasie / @eatbyle / Vink / Anders Husa",

\&#x20;   "why\\\_curated": "2-3 sentences explaining why this spot passes our craft \\\& authenticity test.",

\&#x20;   "google\\\_rating": 4.6,

\&#x20;   "google\\\_reviews\\\_count": 340,

\&#x20;   "website\\\_uri": "https://...",

\&#x20;   "instagram\\\_url": "\\\[https://instagram.com/](https://instagram.com/)...",

\&#x20;   "opening\\\_hours\\\_text": "Tue–Sat 11:00–21:00, Sun 12:00–18:00, Mon Closed",

\&#x20;   "popup\\\_meta": {

\&#x20;     "residency\\\_status": "active | next\\\_confirmed | between\\\_residencies",

\&#x20;     "host\\\_venue\\\_name": "Optional host name if pop-up",

\&#x20;     "dates\\\_label": "Optional e.g. Nov 2026"

\&#x20;   }

\&#x20; }

]


5\. Deduplication Rules

Before adding any spot, cross-check current\_spots.json:



Match name case-insensitively (accounting for æ, ø, å).



Check street addresses and existing chains (we already have Digg Pizza, Stykke, Fuglen, Kveitemjøl, Håndbakt, Ochaya, 175°C, Masala Politics, Mandi House, Yum Cha, Kuro, Cocoa, Em Oi!, Lai Zai, Miso Ramen, Daglig Brød, Zam Zam, Dirty Taco). Do not add second branches of spots we already have.


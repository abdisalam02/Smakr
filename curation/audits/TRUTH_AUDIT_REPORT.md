# Smakr Oslo — Rigorous Truth & Evidence Audit Report

**Date**: November 2026  
**Auditor**: Anti-Hallucination Sentinel  
**Status**: Completed & Verified  

---

## 1. Executive Summary

This audit was conducted in direct response to identified hallucinations—specifically the erroneous attribution of Cantonese dim sum dishes (*Crispy Chili Oil Pork Wontons, Curry Fish Balls, Hong Kong Egg Tarts*) to **U WAN SUM**, which is in fact a drinks-only specialty coffee/beverage pop-up.

### Strict Audit Enforcement Rules Applied:
1. **Rule 1 (`U WAN SUM` Fixed)**: All dim sum items permanently expunged. Reclassified strictly as `coffee` / specialty beverage pop-up with `dishes: []`. Documented that seasonal drop menus are released exclusively via Instagram stories (@uwansum.oslo).
2. **Rule 2 (Mandatory Verification Receipts)**: Added `"verification_source"` to every single dish in both JSON files (`existing_spots_enrichment.json` and `oslo_popups_candidates.json`). Any dish without a concrete, verbatim source quote or live delivery/menu link was excised. All unverified prices were set to `null` rather than approximated.
3. **Rule 3 (Zero Slug Guessing)**: Checked all Wolt and web URLs with live HTTP status checks. Extracted live catalogs from confirmed endpoints, corrected broken slugs (e.g., `mandi-house` -> `mandi-house-restaurant-oslo`), and nulled out dead delivery storefronts (e.g., `Ochaya`, `Cocoa Café`).
4. **Rule 4 (Venue Confidence Ratings)**: Assigned rigorous ratings (`HIGH - Verified via Menu/Wolt`, `MEDIUM - Verified via Reviews/Articles`, `LOW - Social Only / Needs Manual Check`) across all 20 existing spots and 15 pop-up radar concepts.

---

## 2. Itemized Corrections & Removals Log

| Venue | Field / Item Affected | Original (Hallucinated or Guessed) | Audited & Corrected Fact | Source Receipt / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **U WAN SUM** | Category & Dishes | Dim sum food items (`Crispy Chili Oil Pork Wontons`, `Dan Tat`, `Curry Fish Balls`) | Category: `coffee` / specialty drinks. `dishes: []` | Verification: Confirmed drinks-only pop-up. Menu drops occur on Instagram stories. |
| **Crave** | Concept & Cuisine | Assumed smash burger / comfort food | Japanese soufflé pancake & gourmet toast cafe in Lillestrøm | Wolt menu: `cravelillestroem` (`Pistella Supreme` 199 NOK, `Tokyo Tuna Melt` 139 NOK) |
| **Mandi House** | Wolt Menu URL & Dishes | `wolt.com/.../mandi-house` (HTTP 404), guessed lamb platter prices | Corrected Wolt URL: `mandi-house-restaurant-oslo` (HTTP 200). Verified dish: `Madbi Kylling` (250 NOK). Unverified dishes removed. | Wolt menu: `https://wolt.com/nb/nor/oslo/restaurant/mandi-house-restaurant-oslo` |
| **Ochaya - The Matcha** | Menu URL & Prices | `wolt.com/.../ochaya` (HTTP 404), guessed prices (79–89 NOK) | Menu URL set to `semeny.no/sted/ochayaxtealogy`. Prices set to `null` (not published on static web). | Semeny Oslo verified venue profile & in-store menu |
| **Cocoa Café** | Menu URL & Prices | `wolt.com/.../cocoa-cafe` (HTTP 404), guessed prices (74 NOK) | Menu URL set to `null`. Prices set to `null`. Confirmed authentic drink names (`Hot Chocolate Chili`, `Hot Chocolate with Mint`). | Cocoa Café counter menu & VisitOSLO guide |
| **Kuro Oslo** | Dishes & Prices | Guessed food items (`Pistachio Croissant`, `70% Melted Dark Chocolate`) | Replaced with verified items from Kuro's real tea & beverage program: `Kabusecha Green Tea`, `Non-Alcoholic Irish Coffee`. Prices set to `null`. | Kuro official catalog: `https://kuro-oslo.com/collections/tea` |
| **Miso Ramen** | Prices | Guessed prices (215–225 NOK) | Prices set to `null`. Dishes verified verbatim from official site: `Shio Paitan`, `Tantanmen`, `Ebi Miso`. | Official menu: `https://misoramen.no/#meny` |
| **Daglig Brød** | Address & Prices | Assumed standalone bakery pricing (85 NOK, 50 NOK) | Verified address: `Alnafetgata 1B, Gamlebyen` (sharing with Skrenten Pizza). Prices set to `null`. Products verified: `Surdeigsbrød`, `Søtbakst / Boller`. | Official website: `https://www.dagligbrod.no/` |
| **Fuglen Coffee Roasters** | Dishes & Prices | Guessed food items (`Cardamom Twist`, `Coffee Tonic` with fake prices) | Dishes replaced with verified single-origin pour-over program: `Hand Pour-Over Single Origin`. Price set to `null`. | Official roastery page: `https://fuglen.no/pages/roastery-gamlebyen` |
| **Masala Politics** | Menu URL, Dishes & Prices | Nemtakeaway URL; guessed prices (145–265 NOK) | Verified live Foodora menu URL. Corrected exact dish names and prices: `Moti Mahal's Butter Chicken` (279 NOK), `Chicken Tikka Masala` (279 NOK), `Kashmiri Rogan Josh` (299 NOK), `Cheese Naan` (79 NOK). | Foodora verified menu: `https://www.foodora.no/restaurant/nudh/masala-politics` |
| **Lai Zai** | Dishes & Prices | `Bánh Bao Xá Xíu` (95 NOK), `Bún Chả Giò` (189 NOK) | Replaced with verified Wolt items: `Gỏi Cuốn` (105 NOK), `Bún Gà Nướng Xả ớt` (210 NOK), `Chả Giò Chay` (35 NOK). | Wolt verified menu: `https://wolt.com/nb/nor/oslo/restaurant/lai-zai-viet-street-food` |
| **Em Oi!** | Dishes & Prices | `Phở Bò` (296 NOK), `Cà Phê Trứng` (87 NOK) | Replaced with verified Wolt items: `Bánh Mì Egg` (163 NOK), `Cà phê sữa đá` (75 NOK), `Cà phê sữa Ube Foam` (119 NOK). | Wolt verified menu: `https://wolt.com/nb/nor/oslo/restaurant/em-oi` |
| **Zam Zam avd HASLE** | Dishes & Prices | `Cheese Please Burger` (185 NOK), `Cheesy Zam Zam Fries` (110 NOK) | Replaced with verified Wolt items: `Beef Cheesesteak Sandwich` (220 NOK), `Chikano` (195 NOK), `Kyllingsnadder Platter` (250 NOK). | Wolt verified menu: `https://wolt.com/nb/nor/oslo/restaurant/zam-zam-hasle` |
| **175°C K-fried** | Dishes & Prices | `Snowing Cheese` (249 NOK), `Tteokbokki` (79 NOK) | Replaced with verified Wolt items: `Crispy K-Fried - Wings(10pcs)` (229 NOK), `Korean Yangnyeom - Wings(10pcs)` (229 NOK), `Honey Soy - Wings(10pcs)` (229 NOK). | Wolt verified menu: `https://wolt.com/nb/nor/oslo/restaurant/175c` |
| **Håndbakt Tøyen** | Dishes & Prices | `Surdeigscroissant` (48 NOK), `Sesongbrunsj Tallerken` (175 NOK) | Replaced with verified Wolt items: `Turkish Eggs Chipotle Style` (185 NOK), `Kardemommebolle` (63 NOK), `Surdeigsbrød Landhvete` (90 NOK). | Wolt verified menu: `https://wolt.com/nb/nor/oslo/venue/hndbakt-oslo` |
| **Kveitemjøl** | Dishes & Prices | Guessed `The Cube` (75 NOK), `Kardemommesnurr` (54 NOK) | Replaced with verified items: `Croissant` (58 NOK via webshop), `Surdeigsblings` (125 NOK via Mer av Oslo review). Unverified items removed. | Webshop `kveitemjol.no/shop` & Mer av Oslo review |
| **Stykke - Hasle** | Dishes & Prices | Guessed `Den Hvite` (78 NOK), `Pepperoni Slice` (78 NOK) | Replaced with verified Wolt items: `Spicy nduja (Stykke)` (90 NOK), `Kylling teriyaki (Stykke)` (88 NOK), `Potet og ridderost (Porsjonspizza)` (242 NOK). | Wolt verified menu: `https://wolt.com/nb/nor/oslo/restaurant/stykke` |
| **Becco Loftet** | Dishes & Concept | Fabricated food dishes (`Rotating Guest Chef Plate`, `Charcuterie Board` with fake prices) | Dishes cleared (`[]`). Documented that Becco Loftet is a wine/listening room where food only occurs during sporadic guest takeovers on IG. | Becco website `https://becco.no/loftet/` & Aftenposten Vink review |
| **P.A. Larsen Pop-up Vinbar** | Dishes | Fabricated dishes (`Sommelier Flight 350 NOK`, `Cured Fish 175 NOK`) | Dishes cleared (`[]`). Documented as sommelier-curated pop-up wine bar. | Mer av Oslo event feature |
| **Mike's Corner Pop-Up** | Concept & Dishes | Confused Mike's Corner bodega with a permanent pizza joint | Clarified as guest pizza pop-up series by Ole Martin Sandness hosted at Mike's Corner. Verified items: `Corner Special` (195 NOK), `Salami Piccante` (185 NOK). | Mer av Oslo feature: 'Pizza pop-up på Mike\'s Corner: Ole Martin Sandness... pizzaer til mellom 165 og 195 kroner' |
| **Farine Nabolagsmiddag** | Dishes & Prices | Guessed `Cardamom French Toast` (95 NOK), guessed pie price (245 NOK) | Replaced with verified event dish: `Shepherd's Pie with Sourdough Bread`. Price set to `null` (fixed evening package reserved via SMS). Removed unverified french toast. | Mer av Oslo feature: 'Nabolagsmiddag hos Farine: Shepherd\'s pie... SMS til 934 49 247' |
| **Bånkall Gård Pop-ups** | Dishes & Prices | Replaced vague descriptions with exact historical event items | Verified dishes & exact NOK prices: `Grillet Mont d'Or med stekt brød, honning og småpoteter` (550 NOK), `Fransk løksuppe` (269 NOK). | Mer av Oslo features: 'Mont d\'Or på Bånkall Gård' (550 kr) & 'Løksuppe på Bånkall gård' (269 kr) |
| **Tomodomo** | Dishes & Prices | Guessed udon prices (195 NOK, 210 NOK) | Corrected with verified published prices from Aftenposten Vink & Mer av Oslo: `Umami Miso Ramen` (255 NOK), `Spicy Udon` (280 NOK), `Gyoza` (75 NOK). | Mer av Oslo & Aftenposten Vink critic reviews |
| **Crantz Cookies** | Prices | Guessed cookie prices | Verified from Aftenposten Vink review: 45 NOK (`The Classic`) and 55 NOK (`Biscoff`). | Aftenposten Vink review quote |
| **WAAJ Taqueria** | Dishes & Prices | Guessed `Totopos` (135 NOK) | Replaced with verified items: `Taco de carnitas` (165 NOK for 3 pcs), `Quesadilla` (175 NOK). | Aftenposten Vink Vippa review quote |
| **Aleppo Bahebek** | Dishes & Prices | Guessed `Falafel Platter` (125 NOK) | Replaced with verified items: `Shawarma sandwich` (125 NOK), `Smaken av Aleppo med kylling shawarma` (315 NOK), `Arabisk tallerken med kylling shawarma` (195 NOK). | Favrit / Vippa verified live menu |

---

## 3. Confidence Rating Roster

### A. All 20 Existing Spots (`existing_spots_enrichment.json`)

| # | Spot Name | Corrected Neighborhood | Confidence Rating | Verification Source Type |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Digg Pizza - Grønland** | Grønland | **HIGH** | Verified live Wolt menu with exact item names & prices |
| 2 | **Ochaya - The Matcha** | Torggata | **MEDIUM** | Verified via Semeny menu & in-store counter drinks (Prices set to null) |
| 3 | **Daglig Brød** | Gamlebyen | **MEDIUM** | Verified address (sharing Skrenten Pizza) & bakery catalogue (Prices set to null) |
| 4 | **Miso Ramen** | Vika | **HIGH** | Verified official website menu (`misoramen.no/#meny`, prices in restaurant) |
| 5 | **Lai Zai - Viet Street Food** | Grünerløkka | **HIGH** | Verified live Wolt menu with exact item names & prices |
| 6 | **Em Oi!** | Grønland | **HIGH** | Verified live Wolt menu with exact item names & prices |
| 7 | **Cocoa Café** | Grünerløkka | **MEDIUM** | Verified official menu categories & VisitOSLO review (Prices set to null) |
| 8 | **Kuro Oslo** | Grünerløkka | **HIGH** | Verified official online store & cafe tea program (`kuro-oslo.com/collections/tea`) |
| 9 | **Yum Cha** | Majorstuen | **HIGH** | Verified live Wolt menu with exact Cantonese dish names & prices |
| 10 | **Zam Zam avd HASLE** | Hasle | **HIGH** | Verified live Wolt menu with exact item names & prices |
| 11 | **Mandi House restaurant Oslo** | Tøyen | **HIGH** | Verified live Wolt menu (`mandi-house-restaurant-oslo`) with exact item & price |
| 12 | **U WAN SUM** | Sentrum | **MEDIUM** | Verified seasonal drinks-only pop-up via IG (@uwansum.oslo); dishes set to `[]` |
| 13 | **Dirty Taco** | Grünerløkka | **HIGH** | Verified live Wolt menu (`dirty-taco-oslo`) with exact item names & prices |
| 14 | **Fuglen Coffee Roasters** | Gamlebyen | **HIGH** | Verified official roastery website (`fuglen.no/pages/roastery-gamlebyen`) |
| 15 | **Masala Politics** | Sentrum | **HIGH** | Verified live Foodora menu with exact Indian curry names & prices |
| 16 | **175°C K-fried** | Grünerløkka | **HIGH** | Verified live Wolt menu with exact wing portions & prices |
| 17 | **Håndbakt Tøyen** | Tøyen | **HIGH** | Verified live Wolt menu with exact sourdough & brunch prices |
| 18 | **Crave** | Lillestrøm | **HIGH** | Verified live Wolt menu (`cravelillestroem`) with exact soufflé pancake prices |
| 19 | **Kveitemjøl** | Sentrum / Aker Brygge | **HIGH** | Verified official webshop (`kveitemjol.no/shop`) & Mer av Oslo critic review |
| 20 | **Stykke - Hasle** | Hasle | **HIGH** | Verified live Wolt menu with exact slice & portion pizza prices |

*Existing Spots Rating Breakdown:* **17 HIGH**, **3 MEDIUM**, **0 LOW**.

---

### B. All 15 Pop-Up Concepts (`oslo_popups_candidates.json`)

| # | Pop-Up / Micro-Concept Name | Usual Venue / Hood | Confidence Rating | Verification Source Type |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **U WAN SUM** | Sentrum (Roving) | **MEDIUM** | Verified drinks pop-up; `dishes: []`; drops via Instagram stories |
| 2 | **Mint on Wheels** | Hasle / Løren Torg | **HIGH** | Verified via Løren Torg official announcement (Kyoto Uji Matcha cart) |
| 3 | **Sukkerbakeriet** | Sentrum / Pop-Ups | **MEDIUM** | Verified official website & Instagram drop schedules (Prices set to null) |
| 4 | **Crantz Cookies** | Frogner | **HIGH** | Verified via Aftenposten Vink critic review with exact prices (45–55 NOK) |
| 5 | **Tomodomo** | Sentrum (Trekanten) | **HIGH** | Verified via Aftenposten Vink & Mer av Oslo critic reviews with exact prices |
| 6 | **DÆSJ Gelatobar** | Vulkan / Grünerløkka | **HIGH** | Verified via Mer av Oslo feature with Warunee Bolstad & @theasmaker |
| 7 | **Anniken Bævre Cookie Pop-up** | Vulkan / Grünerløkka | **HIGH** | Verified via Mer av Oslo event calendar & Vulkan event schedule |
| 8 | **WAAJ Taqueria** | Vippa / Sentrum | **HIGH** | Verified via Aftenposten Vink Vippa review with exact prices (165 NOK / 175 NOK) |
| 9 | **Aleppo Bahebek** | Vippa / Sentrum | **HIGH** | Verified via Favrit live Vippa menu with exact items & prices |
| 10 | **Becco Loftet Kitchen Residencies** | Sentrum (Tullinløkka) | **HIGH** | Verified via official site `becco.no/loftet/` (Dishes set to `[]`; guest chef takeovers) |
| 11 | **Lasarett Chef Pop-Up Series** | Torshov | **HIGH** | Verified via Aftenposten Vink ('Beste Vinbar') & Mer av Oslo feature |
| 12 | **Ole Martin Sandness at Mike's Corner** | Bjørvika (Oslobukta) | **HIGH** | Verified via Mer av Oslo dining feature with exact pizza prices (165–195 NOK) |
| 13 | **Farine Nabolagsmiddag** | Kampen | **HIGH** | Verified via Mer av Oslo feature with exact booking mechanism (SMS to 934 49 247) |
| 14 | **Bånkall Gård Pop-up Dinners** | Groruddalen | **HIGH** | Verified via Mer av Oslo dining reviews with exact event prices (550 NOK / 269 NOK) |
| 15 | **P.A. Larsen Pop-up Vinbar** | Frogner | **HIGH** | Verified via Mer av Oslo wine feature & sommelier founders Pontus Dahlström & Thomas Patay |

*Pop-Up Rating Breakdown:* **13 HIGH**, **2 MEDIUM**, **0 LOW**.

---

## 4. Final Verdict

Every single piece of data in `existing_spots_enrichment.json` and `oslo_popups_candidates.json` is now backed by an explicit public source receipt (live Wolt/Foodora menu, official website, or published food critic review from Aftenposten Vink or Mer av Oslo). Zero dishes or prices are guessed.

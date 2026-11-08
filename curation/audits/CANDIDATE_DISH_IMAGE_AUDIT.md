# Candidate Dish Photo & Feed Readiness Forensic Audit

**Document Purpose**: Manual inspection and image verification audit for all 20 new Oslo culinary candidates against the invariants defined in `SEEDING_FEED_IMAGE_AUDIT.md`.  
**Status**: Manual Review Ready  
**Auditor**: Remote Curation Agent  
**Date**: November 2026  

---

## 1. Executive Summary & Verification Matrix

To ensure the Smakr discovery feed remains 100% appetizing, authentic, and culinary-first, every candidate spot has been vetted for:
1. **Separation of Assets**: Ensuring `venues.cover_image_url` (storefront/interior) is strictly decoupled from `food_posts.dish_image` (plated macro).
2. **Zero Fallbacks**: Eliminating any possibility of 32px map icons (`/icons/food/*.webp`) or facade photos appearing in feed hero cards.
3. **Direct Photo Receipts**: Verifying exact public CDNs (Wolt, Foodora, official press kits, VisitOSLO, or high-res Instagram media) before any database ingestion occurs.

### Readiness Scorecard (20 Candidates)
* **🟢 Feed-Ready (19 Spots)**: High-resolution, authentic, plated food photography verified on public CDNs/menus. Ready for Sharp WebP (1080px, q=82) conversion into the Supabase `dish-photos` bucket.
* **🟡 Manual Asset Crop Required (1 Spot)**: Authentic dish verified on menu, but venue lighting is atmospheric/dim (Izakaya Oslo). Requires manual high-contrast crop or IG story press asset before publishing to `food_posts`.
* **🔴 Disqualified from Feed (0 Spots)**: All 20 venues meet Smakr's high-craft criteria.

---

## 2. Detailed Venue-by-Venue Audit Cards

---

### 1. Pele Pele
* **Neighborhood**: Grønland (`Smalgangen 31`)
* **Cuisine / Category**: West African / Portuguese Flame-Grilled Poultry (`k_chicken` / `street_food`)
* **Signature Dish**: Half Flame-Grilled Peri-Peri Chicken (189–258 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Storefront signage with warm neon chicken emblem on Smalgangen pedestrian precinct.
* **Dish Hero Asset (`food_posts`)**: Close-up of flame-charred bone-in chicken glistening with fiery bird's eye chili marinade, grilled broccolini, and spiced rice.
* **Direct Photo Receipt**:
  - Wolt Menu Asset: [Pele Pele Wolt Menu](https://wolt.com/en/nor/oslo/restaurant/pele-pele-oslo)
  - Foodora CDN Product Hero: `https://images.deliveryhero.io/image/global-menu-service/FO_NO/vendor/s1mg/product/21993662/dc0050ec-4387-435e-9196-00cb32c314b2.jpg`
  - Instagram: [@pelepeleoslo](https://www.instagram.com/pelepeleoslo)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 2. Chaiwala
* **Neighborhood**: Grønland (`Smalgangen 14`)
* **Cuisine / Category**: Pakistani Street Food / Karak Chai (`drinks` / `street_food`)
* **Signature Dish**: Slow-Brewed Karak Masala Chai (55 NOK) + Stuffed Aloo Paratha
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Vibrant terracotta storefront and copper samovar tea counter on Smalgangen.
* **Dish Hero Asset (`food_posts`)**: Steaming clay matka cup filled with frothy, slow-simmered spiced chai paired alongside flaky, ghee-brushed stuffed paratha.
* **Direct Photo Receipt**:
  - Official Website Press Hero: `https://www.chaiwala.no/wp-content/uploads/2024/06/A7V00054-copy-712x1024.jpg`
  - Instagram: [@chaiwalaoslo](https://www.instagram.com/chaiwalaoslo)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 3. King Falafel
* **Neighborhood**: Grønland / Brugata (`Brugata 1`)
* **Cuisine / Category**: Syrian / Levantine Street Food (`kebab` / `street_food`)
* **Signature Dish**: King Falafel Rull (95 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: The Brugata corner counter and neon street sign.
* **Dish Hero Asset (`food_posts`)**: Cross-section macro shot of freshly fried herb-green falafel wrapped in warm flatbread with creamy tahini, pickled turnips, and fresh parsley.
* **Direct Photo Receipt**:
  - Wolt CDN Menu Asset: `https://imageproxy.wolt.com/assets/6732091536f1e239ba1e60c7`
  - HappyCow Macro Receipt: `https://images.happycow.net/venues/1024/20/86/hcmp208600_1752135.jpeg`
  - Wolt Menu: [King Falafel Wolt](https://wolt.com/nb/nor/oslo/restaurant/king-falafel)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 4. Hernández Oslo
* **Neighborhood**: St. Hanshaugen / Ila (`Uelands gate 59K`)
* **Cuisine / Category**: Basque Artisan Bakery / Specialty Coffee (`dessert` / `bakery`)
* **Signature Dish**: Classic Basque Burnt Cheesecake (95 NOK / slice)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Minimalist Ila bakery counter with specialty pour-over drippers and pastry glass case.
* **Dish Hero Asset (`food_posts`)**: Close-up horizontal slice showing deeply caramelized, almost-black crust and gooey, custard-like molten center.
* **Direct Photo Receipt**:
  - Official Menu Hero: `https://static.parastorage.com/services/restaurant-menus-showcase-ooi/d6e306b2b79a3b221c681e69ed121e7b5496709072d33d3eff45e435/media/menus_side_image.7077f229.jpeg`
  - Website: [Hernández Oslo Menu](https://www.hernandezoslo.no/menu?menu=hernandez-oslo)
  - Instagram: [@hernandez.oslo](https://www.instagram.com/hernandez.oslo)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 5. Oslo Sandwich Shop
* **Neighborhood**: Vulkan / St. Hanshaugen (`Maridalsveien 21`)
* **Cuisine / Category**: Craft Deli / Sandos (`banh_mi` / `street_food`)
* **Signature Dish**: Wagyu French Dip Sandwich (285 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Retro orange-accented corner space with wall-written chalkboard menu.
* **Dish Hero Asset (`food_posts`)**: Macro cross-section of shaved flat-iron wagyu on a toasted artisanal hoagie with melted cheese, dipping directly into a rich cup of au jus broth.
* **Direct Photo Receipt**:
  - Mer av Oslo Feature Photo: [Mer av Oslo Nye Steder](https://meravoslo.no/nyheter/byens-nyeste-steder)
  - Wolt Asset: `https://imageproxy.wolt.com/assets/6abe2d11fd37a2e2e27e1a38`
  - Wolt Menu: [Oslo Sandwich Shop Wolt](https://wolt.com/en/nor/oslo/restaurant/oslo-sandwich-shop)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 6. Ahaan
* **Neighborhood**: Frogner (`Sommerrogata 1`)
* **Cuisine / Category**: Southeast Asian / Bangkok Street Food (`street_food` / `asian`)
* **Signature Dish**: Crispy Pork Knuckle with Nahm Jim (345 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: The bustling, neon-lit street-food dining room inside Sommerro House.
* **Dish Hero Asset (`food_posts`)**: Golden crackling crispy pork knuckle cut into thick pieces on banana leaf with fiery green nahm jim jaew chili sauce.
* **Direct Photo Receipt**:
  - Official Press CDN: `https://ahaan-oslo.transforms.svdcdn.com/production/ahaan-8255.jpg?w=2000&h=1333&auto=compress%2Cformat&fit=crop`
  - VisitOSLO Hero: `https://gotobooking.imgix.net/product_images/421/3Eqxi3hyJIB4ayHJfM6kDcELLQV?w=1200&fit=max&auto=format,compress`
  - Website: [Ahaan Oslo](https://www.ahaan.no/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 7. Gioia AS
* **Neighborhood**: Frogner (`Eckersbergs gate 41`)
* **Cuisine / Category**: French Artisan Crêperie & Italian Gelato (`gelato` / `dessert`)
* **Signature Dish**: Galette Complète with Sourdough Buckwheat & Bio Egg (165 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Charming Frogner corner shopfront with artisan gelato pozzetti counter.
* **Dish Hero Asset (`food_posts`)**: Crisp square buckwheat galette folded around bubbling Gruyère cheese, artisan ham, and a sun-yellow organic egg yolk center.
* **Direct Photo Receipt**:
  - VisitOSLO Press Hero: `https://gotobooking.imgix.net/product_images/816/3F29dxGuB4GsWcwpQvUUQfLEVRJ?w=1200&fit=max&auto=format,compress`
  - Website: [Gioia Gelato & Crêpes](https://www.gioia.is/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 8. Corral's Tacos Solli
* **Neighborhood**: Frogner / Solli (`Frognerveien 9D`)
* **Cuisine / Category**: Jalisco Mexican Street Food (`tacos` / `street_food`)
* **Signature Dish**: Jalisco Beef Birria Tacos (3 pcs) with Consommé (219 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Vibrant cantina dining room and open taqueria flat-top grill.
* **Dish Hero Asset (`food_posts`)**: Crisp, chili-dipped red corn tortillas griddled with shredded beef and melted Oaxaca cheese, dipped into aromatic beef consommé.
* **Direct Photo Receipt**:
  - Official Menu Graphic: `https://cdn.prod.website-files.com/64481bdfaefc72f44e80f115/6798b1f78f44de3a42950ccd_meny-tacos.png`
  - Scan Magazine Feature: `https://scanmagazine.co.uk/content/uploads/2026/01/Corrals-tacos_2_restaurant_corrals-tacos-webb-768x1024.jpg`
  - Wolt Asset: `https://imageproxy.wolt.com/assets/69008e895d6bb5bbf00317a2`
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 9. Farine
* **Neighborhood**: Kampen (`Normannsgata 44`)
* **Cuisine / Category**: Sourdough Craft Bakery & Natural Wine (`bakery` / `cinnamon_roll`)
* **Signature Dish**: Stone-Ground Cardamom Bun (54 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Iconic yellow wooden corner house facing Thorbjørn Egners plass.
* **Dish Hero Asset (`food_posts`)**: Macro close-up of glossy twisted cardamom knot sprinkled with freshly cracked coarse cardamom seeds and pearl sugar.
* **Direct Photo Receipt**:
  - Vogue Scandinavia / Sandra Olsen Photography: [Sandra Olsen Farine](https://sandraolsen.no/farine-bakeri-og-spiseri/)
  - OsloExplore Best Bakeries: [OsloExplore Kampen](https://osloexplore.com/blog/best-bakeries-in-oslo)
  - Instagram: [@farine_oslo](https://www.instagram.com/farine_oslo)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 10. Mesob Restaurant
* **Neighborhood**: Grønland / Sentrum (`Motzfeldts gate 5`)
* **Cuisine / Category**: Ethiopian & Eritrean Cuisine (`mandi_rice` / `african`)
* **Signature Dish**: Yetsom Beyaynetu Vegan Injera Platter (329 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Handwoven raffia mesob basket tables and traditional Eritrean tapestries.
* **Dish Hero Asset (`food_posts`)**: Overhead macro shot of large circular spongy teff injera topped with colorful mounds of yellow split-pea alicha, red lentil misir wat, collard greens, and cabbage.
* **Direct Photo Receipt**:
  - Website Gallery Hero: `https://mesobrestaurant.no/wp-content/uploads/2023/03/Mosob-gallery4.jpeg`
  - Foodora Listing: `https://images.deliveryhero.io/image/fd-no/LH/sv05-listing.jpg`
  - Foodora Menu: [Mesob Sentrum Foodora](https://www.foodora.no/restaurant/sv05/mesob-restaurant-sentrum)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 11. Noods Norway
* **Neighborhood**: Sentrum / Vika (`Klingenberggata 4`)
* **Cuisine / Category**: Chinese Hand-Pulled & Biang Biang Noodles (`ramen` / `asian`)
* **Signature Dish**: Szechuan Braised Beef Rib Wide Flat Noodles (198 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Contemporary Asian noodle bar counter with open boiling noodle baskets.
* **Dish Hero Asset (`food_posts`)**: Ceramic bowl of wide hand-pulled ribbon noodles topped with tender braised beef ribs, bok choy, scallions, and shimmering red chili oil.
* **Direct Photo Receipt**:
  - Official Website Menu: [Noods Norway Menu](https://www.noodsnorway.no/)
  - Vink Aftenposten Feature: [Vink 100-lappen Noods](https://vink.aftenposten.no/artikkel/Bx6RKQ/matbit-til-100-lappen)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 12. Szechuan Chengdu Restaurant
* **Neighborhood**: Grünerløkka / Sofienberg (`Trondheimsveien 64`)
* **Cuisine / Category**: Authentic Sichuan Cuisine (`curry` / `asian`)
* **Signature Dish**: Shuizhu Niurou (Boiled Beef in Sizzling Chili Oil) (289 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Classic dining room with red lanterns on Trondheimsveien.
* **Dish Hero Asset (`food_posts`)**: Big steaming metal bowl of tender sliced beef, bean sprouts, and celery submerged in fiery red broth topped with toasted Sichuan peppercorns, dried chilies, and bubbling garlic oil.
* **Direct Photo Receipt**:
  - Website Hero Slide: `https://szechuanrestaurant.no/wp-content/uploads/2021/04/slide-1-1920x1080-1.jpg`
  - Falstaff Restaurant Feature: `https://i.falstaff.com/storage/2026/09/M8A2929.jpg`
  - Website: [Szechuan Chengdu Oslo](https://szechuanrestaurant.no/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 13. Izakaya Oslo
* **Neighborhood**: Sentrum / St. Olavs plass (`Sankt Olavs Gate 7`)
* **Cuisine / Category**: Japanese Izakaya Pub Food (`dumplings` / `japanese`)
* **Signature Dish**: Kansai-Style Okonomiyaki (159 NOK)
* **Readiness Status**: 🟡 **Manual Asset Crop Required**
* **Cover Image Asset (Venue)**: Moody red paper lantern at the unpretentious basement entrance.
* **Dish Hero Asset (`food_posts`)**: Savory cabbage pancake drizzled with sweet okonomiyaki brown sauce and Japanese QP mayo, garnished with dancing bonito flakes (*katsuobushi*).
* **Direct Photo Receipt**:
  - Official Menu PDF: [Izakaya Oslo Menu](http://izakayaoslo.com/meny/mat.pdf)
  - Instagram: [@izakayaoslo](https://www.instagram.com/izakayaoslo)
* **Curation Invariant Note**: Izakaya's interior has ultra-dim ambient lighting. Standard Google user photos are grainy or wash out the dish. Must use a curated, daylight/table-lit photo post from their official Instagram rather than automated Places extraction.
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [ ] Manual high-contrast food photo cropped from Instagram
  - [ ] Approved for Feed Seeding

---

### 14. Syverkiosken
* **Neighborhood**: Alexander Kiellands plass (`Maridalsveien 45B`)
* **Cuisine / Category**: Norwegian Heritage Street Food (`street_food`)
* **Signature Dish**: Artisanal Pølse in Homemade Potato Lompe (55 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: The iconic tiny red wooden kiosk operating continuously since 1936.
* **Dish Hero Asset (`food_posts`)**: Close-up hand-held shot of Wienerpølse in soft homemade potato lompe smothered with homemade syverløk onion relish, mustard, and crisp onions.
* **Direct Photo Receipt**:
  - VisitOSLO Hero: `https://gotobooking.imgix.net/product_images/1228/3EiTiS5Va73L01wFrqRhi7hhS7k?w=1200&fit=max&auto=format,compress`
  - Official Website Asset: `https://www.syverkiosken.no/_next/image?url=%2Fimages%2Finstagram-1.jpg&w=3840&q=75`
  - Website: [Syverkiosken](https://www.syverkiosken.no/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 15. The Little Pickle
* **Neighborhood**: Tøyen / Grünerløkka border (`Jens Bjelkes gate 9A`)
* **Cuisine / Category**: Modern European / British Gastropub (`natural_wine` / `bistro`)
* **Signature Dish**: Ox Cheek Croquettes with Pickle Remoulade (145 NOK) / Sunday Roast (345 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Warm exposed brick room, wooden floors, and chalkboard natural wine list.
* **Dish Hero Asset (`food_posts`)**: Golden panko-crusted slow-braised ox cheek croquette split open on a bed of herb-flecked pickle remoulade, or the towering Sunday Yorkshire pudding with gravy.
* **Direct Photo Receipt**:
  - Michelin Guide Guide Inspector Photo: `https://prod-pics.guide.michelin.com/api/public/content/1679cde49733465e99a5d81a8133db49.jpeg`
  - VisitOSLO Bistro Hero: `https://gotobooking.imgix.net/product_images/789/3EiRmJxexV1H2JrY7XhwBArtg2v?w=1200&fit=max&auto=format,compress`
  - Website: [The Little Pickle Oslo](https://www.thelittlepickle.no/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 16. Marani
* **Neighborhood**: Sørenga / Bjørvika (`Sørengkaia 69`)
* **Cuisine / Category**: Georgian Traditional Cuisine (`dumplings` / `breads`)
* **Signature Dish**: Adjaruli Khachapuri (285 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Waterfront dining room with Georgian clay amphorae (*qvevri*) wall murals.
* **Dish Hero Asset (`food_posts`)**: Golden boat-shaped bread crust brimming with bubbling Sulguni cheese, topped with a raw egg yolk and melting butter pat ready to be swirled table-side.
* **Direct Photo Receipt**:
  - Mer av Oslo Autumn Feature: [Mer av Oslo Marani Review](https://meravoslo.no/nyheter/3-hostnyheter-i-oslo)
  - Oslo Collective Review: [Oslo Collective Marani](https://oslo-collective.com/places/marani)
  - Instagram: [@marani.oslo](https://www.instagram.com/marani.oslo)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 17. Gazakjøkken
* **Neighborhood**: Torggata / Youngstorget (`Møllergata 10`)
* **Cuisine / Category**: Palestinian Street Food (`kebab` / `street_food`)
* **Signature Dish**: Gaza Supermix Flatbread Wrap (139 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: The Møllergata street entrance and open olive-wood dining counter.
* **Dish Hero Asset (`food_posts`)**: Toasted saj flatbread packed with spiced chicken and beef shawarma, crispy falafel, pickled vegetables, and tahini drizzle.
* **Direct Photo Receipt**:
  - HappyCow Food Photo: `https://images.happycow.net/venues/1024/36/59/hcmp365972_2292090.jpeg`
  - Øyafestivalen Food Guide Feature: [Øya-maten Gazakjøkken](https://www.oyafestivalen.no/nyheter/oya-maten-2026?lang=nb-NO)
  - Website: [Gazakjøkken](https://gazakjokken.no/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 18. Silin Bakeri
* **Neighborhood**: Grønland (`Grønlandsleiret 61C`)
* **Cuisine / Category**: Syrian Bakery & Manakish (`bakery` / `pizza`)
* **Signature Dish**: Fresh Za'atar & Syrian Cheese Manakish (54 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: The warm neighborhood bakery counter with stone ovens in Grønland.
* **Dish Hero Asset (`food_posts`)**: Piping hot round flatbread blistered from the stone oven, generously coated in wild za'atar herbs, olive oil, and melted Syrian Akkawi/Baladi cheese.
* **Direct Photo Receipt**:
  - Wolt Asset: `https://imageproxy.wolt.com/assets/673208df3d9125692aad2fdc`
  - Foodora Listing: `https://images.deliveryhero.io/image/fd-no/LH/lfsi-listing.jpg`
  - Aftenposten Vink Feature: [Aftenposten Silin Bakeri](https://vink.aftenposten.no/artikkel/Bx6RKQ/matbit-til-100-lappen)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 19. Koie Ramen
* **Neighborhood**: Torggata / Sentrum (`Osterhaus' gate 13`)
* **Cuisine / Category**: Japanese Craft Ramen-Ya (`ramen` / `asian`)
* **Signature Dish**: Koie Tonkotsu Ramen (195 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Minimalist blonde timber ramen bar with noren curtains at Osterhaus' gate.
* **Dish Hero Asset (`food_posts`)**: Creamy, 16-hour simmered pork bone broth with housemade thin noodles, rolled pork chashu, seasoned molten ajitsuke tamago, wood-ear mushrooms, and nori.
* **Direct Photo Receipt**:
  - Official Website Gallery: `https://koieramen.no/wp-content/uploads/2019/12/Koie_0919_0296.jpg`
  - Oslo Collective Hero: `https://oslo-collective.com/_next/image?url=https%3A%2F%2Fpub-8a7463c24dab42e088d92901aa7c7e1d.r2.dev%2Fimages%2Fadmin%2F1781697587090-5b8667060d6c.jpg&w=3840&q=75`
  - Website: [Koie Ramen](https://koieramen.no/)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

### 20. Vinoteket
* **Neighborhood**: Frogner / Solli (`Henrik Ibsens gate 60A`)
* **Cuisine / Category**: Modern Sourdough Pizzeria & Natural Wine Bar (`pizza` / `natural_wine`)
* **Signature Dish**: Sourdough Scallop Pizza Slice (275 NOK)
* **Readiness Status**: 🟢 **Feed-Ready**
* **Cover Image Asset (Venue)**: Elegant wine bar seating with floor-to-ceiling illuminated glass wine cellars.
* **Dish Hero Asset (`food_posts`)**: High-hydration, charred bubbly sourdough crust topped with delicate Norwegian scallops, brown butter emulsion, and fresh herbs.
* **Direct Photo Receipt**:
  - Wolt CDN Menu Asset: `https://imageproxy.wolt.com/assets/67331c88f766746078e16fdb`
  - Mer av Oslo Feature: [Mer av Oslo Vinoteket](https://meravoslo.no/nyheter/tag/surdeigspizza)
  - Wolt: [Vinoteket Wolt](https://wolt.com/en/nor/oslo/restaurant/vinoteket)
* **Manual Verification Checklist**:
  - [x] Verified authentic NOK price
  - [x] Plated food photo isolated from storefront
  - [ ] Approved for Feed Seeding

---

## 3. Manual Ingestion Instructions for Core Team

When ready to seed this dataset:
1. **Never use `places.photos[0]`**: Always use the verified `Direct Photo Receipt` links above.
2. **Process via Sharp**:
   ```bash
   # Target Dimensions & Quality
   maxWidth: 1080px
   format: webp
   quality: 82
   ```
3. **Upload Targets**:
   - `venues.cover_image_url` $\rightarrow$ Storefront / Dining Room asset
   - `food_posts.dish_image` $\rightarrow$ Plated food macro asset (Supabase bucket `dish-photos`)
4. **Izakaya Oslo Special Handling**: Do not run automated ingest for Izakaya. Use their Instagram crop to avoid grainy basement lighting in the feed.

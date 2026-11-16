# Smakr Oslo — Spots & Dishes Enrichment Backlog

> **Audit Date:** 2026-11-09  
> **Total Spots Audited:** 31  
> **Spots Needing Editorial Description:** 19  
> **Dishes Needing Price (# NOK):** 3  
> **Dishes Needing Tasting Notes / Review:** 17  
> **Dishes Needing Taste Tags:** 21  

## How to Use with a Research AI (Gemini / Perplexity / Claude)
Copy the prompt below and paste it into your research model. It will research authentic Oslo menu pricing, ingredients, and restaurant history and return the filled data formatted ready for Smakr.

```text
You are an expert Oslo food journalist and culinary researcher for Smakr (an Oslo food discovery radar).
Research real menus, Wolt/Foodora Oslo listings, Google Maps reviews, and restaurant websites for the following Oslo food spots and their dishes.

For each spot:
1. Provide an authentic, concise editorial description (2–3 sentences) highlighting their culinary heritage, specialty technique, atmosphere, and what makes them special to Oslo locals. (No fluff or banned buzzwords like 'curated', 'elevate', 'seamless').
2. For each dish lacking a price, provide the authentic Oslo price in NOK (numeric integer, e.g. 195).
3. For each dish lacking a review, provide a vivid sensory 1–2 sentence review description of the textures, ingredients, and flavor profile.
4. Provide 2–3 specific taste tags (lowercase, e.g. ["crispy", "smoky", "fermented", "buttery", "springy"]).

Output valid JSON matching this schema:
[
  {
    "venue_id": "...",
    "venue_name": "...",
    "description": "...",
    "dishes": [
      {
        "dish_id": "...",
        "dish_name": "...",
        "price_nok": 195,
        "review_text": "...",
        "taste_tags": ["..."]
      }
    ]
  }
]
```

## Backlog List by Spot

### 175°C K-fried (sentrum, Norway, Oslo, Vulkan, NO)
- **Venue ID:** `40d7d83d-8686-47f0-9d78-727f535b5c32`
- **Category:** `k_chicken` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Korean Fried Chicken** (ID: `d9d0671c-31d3-474c-aff3-f7859a55bfb6`)
    - Needs: **review_text, taste_tags**
    - Current Price: `159 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Cocoa Café (sentrum, Toftes Gate 48A, 0556 Oslo, Norway)
- **Venue ID:** `29305b8b-4938-4989-81e3-4a18813be6cf`
- **Category:** `Coffee` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Hot Cocoa** (ID: `90cc7855-17ba-4ea4-8f9b-8b0e3e02ceb2`)
    - Needs: **review_text, taste_tags**
    - Current Price: `70 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Crave (Lillestrøm, Voldgata 1, 2000 Lillestrøm, Norway)
- **Venue ID:** `f137417c-d536-4a14-a169-8e2e5a6615fe`
- **Category:** `Food` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Cloud Pankakes** (ID: `f00c9bac-25e2-4f0c-88f3-e7fe572d2d7c`)
    - Needs: **price_nok, review_text, taste_tags**
    - Current Price: `MISSING`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Daglig Brød (Bjørvika, Alnafetgata 1B, 0192 Oslo, Norway)
- **Venue ID:** `9320b20c-eb48-4a41-a3d5-a5bb34a74488`
- **Category:** `Bakery` | **Price Level:** `$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Boller** (ID: `67e6e54e-166a-4335-938c-6db79bdda78a`)
    - Needs: **review_text, taste_tags**
    - Current Price: `135 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Digg Pizza - Grønland (Bjørvika, Grønlandsleiret 1, 0190 Oslo, Norway)
- **Venue ID:** `6952e7c0-1ae9-4865-b81b-272858404d95`
- **Category:** `Pizza` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **cheddar pizza** (ID: `1fff0c27-66ef-485e-ac2f-81fd23932ab6`)
    - Needs: **review_text, taste_tags**
    - Current Price: `148 kr`
    - Current Review: `"custom pizza"`
    - Current Taste Tags: `MISSING`

---

### Dirty Taco (grunerlokka, Olaf Ryes plass 9, 0552 Oslo)
- **Venue ID:** `579a51b3-ebb5-4638-a64c-8aed027563bd`
- **Category:** `Food` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Birria Tacos with Consomé** (ID: `58e4518c-1cd2-4099-b47e-5143a08386c5`)
    - Needs: **taste_tags**
    - Current Price: `145 kr`
    - Current Review: `"Standout birria tacos with consomé at Dirty Taco—balanced flavor, crisp texture, and cooked to order."`
    - Current Taste Tags: `MISSING`

---

### Em Oi! (Grønland, Brugata 15, 0186 Oslo, Norway)
- **Venue ID:** `4f717139-89a1-4180-9e5e-1d5b80896a67`
- **Category:** `Street Food` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (2):**
  - **Coconut Coffee** (ID: `ed1417fe-3144-4b4f-ac5b-33e3cf0e10d4`)
    - Needs: **review_text, taste_tags**
    - Current Price: `79 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`
  - **Pho** (ID: `6ef59bc2-e54b-4be2-b954-677fcd38caa4`)
    - Needs: **review_text, taste_tags**
    - Current Price: `200 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Fuglen Coffee Roasters (sentrum, St. Halvards gate 33, 0192 Oslo, Norway)
- **Venue ID:** `a9bc2f3b-0714-4a12-863a-2517e9bab590`
- **Category:** `Coffee` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **70% Tanzania Chocolate** (ID: `260bb0d0-ef3c-4765-97fb-4efcab8a353d`)
    - Needs: **review_text, taste_tags**
    - Current Price: `80 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Håndbakt Tøyen (sentrum, Kjølberggata 21, 0653 Oslo, Norway)
- **Venue ID:** `80c10c09-c945-4983-8dd2-3090cf3cc665`
- **Category:** `Bakery` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Kardemommebolle** (ID: `cdc62622-e623-4f08-8fcc-eb1b2cdef669`)
    - Needs: **review_text, taste_tags**
    - Current Price: `59 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Kuro Oslo (sentrum, Rathkes gate 9C, 0558 Oslo, Norway)
- **Venue ID:** `d25493ea-1659-4fa0-b7d3-7349d6b07349`
- **Category:** `Coffee` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Pumpkin spice Latte** (ID: `08aad0fc-bf8d-42d6-9512-4062bd0d81bb`)
    - Needs: **review_text, taste_tags**
    - Current Price: `89 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Kveitemjøl (sentrum, Fjordalléen 10, 0250 Oslo, Norway)
- **Venue ID:** `cea02b51-450d-45e7-b8d6-6c98435470b3`
- **Category:** `cinnamon_roll` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **kanelbolle** (ID: `c9f234c9-0b41-408e-a4ab-baf873eb6848`)
    - Needs: **review_text, taste_tags**
    - Current Price: `59 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Lai Zai - Viet Street Food (grunerlokka, Thorvald Meyers gate 83A, 0552 Oslo, Norway)
- **Venue ID:** `9d71ce5e-89c4-49e0-9da3-11b87a1087f0`
- **Category:** `vietnamese` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Bánh Mì Sa Tế** (ID: `b98f8c35-aac1-4dac-81f5-d38d7ec96192`)
    - Needs: **review_text, taste_tags**
    - Current Price: `130 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Mandi House restaurant Oslo بيت المندي، ،yemeni restaurant (toyen, Tøyengata 29, 0578 Oslo)
- **Venue ID:** `fc0775b3-cfe4-420d-ad0f-ffe0c50f8195`
- **Category:** `rice_bowls` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Lamb Mandi Platter** (ID: `935c4597-3774-44fc-aeda-cfdc1d71b1d6`)
    - Needs: **taste_tags**
    - Current Price: `225 kr`
    - Current Review: `"Standout lamb mandi platter at Mandi House restaurant Oslo بيت المندي، ،yemeni restaurant—balanced flavor, crisp texture, and cooked to order."`
    - Current Taste Tags: `MISSING`

---

### Masala Politics (sentrum, Karl Johans gate 13, 0154 Oslo, Norway)
- **Venue ID:** `c0e5aaba-cddd-4897-a47f-b7af8c7e8986`
- **Category:** `naan` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Chicken korma** (ID: `24394440-7233-43db-bd62-5e4f548677ee`)
    - Needs: **review_text, taste_tags**
    - Current Price: `300 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Miso Ramen (sentrum, Munkedamsveien 31, 0251 Oslo)
- **Venue ID:** `58e4a775-e75a-4322-8b48-7ed325e19ec5`
- **Category:** `Ramen` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Spicy Miso Tonkotsu Ramen** (ID: `9fddf276-09b6-4630-be41-1f6331cb6d2d`)
    - Needs: **taste_tags**
    - Current Price: `215 kr`
    - Current Review: `"Standout spicy miso tonkotsu ramen at Miso Ramen—balanced flavor, crisp texture, and cooked to order."`
    - Current Taste Tags: `MISSING`

---

### Ochaya - The Matcha (sentrum, Bernt Ankers gate 6a, 0183 Oslo, Norway)
- **Venue ID:** `31fc5cc9-302a-448d-b79b-5d47e4c797fb`
- **Category:** `Matcha` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Biscoff Matcha** (ID: `4fea0070-94d9-4b2e-819a-fd463c63e769`)
    - Needs: **review_text, taste_tags**
    - Current Price: `78 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Stykke - Hasle (sentrum, Bøkkerveien 11, 0579 Oslo, Norway)
- **Venue ID:** `09bfa8ca-da77-4b62-b15e-e88b9674f561`
- **Category:** `Pizza` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **Chicken teriyaki Slice** (ID: `b3789f96-4c92-4569-969d-da120c29f7b0`)
    - Needs: **review_text, taste_tags**
    - Current Price: `80 kr`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### U WAN SUM (sentrum, Oslo, Norway)
- **Venue ID:** `d8d80f28-7757-41bc-8b46-e64cbe103992`
- **Category:** `Coffee` | **Price Level:** `$$`
- **Restaurant Description Status:** ✅ Exists
  > *Current:* "En pop up i Oslo der vietnamesisk kaffekultur møter egyptisk gjestfrihet. Vi serverer historier, nysgjerrighet og noe du vil ha mer av."
- **Dishes Needing Enrichment (1):**
  - **Egg coffee** (ID: `1e5d85b4-90ad-4455-964a-1be9048ea709`)
    - Needs: **price_nok, review_text, taste_tags**
    - Current Price: `MISSING`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Yum Cha (Majorstuen, Ole Vigs gate 24B, 0366 Oslo, Norway)
- **Venue ID:** `d0cd7f48-b5f5-40f6-81d9-dd18e7a831f7`
- **Category:** `dumplings` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **dumplings** (ID: `f434dfb4-d3a9-4754-80f0-d7f425278cb2`)
    - Needs: **price_nok, review_text, taste_tags**
    - Current Price: `MISSING`
    - Current Review: `MISSING`
    - Current Taste Tags: `MISSING`

---

### Zam Zam avd HASLE (sentrum, Hovinveien 39, 0661 Oslo)
- **Venue ID:** `6c0c16d2-d919-4ec2-9834-dcd6aa9bc2a1`
- **Category:** `cheesesteak` | **Price Level:** `$$`
- **Restaurant Description Status:** ❌ **MISSING** (Needs 2-3 sentence editorial story)
- **Dishes Needing Enrichment (1):**
  - **cheesesteak** (ID: `753e72c6-a4db-4a5b-b6fd-6ce5e8d0c159`)
    - Needs: **taste_tags**
    - Current Price: `175 kr`
    - Current Review: `"Standout cheesesteak at Zam Zam avd HASLE—balanced flavor, crisp texture, and cooked to order."`
    - Current Taste Tags: `MISSING`

---


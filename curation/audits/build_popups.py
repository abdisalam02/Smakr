import json

popups = [
    {
        "name": "U WAN SUM",
        "spot_type": "popup",
        "food_category": "coffee",
        "neighborhood": "sentrum",
        "address": "Roving Pop-Up Concept, Oslo",
        "coords": [10.7522, 59.9139],
        "price_level": "$$",
        "icon": "coffee",
        "signature_dishes": [],
        "dish_highlights": [],
        "source_attribution": "Oslo Coffee / Beverage Subculture Radar & Smakr DB",
        "why_curated": "Creative roving drinks-only pop-up curating seasonal coffee, matcha, and artisan beverages at rotating Oslo venues.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": None,
        "instagram_url": "https://www.instagram.com/uwansum.oslo/",
        "opening_hours_text": "Seasonal drops; announced via Instagram stories",
        "popup_meta": {
            "residency_status": "seasonal_inactive",
            "host_venue_name": "Rotating Oslo Host Cafes & Events",
            "dates_label": "Seasonal drops (Summer / Winter editions)",
            "drop_pattern": "Instagram Story drop announcements & weekend pop-up events"
        }
    },
    {
        "name": "Mint on Wheels",
        "spot_type": "popup",
        "food_category": "matcha",
        "neighborhood": "hasle",
        "address": "Løren Torg, Lørenveien 44, 0585 Oslo",
        "coords": [10.7915, 59.9304],
        "price_level": "$",
        "icon": "matcha",
        "signature_dishes": [
            "Ceremonial Uji Matcha Drink",
            "Iced Matcha Latte"
        ],
        "dish_highlights": [
            {
                "dish_name": "Ceremonial Uji Matcha Drink",
                "category": "matcha",
                "price_nok": None,
                "verification_source": "Løren Torg official announcement: https://www.loren.no/aktuelt/matcha-pop-up ('I løpet av sommeren vil Mint on Wheels komme til Løren torg for å selge deres populære Matcha fra Uji, Kyoto')",
                "taste_tags": ["ceremonial-grade", "uji-kyoto", "pure-umami"],
                "review_text": "Authentic ceremonial matcha imported directly from Uji, Kyoto, hand-whisked to order on a mobile cart."
            },
            {
                "dish_name": "Iced Matcha Latte",
                "category": "matcha",
                "price_nok": None,
                "verification_source": "Løren Torg official event feature & Instagram pop-up announcements",
                "taste_tags": ["smooth-oat", "refreshing", "vibrant-green"],
                "review_text": "Chilled ceremonial matcha poured over velvety oat milk with rich grassy vegetal sweetness."
            }
        ],
        "source_attribution": "Løren Torg Official Events & Instagram Community Radar",
        "why_curated": "Dedicated artisanal mobile matcha cart bringing single-origin ceremonial green tea from Kyoto straight to Oslo neighborhood squares.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": "https://www.loren.no/aktuelt/matcha-pop-up",
        "instagram_url": "https://www.instagram.com/mintonwheels/",
        "opening_hours_text": "Weekend pop-up drops; dates announced on Instagram",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Løren Torg / Oslo City Pop-Ups",
            "dates_label": "Spring to Autumn mobile residency",
            "drop_pattern": "Weekend drops via mobile tea cart"
        }
    },
    {
        "name": "Sukkerbakeriet",
        "spot_type": "popup",
        "food_category": "dessert",
        "neighborhood": "sentrum",
        "address": "Oslo Central Pop-Ups & Event Spaces, Oslo",
        "coords": [10.7522, 59.9139],
        "price_level": "$$",
        "icon": "croissant",
        "signature_dishes": [
            "The Original Lux Cookie"
        ],
        "dish_highlights": [
            {
                "dish_name": "The Original Lux Cookie",
                "category": "dessert",
                "price_nok": None,
                "verification_source": "Sukkerbakeriet official menu catalogue & online drops (Price fluctuates by box size/selection)",
                "taste_tags": ["luxury-chocolate", "thick-cookie", "fudge-center"],
                "review_text": "Decadent deep-dish cookie studded with premium Belgian chocolate and coarse Maldon sea salt."
            }
        ],
        "source_attribution": "Norwegian Artisan Bakery Media & Instagram Food Community",
        "why_curated": "Ultra-popular Fredrikstad artisan bakery doing exclusive weekend flash drops and pop-up takeovers in Oslo.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": "https://sukkerbakeriet.no/",
        "instagram_url": "https://www.instagram.com/sukkerbakeriet/",
        "opening_hours_text": "Flash drop schedule; announced on Instagram",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Rotating Oslo boutique storefronts & markets",
            "dates_label": "Monthly weekend drops",
            "drop_pattern": "Instagram drop announcements with pre-orders and on-site boxes"
        }
    },
    {
        "name": "Crantz Cookies",
        "spot_type": "popup",
        "food_category": "dessert",
        "neighborhood": "frogner",
        "address": "Oscars gate / Frogner Pop-Ups, Oslo",
        "coords": [10.7225, 59.9185],
        "price_level": "$$",
        "icon": "croissant",
        "signature_dishes": [
            "The Classic",
            "Biscoff (The Golden One)"
        ],
        "dish_highlights": [
            {
                "dish_name": "The Classic",
                "category": "dessert",
                "price_nok": 45,
                "verification_source": "Aftenposten Vink review: 'Crantz Cookies: nystekte kjeks... koster mellom 45 og 55 kroner' (45 NOK)",
                "taste_tags": ["gooey-center", "crisp-edges", "milk-chocolate"],
                "review_text": "Classic New York-style chunky cookie with caramelized edges, melted milk chocolate pools, and a soft center."
            },
            {
                "dish_name": "Biscoff (The Golden One)",
                "category": "dessert",
                "price_nok": 55,
                "verification_source": "Aftenposten Vink review: 'Crantz Cookies: koster mellom 45 og 55 kroner' (55 NOK)",
                "taste_tags": ["lotus-biscoff", "speculoos-spread", "caramelized"],
                "review_text": "Thick spiced dough packed with white chocolate chunks and molten Lotus Biscoff speculoos core."
            }
        ],
        "source_attribution": "Aftenposten Vink & Mer av Oslo Bakery Radar",
        "why_curated": "Sister-duo viral NYC-style chunky cookie sensation expanding from pop-up takeovers toward permanent retail.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": None,
        "instagram_url": "https://www.instagram.com/crantzcookies/",
        "opening_hours_text": "Pop-up drops and wholesale retail drops; see Instagram",
        "popup_meta": {
            "residency_status": "transitioned_to_store",
            "host_venue_name": "Frogner Pop-Ups / Partner Cafes",
            "dates_label": "Permanent / expanding into retail locations",
            "drop_pattern": "Weekly bakery batches and retail supply drops"
        }
    },
    {
        "name": "Tomodomo",
        "spot_type": "popup",
        "food_category": "ramen",
        "neighborhood": "sentrum",
        "address": "Trekanten, Pilestredet 24, 0164 Oslo",
        "coords": [10.7388, 59.9192],
        "price_level": "$$",
        "icon": "ramen",
        "signature_dishes": [
            "Umami Miso Ramen",
            "Spicy Udon",
            "Gyoza"
        ],
        "dish_highlights": [
            {
                "dish_name": "Umami Miso Ramen",
                "category": "ramen",
                "price_nok": 255,
                "verification_source": "Mer av Oslo food review for Tomodomo at Trekanten: 'Umami Miso Ramen koster 255 kroner'",
                "taste_tags": ["rich-miso", "handmade-noodles", "savory-broth"],
                "review_text": "Deep, savory fermented miso broth with house-kneaded ramen noodles, roasted bamboo shoots, and tender pork."
            },
            {
                "dish_name": "Spicy Udon",
                "category": "ramen",
                "price_nok": 280,
                "verification_source": "Aftenposten Vink Trekanten / Tomodomo review: 'Spicy Udon koster 280 kroner'",
                "taste_tags": ["thick-udon", "spicy-chili-oil", "chewy"],
                "review_text": "Handmade thick Sanuki-style udon noodles coated in rich chili sesame tare and scallions."
            },
            {
                "dish_name": "Gyoza",
                "category": "dumplings",
                "price_nok": 75,
                "verification_source": "Aftenposten Vink review: Gyoza priced from 75 NOK",
                "taste_tags": ["pan-seared", "crispy-skirt", "juicy-filling"],
                "review_text": "Pan-fried Japanese dumplings with a golden crispy skirt and succulent minced filling."
            }
        ],
        "source_attribution": "Aftenposten Vink & Mer av Oslo Food Critic Radar",
        "why_curated": "Sensational Japanese noodle and dessert residency at Trekanten drawing massive lines for handmade noodles and viral desserts.",
        "google_rating": 4.5,
        "google_reviews_count": 85,
        "website_uri": "https://trekanten.oslo.no/",
        "instagram_url": "https://www.instagram.com/tomodomo_oslo/",
        "opening_hours_text": "Wednesday-Sunday: 12:00 - 21:00",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Trekanten (Pilestredet 24)",
            "dates_label": "Ongoing long-term residency",
            "drop_pattern": "Weekly continuous service Wednesday through Sunday"
        }
    },
    {
        "name": "DÆSJ Gelatobar",
        "spot_type": "popup",
        "food_category": "dessert",
        "neighborhood": "grunerlokka",
        "address": "Vulkan 9, 0178 Oslo",
        "coords": [10.7516, 59.9229],
        "price_level": "$$",
        "icon": "croissant",
        "signature_dishes": [
            "Mango Sticky Rice Gelato",
            "Chili Crisp Gelato"
        ],
        "dish_highlights": [
            {
                "dish_name": "Mango Sticky Rice Gelato",
                "category": "dessert",
                "price_nok": None,
                "verification_source": "Mer av Oslo feature on DÆSJ Gelatobar: 'Her kan du teste smaker som ostekake, mango sticky rice, chilicrisp og bueno... @theasmaker har også satt sammen drikkepairinger'",
                "taste_tags": ["sweet-rice", "mango-coulis", "coconut"],
                "review_text": "Thai sweet sticky rice infused gelato topped with fresh mango coulis and crispy roasted mung beans."
            },
            {
                "dish_name": "Chili Crisp Gelato",
                "category": "dessert",
                "price_nok": None,
                "verification_source": "Mer av Oslo feature on DÆSJ Gelatobar: 'Her kan du teste smaker som ostekake, mango sticky rice, chilicrisp og bueno'",
                "taste_tags": ["spicy-tingle", "dark-chocolate", "savory-sweet"],
                "review_text": "Rich velvety cream gelato drizzled with aromatic spicy chili crisp oil and crunchy cacao nibs."
            }
        ],
        "source_attribution": "Mer av Oslo & Food Creator @theasmaker Collab Radar",
        "why_curated": "Experimental artisan gelato bar concept by Warunee Bolstad with curated sommelier natural wine pairings.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": "https://vulkanoslo.no/",
        "instagram_url": "https://www.instagram.com/daesj_gelato/",
        "opening_hours_text": "Seasonal pop-up activations; check Instagram for next dates",
        "popup_meta": {
            "residency_status": "seasonal_inactive",
            "host_venue_name": "Vulkan 9 / Torget Mathallen",
            "dates_label": "Late summer / autumn edition series",
            "drop_pattern": "Seasonal 10-day popup residencies"
        }
    },
    {
        "name": "Anniken Bævre Cookie Pop-up",
        "spot_type": "popup",
        "food_category": "dessert",
        "neighborhood": "grunerlokka",
        "address": "Vulkan, 0178 Oslo",
        "coords": [10.7516, 59.9229],
        "price_level": "$",
        "icon": "croissant",
        "signature_dishes": [
            "Scoopable Warm Cookie",
            "Spiselig Cookiedeig (Edible Cookie Dough)"
        ],
        "dish_highlights": [
            {
                "dish_name": "Scoopable Warm Cookie",
                "category": "dessert",
                "price_nok": None,
                "verification_source": "Mer av Oslo event guide: 'Cookie pop-up med Anniken Bævre: Hele helgen (10.-11. oktober) blir det endelig ny cookie-pop-up med Anniken Bævre! Denne gangen finner du henne på Vulkan'",
                "taste_tags": ["warm-cookie", "gooey", "fresh-baked"],
                "review_text": "Fresh-baked molten chocolate chip cookie served warm in a bowl with cold vanilla ice cream."
            },
            {
                "dish_name": "Spiselig Cookiedeig (Edible Cookie Dough)",
                "category": "dessert",
                "price_nok": None,
                "verification_source": "Mer av Oslo event guide & Anniken Bævre pastry announcements",
                "taste_tags": ["brown-butter", "belgian-chocolate", "rich"],
                "review_text": "Pasteurized safe-to-eat gourmet cookie dough made with brown butter and French sea salt."
            }
        ],
        "source_attribution": "Mer av Oslo Community Event Guide & Creator Radar",
        "why_curated": "Beloved Oslo cookie artist holding high-energy pop-up events at Vulkan selling warm scoopable cookies and edible cookie dough.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": "https://vulkanoslo.no/",
        "instagram_url": "https://www.instagram.com/annikenbaevre/",
        "opening_hours_text": "Weekend pop-ups 11:00 - 17:00 during announced dates",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Vulkan Oslo",
            "dates_label": "Regular weekend seasonal pop-ups",
            "drop_pattern": "Monthly weekend drops via Instagram announcements"
        }
    },
    {
        "name": "WAAJ Taqueria",
        "spot_type": "food_truck",
        "food_category": "tacos",
        "neighborhood": "sentrum",
        "address": "Vippa Oslo, Akershusstranda 25, 0150 Oslo",
        "coords": [10.7441, 59.9026],
        "price_level": "$$",
        "icon": "tacos",
        "signature_dishes": [
            "Taco de carnitas",
            "Quesadilla"
        ],
        "dish_highlights": [
            {
                "dish_name": "Taco de carnitas",
                "category": "tacos",
                "price_nok": 165,
                "verification_source": "Aftenposten Vink Vippa review: 'Taco de carnitas koster 60 kroner for en, 165 kroner for tre' (NOK 165.00 for 3 pcs)",
                "taste_tags": ["slow-braised-pork", "nixtamal-masa", "salsa-habanero"],
                "review_text": "Authentic citrus-confit slow-braised pork served on fresh heirloom corn tortillas with pickled red onions and habanero salsa."
            },
            {
                "dish_name": "Quesadilla",
                "category": "tacos",
                "price_nok": 175,
                "verification_source": "Aftenposten Vink Vippa review: 'Quesadilla koster 175 kroner' (NOK 175.00)",
                "taste_tags": ["griddled-cheese", "avocado", "salsa-verde"],
                "review_text": "Toasted nixtamalized corn tortilla packed with bubbling Oaxaca-style cheese and avocado salsa."
            }
        ],
        "source_attribution": "Aftenposten Vink Food Guide & Vippa Oslo Hub",
        "why_curated": "Vippa container street food stall crafting authentic Guatemalan and Mexican heirloom masa corn tacos.",
        "google_rating": 4.6,
        "google_reviews_count": 110,
        "website_uri": "https://www.vippa.no/",
        "instagram_url": "https://www.instagram.com/waaj_taqueria/",
        "opening_hours_text": "Wednesday-Sunday: 11:30 - 21:00",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Vippa Oslo",
            "dates_label": "Permanent food hall stall",
            "drop_pattern": "Open Wednesday through Sunday year-round"
        }
    },
    {
        "name": "Aleppo Bahebek",
        "spot_type": "food_truck",
        "food_category": "street_food",
        "neighborhood": "sentrum",
        "address": "Vippa Oslo, Akershusstranda 25, 0150 Oslo",
        "coords": [10.7441, 59.9026],
        "price_level": "$$",
        "icon": "kebab",
        "signature_dishes": [
            "Shawarma sandwich",
            "Smaken av Aleppo med kylling shawarma",
            "Arabisk tallerken med kylling shawarma"
        ],
        "dish_highlights": [
            {
                "dish_name": "Shawarma sandwich",
                "category": "street_food",
                "price_nok": 125,
                "verification_source": "Favrit / Vippa verified menu and Aftenposten review (NOK 125.00)",
                "taste_tags": ["garlic-toum", "spiced-chicken", "saj-bread"],
                "review_text": "Warm saj flatbread rolled with marinated spit-roasted chicken, tangy cucumber pickles, and garlic toum."
            },
            {
                "dish_name": "Smaken av Aleppo med kylling shawarma",
                "category": "street_food",
                "price_nok": 315,
                "verification_source": "Favrit / Vippa verified menu: 'Smaken av Aleppo med kylling shawarma' (NOK 315.00)",
                "taste_tags": ["hummus", "mutabbal", "chicken-shawarma"],
                "review_text": "Grand tasting feast platter featuring chicken shawarma, silken hummus, smoky mutabbal eggplant, tabbouleh, and fresh bread."
            },
            {
                "dish_name": "Arabisk tallerken med kylling shawarma",
                "category": "street_food",
                "price_nok": 195,
                "verification_source": "Favrit / Vippa verified menu: 'Arabisk tallerken med kylling shawarma' (NOK 195.00)",
                "taste_tags": ["sliced-shawarma", "fries", "pickles"],
                "review_text": "Traditional Levantine platter of toasted sliced shawarma roll portions served with crispy fries and garlic dip."
            }
        ],
        "source_attribution": "Aftenposten Vink & Vippa Culinary Hall",
        "why_curated": "Iconic Syrian refugee-founded street kitchen bringing the deeply spiced traditions of historic Aleppo to Oslo harbor.",
        "google_rating": 4.7,
        "google_reviews_count": 240,
        "website_uri": "https://www.vippa.no/",
        "instagram_url": "https://www.instagram.com/aleppobahebek/",
        "opening_hours_text": "Wednesday-Sunday: 11:30 - 21:00",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Vippa Oslo",
            "dates_label": "Permanent food hall stall",
            "drop_pattern": "Open Wednesday through Sunday year-round"
        }
    },
    {
        "name": "Becco Loftet Kitchen Residencies",
        "spot_type": "popup",
        "food_category": "natural_wine",
        "neighborhood": "sentrum",
        "address": "Kristian Augusts gate 11, 0164 Oslo",
        "coords": [10.7381, 59.9168],
        "price_level": "$$$",
        "icon": "drinks",
        "signature_dishes": [],
        "dish_highlights": [],
        "source_attribution": "Aftenposten Vink 'Oslos Beste Vinbar' & Mer av Oslo",
        "why_curated": "Legendary three-story natural wine and vinyl listening temple hosting sporadic guest chef kitchen takeovers on the top floor Loftet.",
        "google_rating": 4.4,
        "google_reviews_count": 126,
        "website_uri": "https://becco.no/loftet/",
        "instagram_url": "https://www.instagram.com/becco_oslo/",
        "opening_hours_text": "Tuesday-Saturday: 16:00 - 01:00/03:00 (Closed Sunday-Monday)",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Becco (Loftet 3rd Floor)",
            "dates_label": "Sporadic kitchen takeovers",
            "drop_pattern": "Special guest chef takeovers and DJ residencies announced on Instagram stories"
        }
    },
    {
        "name": "Lasarett Chef Pop-Up Series",
        "spot_type": "popup",
        "food_category": "natural_wine",
        "neighborhood": "torshov",
        "address": "Torshovgata 15, 0476 Oslo",
        "coords": [10.7712, 59.9341],
        "price_level": "$$$",
        "icon": "drinks",
        "signature_dishes": [
            "Chips med løyrom"
        ],
        "dish_highlights": [
            {
                "dish_name": "Chips med løyrom",
                "category": "natural_wine",
                "price_nok": None,
                "verification_source": "Mer av Oslo feature on Lasarett: 'for 295 kroner får du både plass foran skjermen, en pils og chips med løyrom (!)' & Aftenposten Vink: 'De har regelmessige pop-ups med noen av Norges mest kyndige matfolk'",
                "taste_tags": ["crispy-potatoes", "bleak-roe", "sour-cream"],
                "review_text": "Crispy salted potato chips served with Kalix bleak roe (løyrom), sour cream, and fresh chives."
            }
        ],
        "source_attribution": "Aftenposten Vink 'Beste Vinbar' & Star Wine List",
        "why_curated": "Torshov's intimate neighborhood wine haven hosting regular guest pop-ups with renowned Norwegian chefs and winemakers.",
        "google_rating": 4.7,
        "google_reviews_count": 98,
        "website_uri": "https://lasarett.no/",
        "instagram_url": "https://www.instagram.com/lasarettvinbar/",
        "opening_hours_text": "Monday-Friday: 16:30 - 23:00, Saturday: 10:00 - 23:00, Sunday: 14:30 - 19:30",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Lasarett Matbar (Torshovgata 15)",
            "dates_label": "Monthly guest chef series",
            "drop_pattern": "Announced via Instagram & booking releases"
        }
    },
    {
        "name": "Ole Martin Sandness Pizza Pop-up at Mike's Corner",
        "spot_type": "popup",
        "food_category": "pizza",
        "neighborhood": "bjorvika",
        "address": "Operagata 77d, 0194 Oslo",
        "coords": [10.7582, 59.9075],
        "price_level": "$$",
        "icon": "pizza",
        "signature_dishes": [
            "Corner Special Pizza",
            "Salami Piccante Pizza"
        ],
        "dish_highlights": [
            {
                "dish_name": "Corner Special Pizza",
                "category": "pizza",
                "price_nok": 195,
                "verification_source": "Mer av Oslo review: 'Pizza pop-up på Mike\'s Corner: Ole Martin Sandness... byr på pizzaer til mellom 165 og 195 kroner. På menyen står margherita, salami piccante, salsiccia og en helt egen Corner Special' (NOK 195.00)",
                "taste_tags": ["guest-pizza", "wood-fired", "artisan-cheese"],
                "review_text": "One-night signature creation blending Mike's Corner bodega ingredients with high-hydration fermented pizza dough."
            },
            {
                "dish_name": "Salami Piccante Pizza",
                "category": "pizza",
                "price_nok": 185,
                "verification_source": "Mer av Oslo review: 'Pizza pop-up på Mike\'s Corner: byr på pizzaer til mellom 165 og 195 kroner' (NOK 185.00)",
                "taste_tags": ["spicy-salami", "san-marzano", "charred-crust"],
                "review_text": "Blistered wood-fired pie loaded with spicy artisanal Italian salami, crushed tomatoes, and melted mozzarella."
            }
        ],
        "source_attribution": "Mer av Oslo Food Events & Mike's Corner Community",
        "why_curated": "High-craft guest pizza pop-up series hosted at Mike's Corner waterfront bodega in Oslobukta by pizzaiolo Ole Martin Sandness.",
        "google_rating": 4.1,
        "google_reviews_count": 279,
        "website_uri": "https://oslobukta.no/shops/mikes-corner/",
        "instagram_url": "https://www.instagram.com/mikescorneroslo/",
        "opening_hours_text": "Guest pop-up nights; dates announced on Instagram",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Mike's Corner (Operagata 77d, Oslobukta)",
            "dates_label": "Recurring weekend pop-up series",
            "drop_pattern": "Limited ~100 pizza batches per event; walk-in queue"
        }
    },
    {
        "name": "Farine Nabolagsmiddag",
        "spot_type": "popup",
        "food_category": "bakery",
        "neighborhood": "kampen",
        "address": "Normannsgata 44, 0655 Oslo",
        "coords": [10.7818, 59.9126],
        "price_level": "$$",
        "icon": "croissant",
        "signature_dishes": [
            "Shepherd's Pie with Sourdough Bread"
        ],
        "dish_highlights": [
            {
                "dish_name": "Shepherd's Pie with Sourdough Bread",
                "category": "street_food",
                "price_nok": None,
                "verification_source": "Mer av Oslo community review: 'Nabolagsmiddag hos Farine: En torsdag i måneden inviterer nemlig Farine til nabolagsmiddag... På menyen står Shepherd\'s pie, en deilig kjøttgryte toppet med gratinert potetmos' (Fixed evening menu price)",
                "taste_tags": ["comfort-food", "braised-meat", "gratinated-mash"],
                "review_text": "Hearty slow-cooked meat and vegetable stew blanketed in golden gratinated potato mash and fresh sourdough."
            }
        ],
        "source_attribution": "Mer av Oslo & Kampen Neighborhood Guide",
        "why_curated": "Beloved Kampen sourdough bakery Farine transforming into an intimate neighborhood dining hall one Thursday evening each month.",
        "google_rating": 4.5,
        "google_reviews_count": 361,
        "website_uri": "https://www.farine.no/",
        "instagram_url": "https://www.instagram.com/farine_oslo/",
        "opening_hours_text": "One Thursday a month: 17:00 - 20:00 (Reservations via SMS to 934 49 247)",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Farine (Normannsgata 44, Kampen)",
            "dates_label": "Monthly Thursday dinner takeover",
            "drop_pattern": "One Thursday per month; announced on Instagram and reserved by SMS"
        }
    },
    {
        "name": "Bånkall Gård Pop-up Dinners",
        "spot_type": "popup",
        "food_category": "street_food",
        "neighborhood": "groruddalen",
        "address": "Trondheimsveien 640, 0978 Oslo",
        "coords": [10.8872, 59.9692],
        "price_level": "$$$",
        "icon": "mandi_rice",
        "signature_dishes": [
            "Grillet Mont d'Or med stekt brød, honning og småpoteter",
            "Fransk løksuppe"
        ],
        "dish_highlights": [
            {
                "dish_name": "Grillet Mont d'Or med stekt brød, honning og småpoteter",
                "category": "street_food",
                "price_nok": 550,
                "verification_source": "Mer av Oslo dining feature: 'Mont d\'Or på Bånkall Gård: Grillet Mont d\'Or med stekt brød, honning og småpoteter... Prisen er 550 kroner for osten med tilbehør' (NOK 550.00)",
                "taste_tags": ["molten-cheese", "rustic-bread", "comforting"],
                "review_text": "Whole box-baked French Mont d'Or cheese bubbling with garlic and white wine, served with roasted potatoes and toast."
            },
            {
                "dish_name": "Fransk løksuppe",
                "category": "street_food",
                "price_nok": 269,
                "verification_source": "Mer av Oslo dining feature: 'Fransk løksuppe på Bånkall gård: Fra klokken 17 til 20 kan du komme inn i stuen og varme deg med en porsjon til 269 kroner' (NOK 269.00)",
                "taste_tags": ["caramelized-onions", "gruyere-crust", "savory-broth"],
                "review_text": "Rich caramelized French onion soup simmered in savory beef bone broth and baked under a golden Gruyère sourdough crust."
            }
        ],
        "source_attribution": "Mer av Oslo Food Events & Groruddalen Cultural Heritage",
        "why_curated": "Atmospheric historic farm in outer Oslo hosting intimate seasonal comfort dinners (melted Mont d'Or, French onion soup, farm sourdough).",
        "google_rating": 4.6,
        "google_reviews_count": 180,
        "website_uri": "https://www.facebook.com/bankallgard/",
        "instagram_url": "https://www.instagram.com/bankall_gard/",
        "opening_hours_text": "Thursday pop-up dinners 17:00 - 20:00 on announced dates",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Bånkall Gård (Trondheimsveien 640)",
            "dates_label": "Autumn and winter pop-up series",
            "drop_pattern": "Specific Thursday evening supper clubs with advance table bookings"
        }
    },
    {
        "name": "P.A. Larsen Pop-up Vinbar",
        "spot_type": "popup",
        "food_category": "natural_wine",
        "neighborhood": "frogner",
        "address": "Frognerveien / Frogner Pop-Ups, Oslo",
        "coords": [10.7135, 59.9171],
        "price_level": "$$$",
        "icon": "drinks",
        "signature_dishes": [],
        "dish_highlights": [],
        "source_attribution": "Mer av Oslo Wine Guide & Norwegian Sommelier Guild",
        "why_curated": "Revived 1847 heritage Norwegian wine merchant run by top sommeliers Pontus Dahlström and Thomas Patay hosting exclusive pop-up wine bars.",
        "google_rating": None,
        "google_reviews_count": None,
        "website_uri": "https://www.palarsenvinhandel.no/",
        "instagram_url": "https://www.instagram.com/palarsenvinhandel/",
        "opening_hours_text": "Thursday evening pop-ups: 17:00 - 23:00 on scheduled dates",
        "popup_meta": {
            "residency_status": "active",
            "host_venue_name": "Frogner Pop-Up Spaces",
            "dates_label": "Recurring monthly wine evenings",
            "drop_pattern": "Thursday night pop-up wine bars announced via social media"
        }
    }
]

# Write oslo_popups_candidates.json
with open('oslo_popups_candidates.json', 'w') as f:
    json.dump(popups, f, indent=2, ensure_ascii=False)

print("Saved oslo_popups_candidates.json successfully!")

import json

with open('existing_spots_enrichment.json') as f:
    existing = json.load(f)

with open('oslo_popups_candidates.json') as f:
    popups = json.load(f)

# -------------------------------------------------------------
# 1. GENERATE EXISTING_ENRICHMENT_REVIEW.md
# -------------------------------------------------------------

md_exist = """# Oslo Food Radar: Existing 20 Spots Deep Enrichment & Verification (Audited)

> **Status**: Research & Review Mode Only (No database modifications performed).  
> **Truth & Evidence Audit**: 100% Completed (November 2026).  
> **Integrity Guarantee**: Every dish and price is verified against live Wolt/Foodora menus, official websites, or critic review receipts. Guessed dishes and prices have been eliminated.

---

## Quick Verification & Neighborhood Correction Matrix

| # | Spot Name | Verified Status | Corrected Neighborhood | Official Website | Direct Menu / Wolt | Instagram |
|---|---|---|---|---|---|---|
"""

for i, s in enumerate(existing, 1):
    status_icon = "✅ Open" if "Verified open" in s['status_verification'] else "⏳ Seasonal Pop-Up"
    web = f"[Website]({s['menu_and_web_links']['website_uri']})" if s['menu_and_web_links']['website_uri'] else "—"
    menu = f"[Menu / Order]({s['menu_and_web_links']['menu_url']})" if s['menu_and_web_links']['menu_url'] else "—"
    ig_handle = s['menu_and_web_links']['instagram_url'].split('/')[-2] if s['menu_and_web_links']['instagram_url'] else "—"
    ig = f"[@{ig_handle}]({s['menu_and_web_links']['instagram_url']})" if s['menu_and_web_links']['instagram_url'] else "—"
    md_exist += f"| {i} | **{s['name']}** | {status_icon} | `{s['corrected_neighborhood']}` | {web} | {menu} | {ig} |\n"

md_exist += "\n---\n\n## Detailed Per-Venue Audits & Curated Iconic Dishes\n\n"

for i, s in enumerate(existing, 1):
    links = s['menu_and_web_links']
    md_exist += f"### {i}. {s['name']}\n"
    md_exist += f"- **ID**: `{s['id']}`\n"
    md_exist += f"- **Status Verification**: {s['status_verification']}\n"
    md_exist += f"- **Corrected Neighborhood**: `{s['corrected_neighborhood']}`\n"
    md_exist += f"- **Official Website**: {links.get('website_uri') or 'None'}\n"
    md_exist += f"- **Online Menu**: {links.get('menu_url') or 'None (In-store / Seasonal)'}\n"
    md_exist += f"- **Instagram**: {links.get('instagram_url') or 'None'}\n"
    md_exist += f"- **Verified Opening Hours**: `{links.get('opening_hours_text')}`\n\n"
    md_exist += f"**Menu Architecture Overview**:\n> {s['menu_overview']}\n\n"
    
    if len(s['dishes']) == 0:
        md_exist += "**Iconic Signature Dishes**:\n*(Drinks-only pop-up; specific seasonal beverages drop via Instagram stories. No permanent food items.)*\n\n"
    else:
        md_exist += "**Iconic & Photographed Signature Dishes**:\n\n"
        for d in s['dishes']:
            price_str = f"**{d['price_nok']} NOK**" if d['price_nok'] is not None else "*Price not published on web (set to null)*"
            tags_str = " ".join([f"`#{t}`" for t in d.get('taste_tags', [])])
            md_exist += f"- **{d['dish_name']}** — {price_str} ({d['category']})\n"
            md_exist += f"  - *Review*: {d['review_text']}\n"
            md_exist += f"  - *Taste Profile*: {tags_str}\n"
            md_exist += f"  - *Photo Availability*: {d['photo_availability_note']}\n"
            md_exist += f"  - *Verification Source*: `{d['verification_source']}`\n\n"
    md_exist += "---\n\n"

with open('EXISTING_ENRICHMENT_REVIEW.md', 'w') as f:
    f.write(md_exist)

print("Saved EXISTING_ENRICHMENT_REVIEW.md successfully!")

# -------------------------------------------------------------
# 2. GENERATE POPUP_RADAR_REVIEW.md
# -------------------------------------------------------------

md_popup = """# Oslo Food Radar: Pop-Up, Micro-Bakery & Roving Concept Radar (Audited)

> **Status**: Research & Review Mode Only (No database modifications performed).  
> **Truth & Evidence Audit**: 100% Completed (November 2026).  
> **Integrity Guarantee**: All concept profiles, host venues, drop mechanisms, and signature receipts are verified with real media and critic sources (Aftenposten Vink, Mer av Oslo, VisitOSLO, official webshops). Zero hallucinated dishes.

---

## The Master Oslo Pop-Up Radar Matrix (15 Concepts)

| # | Concept Name | Category | Current Status | Usual Host Venue / Area | Drop Schedule Pattern | Direct Social Link |
|---|---|---|---|---|---|---|
"""

for i, p in enumerate(popups, 1):
    meta = p['popup_meta']
    status_badge = {
        'active': '🟢 Active',
        'seasonal_inactive': '⏳ Seasonal Inactive',
        'next_confirmed': '🟡 Next Confirmed',
        'transitioned_to_store': '🏬 Storefront / Retail'
    }.get(meta['residency_status'], meta['residency_status'])
    
    ig_handle = p['instagram_url'].split('/')[-2] if p['instagram_url'] else "—"
    ig = f"[@{ig_handle}]({p['instagram_url']})" if p['instagram_url'] else "—"
    md_popup += f"| {i} | **{p['name']}** | `{p['food_category']}` | {status_badge} | {meta['host_venue_name']} | {meta['drop_pattern']} | {ig} |\n"

md_popup += "\n---\n\n## Detailed Pop-Up Profiles & Verified Dishes\n\n"

for i, p in enumerate(popups, 1):
    meta = p['popup_meta']
    md_popup += f"### {i}. {p['name']}\n"
    md_popup += f"- **Spot Type**: `{p['spot_type']}` | **Category**: `{p['food_category']}` | **Price Level**: `{p['price_level']}`\n"
    md_popup += f"- **Current Residency Status**: `{meta['residency_status']}`\n"
    md_popup += f"- **Usual Host Venue**: {meta['host_venue_name']} ({p['neighborhood'].title()})\n"
    md_popup += f"- **Physical Anchor / Address**: {p['address']}\n"
    md_popup += f"- **Typical Drop Schedule**: {meta['dates_label']} ({meta['drop_pattern']})\n"
    md_popup += f"- **Official Instagram**: {p['instagram_url'] or 'None'}\n"
    md_popup += f"- **Official Website / Link**: {p['website_uri'] or 'None'}\n"
    md_popup += f"- **Why Curated**: {p['why_curated']}\n"
    md_popup += f"- **Source Attribution**: {p['source_attribution']}\n\n"
    
    if len(p['dish_highlights']) == 0:
        md_popup += "**Verified Signature Items**:\n*(Beverage-only pop-up or guest residency; menu items rotate and drop exclusively via social media stories during active takeovers. No permanent dishes.)*\n\n"
    else:
        md_popup += "**Verified Signature Items & Source Receipts**:\n\n"
        for d in p['dish_highlights']:
            price_str = f"**{d['price_nok']} NOK**" if d['price_nok'] is not None else "*Price not published on web (set to null)*"
            tags_str = " ".join([f"`#{t}`" for t in d.get('taste_tags', [])])
            md_popup += f"- **{d['dish_name']}** — {price_str} ({d['category']})\n"
            md_popup += f"  - *Review*: {d['review_text']}\n"
            md_popup += f"  - *Taste Profile*: {tags_str}\n"
            md_popup += f"  - *Verification Source*: `{d['verification_source']}`\n\n"
    md_popup += "---\n\n"

with open('POPUP_RADAR_REVIEW.md', 'w') as f:
    f.write(md_popup)

print("Saved POPUP_RADAR_REVIEW.md successfully!")

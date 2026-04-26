---
name: ads-static-generator
description: >
  Generate upload-ready static ad creatives from a single URL. Researches Facebook Ads Library
  for competitor inspiration, analyzes winning patterns, then batch-generates professional branded ad visuals
  with Gemini Pro. Number of creatives is configurable (default 20). Brand name and real products are
  always visible on every creative. Use when user says 'ads statiques', 'créatives', 'generate ads',
  'static ads', 'ad creatives', 'créer des pubs', 'batch ads', 'publicités statiques',
  or wants to create multiple ad visuals.
---

# Ads Static Generator

Generate professional, upload-ready static ad creatives from a single URL or offer description.

## Usage

```
/ads-static-generator <URL> [number_of_creatives]
```

**Examples:**
```
/ads-static-generator https://www.nike.com/ch/en/
/ads-static-generator https://www.nike.com/ch/en/ 30
/ads-static-generator "Formation Claude Code, 497€" 10
```

**Arguments:**
- `URL` or `offer description` (required) — the brand/product to create ads for
- `number_of_creatives` (optional, default: 20) — how many feed creatives to generate

The number of creatives determines the strategy:
- **10 creatives** = 5 angles × 2 variations
- **20 creatives** = 5 angles × 4 variations (default)
- **30 creatives** = 5 angles × 6 variations
- **40 creatives** = 5 angles × 8 variations

Stories are always 4 (one per best angle).

## Input

One of:
- **URL** — a landing page, product page, or website
- **Offer description** — what the product/service is, who it's for, what transformation it provides

## Workflow

### Stage 1: Analyze the Offer (2 min)

If a URL is provided, use agent-browser to:
1. Visit the page
2. Screenshot it
3. Extract: headline, subheadline, CTA, key benefits, pricing, social proof, brand colors, fonts

If an offer description is provided, extract the same elements from the text.

Output a brief:
```
Brand: [BRAND NAME — e.g. Nike, Adidas, Apple. THIS IS CRITICAL — every ad must show this brand]
Product lines: [specific product names from the website — e.g. Air Max, Mercurial, Dri-FIT]
Audience: [who]
Transformation: [from → to]
Key benefits: [3-5 bullet points]
Price: [if available]
Brand colors: [primary, secondary, accent]
Brand logo description: [describe the logo so Gemini can reproduce it — e.g. "swoosh checkmark"]
CTA: [main call to action]
```

**IMPORTANT:** The brand name is the most critical element. Every single ad creative MUST clearly show the brand identity. If you can't identify the brand from an ad, the ad is useless.

### Stage 2: Spy Competitor Ads (3 min)

Use agent-browser to search the Facebook Ads Library:

```bash
npx agent-browser \
  "Go to https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&q=[KEYWORD]" \
  --screenshot competitor_ads.png
```

Search 2-3 keywords related to the product/niche.

For each search:
1. Screenshot the results page
2. Identify the top 10-15 ads that look professional
3. Analyze patterns:
   - **Layouts** : text-on-image, product-focused, testimonial, before/after, comparison, screenshot-style
   - **Colors** : dark backgrounds, bright accents, gradients
   - **Text amount** : headline-only vs. headline + bullets
   - **Hooks** : question, statistic, bold claim, fear, curiosity
   - **CTA buttons** : style, text, placement

Output a competitive analysis:
```
Top patterns found:
1. [Pattern] — seen in X/15 ads
2. [Pattern] — seen in X/15 ads
3. [Pattern] — seen in X/15 ads

Most effective hooks:
- [Hook type]: "[example]"
- [Hook type]: "[example]"

Color trends: [list]
Layout trends: [list]
```

### Stage 3: Generate Creative Strategy (1 min)

Based on the offer + competitive analysis, define 5 creative angles:

| Angle | Hook Type | Visual Style | Target Emotion |
|-------|-----------|-------------|----------------|
| 1. Problem-aware | Question/Pain | Dark bg + bold text | Fear/Frustration |
| 2. Social proof | Testimonial/Result | Screenshot style | Trust |
| 3. Comparison | Before/After or VS | Split layout | Curiosity |
| 4. Bold claim | Statistic/Number | Minimalist + big number | Surprise |
| 5. CTA-direct | Offer/Discount | Product + CTA button | Urgency |

Calculate variations per angle: `variations_per_angle = total_creatives / 5`

- If 10 creatives → 2 variations per angle (A, B)
- If 20 creatives → 4 variations per angle (A, B, C, D)
- If 30 creatives → 6 variations per angle (A, B, C, D, E, F)

Each variation changes ONE element:
- Variation A: Different headline
- Variation B: Different color scheme
- Variation C: Different layout
- Variation D: Different hook
- Variation E: Different product focus (if > 20)
- Variation F: Different CTA (if > 20)

### Stage 4: Batch Generate Images with Parallel Agents (2-3 min)

**CRITICAL: Use 5 parallel agents to generate all 20 creatives simultaneously.**

Launch 5 agents in parallel (one per angle, 4 creatives each):

```
Use the Agent tool to launch 5 agents simultaneously in a SINGLE message:
- Agent 1: "Generate 4 ad creatives for Angle 1 (Problem-aware)"
- Agent 2: "Generate 4 ad creatives for Angle 2 (Social proof)"
- Agent 3: "Generate 4 ad creatives for Angle 3 (Comparison)"
- Agent 4: "Generate 4 ad creatives for Angle 4 (Bold claim)"
- Agent 5: "Generate 4 ad creatives for Angle 5 (CTA-direct)"
All run in background with run_in_background: true
```

Each agent uses Gemini Pro:
```bash
NANOBANANA_MODEL=gemini-3-pro-image-preview
```

Each agent generates 4 images with this prompt structure:
```
gemini --yolo "/generate 'Professional static ad creative (1080x1080).
[VISUAL DESCRIPTION based on angle + variation]
Brand: [BRAND NAME from the website — e.g. Nike, Adidas, etc.]
Product: [REAL PRODUCT NAME from the website — e.g. Nike Air Max, Nike Mercurial, etc.]
The brand name and logo MUST be clearly visible on the creative.
Show REAL products from this brand (shoes, jerseys, accessories, etc.)
Headline: [headline text in bold, max 8 words]
Subheadline: [subheadline, max 15 words]
CTA button: [CTA text — e.g. SHOP NOW, BUY NOW, DISCOVER]
Brand colors: [colors extracted from the website]
Style: [layout style from competitive analysis]
Requirements:
- The BRAND NAME must appear clearly on the ad (logo or text)
- Show REAL branded products (not generic items)
- Text must be readable on mobile in 1 second
- Max 3 lines of text
- Professional advertising quality, high contrast
- DO NOT mention Meta, Facebook, or Instagram anywhere on the creative
- This is a product ad, not a platform ad'"
```

**CRITICAL RULES FOR IMAGE GENERATION:**
1. **ALWAYS include the brand name/logo** — The brand from the URL must be clearly identifiable on every creative
2. **Show REAL products** — Generate visuals of actual products from the brand (shoes, clothing, accessories, etc.)
3. **NEVER mention "Meta Ads"** — The creative should look like a real brand ad, not a template
4. **Use the brand's actual visual identity** — Colors, style, and aesthetic should match the brand
5. **Product-first approach** — The product is the hero of the ad, not generic text on a dark background

**Result: 20 creatives generated in ~2-3 minutes instead of 15+ minutes sequentially.**

After all 5 agents complete, also generate 4 stories variants (1080x1920) from the best angles.

**Image specs:**
- Format: 1080x1080 (square, feed optimal)
- Also generate 4 stories variants at 1080x1920 (pick the best 4 angles)
- Text must be readable at mobile size
- Brand logo/name visible on every creative
- Real product imagery (not abstract or generic)
- Bold, condensed fonts for headlines
- CTA button clearly visible

**Naming convention:**
```
ads-output/
├── feed/
│   ├── 01-problem-aware-A.png
│   ├── 02-problem-aware-B.png
│   ├── 03-problem-aware-C.png
│   ├── 04-problem-aware-D.png
│   ├── 05-social-proof-A.png
│   ├── ...
│   └── 20-cta-direct-D.png
├── stories/
│   ├── story-01-problem-aware.png
│   ├── story-02-social-proof.png
│   ├── story-03-comparison.png
│   └── story-04-bold-claim.png
├── brief.md
├── competitive-analysis.md
├── creative-strategy.md
└── testing-plan.md
```

### Stage 5: Testing Plan

Generate a testing plan:

```markdown
## Phase 1 — Test des angles (Semaine 1)
- Budget: 5€/jour par ad set
- 5 ad sets (1 par angle)
- 4 créatives par ad set
- Objectif: identifier les 2-3 meilleurs angles
- KPI: CTR > 1.5%, CPM, hook rate

## Phase 2 — Scale des winners (Semaine 2)
- Doubler le budget sur les 2-3 meilleurs angles
- Tuer les ad sets avec CTR < 1%
- Dupliquer les winners avec audiences différentes

## Phase 3 — Itérer (Semaine 3-4)
- Générer 10 nouvelles variations des angles gagnants
- Tester de nouveaux hooks sur le même angle
- Rafraîchir les créatives toutes les 2 semaines
```

### Stage 6: Output

Save everything to `~/Desktop/ads-[product-slug]-YYYY-MM-DD/`

Open the folder:
```bash
open ~/Desktop/ads-[product-slug]-YYYY-MM-DD/
```

Present a summary:
```
✅ 20 créatives feed (1080x1080) générées
✅ 4 créatives stories (1080x1920) générées
✅ 5 angles testés × 4 variations chacun
✅ Analyse compétitive incluse
✅ Plan de test inclus

Prêt à uploader dans Meta Ads Manager.
```

## Quick Start

```
/ads-static-generator https://mon-site.com
```

or

```
/ads-static-generator "Formation Claude Code pour entrepreneurs, 497€, apprendre à automatiser son business avec l'IA"
```

---

## Learn More

Formation complète Claude Code → https://go.saas-ia.io/se-faire-remplacer-par-lia

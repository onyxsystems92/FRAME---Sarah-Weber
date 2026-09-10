# Raum & Zeit — Design Contract

## Decision

The current direction combines the best of two design families:

1. **Professional / Editorial**
   - premium but not luxury-coded
   - strong typographic hierarchy
   - generous whitespace
   - fine rules instead of card-shadow UI
   - clear multi-page navigation

2. **Botanical / Human**
   - Sarah’s green identity remains recognizable
   - warm paper tones instead of clinical white
   - organic geometry used sparingly
   - calm, personal and tactile rather than spa-like

The result is called **Editorial Green Practice** inside this repository.

## Brand principle

**Preserve → Refine → Reduce**

Do not import Franklyn’s own visual identity. Do not clone a reference site. Use Raum & Zeit’s existing green identity and hourglass / “Z” symbolism as source material.

## Visual foundation

```css
--paper: #f4f0e7;
--paper-2: #ebe5d9;
--ink: #18221d;
--forest: #21372f;
--forest-2: #2c473c;
--sage: #809787;
--sage-soft: #d9e1da;
--sand: #b5976d;
```

Green is the dominant identity color, but large areas alternate between warm paper and deep forest instead of saturating every section.

## Typography

Preview:
- Display: `Newsreader`
- Body: `Manrope`

Before production, prefer self-hosted font files or a privacy-reviewed delivery path.

Typography should communicate professional depth, not fashion/editorial affectation:
- large serif display hierarchy
- restrained weights
- readable 15–18px body
- compact uppercase metadata
- short line lengths for explanatory text

## Shape / composition

- max width around 1240px
- generous vertical rhythm
- asymmetric editorial splits
- hairline borders
- 14–22px radius only where useful
- minimal shadow
- organic line geometry only as a secondary device
- abstract hourglass rather than antique illustration
- “Z” may appear as a spatial / geometric cue

## Homepage role

The homepage is a **Navigation Home**, not a one-page brochure.

Primary routes:
1. How does Raum & Zeit work?
2. Which treatment contexts do they support?
3. Who will treat me?
4. How does a visit / appointment work?
5. I want to work at Raum & Zeit.

The visitor should be able to make one useful orientation decision without scrolling through the entire practice.

## Multi-page rule

Every subpage answers one concrete need:

- `Arbeitsweise`: positioning and therapeutic logic
- `Therapie`: understandable contexts first, methods deeper
- `Team`: people, continuity, professional depth
- `Praxisbesuch`: self-service orientation, contact, appointment
- `Karriere`: recruiting and employer context
- `Aktuelles`: only genuinely current practice information

Do not collapse this structure back into a one-pager.

## FRAME translation

FRAME logic is structural, not visible software branding:

`INPUT → RELEVANCE → STRUCTURE → DECISION`

On this website:
- INPUT = visitor intent
- RELEVANCE = select the right page / content layer
- STRUCTURE = concise information with progressive depth
- DECISION = appointment, call, learn more, apply, or no action

No chatbot, diagnosis, symptom triage, patient account, or clinical decision system.

## Copy rules

Prioritize:
- time
- functional relationships
- professional depth
- individual treatment
- personal continuity

Avoid using generic “ganzheitlich” as the primary differentiator.

Avoid:
- guarantees of healing
- unsupported outcome claims
- invented reviews
- invented current staff / openings / news
- language that implies automated medical advice

## Photography

Use real practice and team photography.

Direction:
- natural daylight
- quiet, observational
- rooms, hands, movement, conversation, real materials
- no exaggerated treatment poses
- no generic medical stock
- no wellness-spa imagery
- avoid overly polished corporate team grids

Until approved photography exists, geometric placeholders remain intentional.

## Motion / accessibility

- restrained 180–320ms transitions
- no scroll-jacking or parallax dependency
- full keyboard navigation
- visible focus behavior through native browser + high contrast
- semantic headings / details
- `prefers-reduced-motion` respected
- responsive at ~390 / 900 / 1440px

## Technical boundary

This design contract is independent from the eventual production framework.

Tilmann retains authority over hosting, security, Plesk deployment and technical continuity. Sarah retains content/professional truth and ordinary content autonomy. Franklyn owns positioning, information architecture, UX, visual direction and the Visibility Intelligence concept.

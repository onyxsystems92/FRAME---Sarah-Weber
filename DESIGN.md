# Raum & Zeit Design Contract

## Decision

The current direction combines two design families.

**Professional / Editorial** provides typographic hierarchy, generous space, fine rules and a mature multi page structure.

**Botanical / Human** preserves Sarah’s green identity, warm paper tones and a calm, personal character without drifting into spa aesthetics.

The repository calls the synthesis **Editorial Green Practice**.

## Brand principle

**Preserve → Refine → Reduce**

Do not import Franklyn’s visual identity and do not clone a reference site. Use Raum und Zeit’s existing green identity as the foundation.

The real Raum und Zeit logo in `assets/logo-raum-und-zeit.png` is a restrained accent. It should not dominate the composition. The first visible Navigation Home area remains green.

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

Use warm paper and green surfaces in a controlled rhythm. Avoid generic clinical white and avoid wellness styling.

## Typography

Preview display type: `Newsreader`

Preview body type: `Manrope`

Before production, use a privacy reviewed font delivery path.

Typography should communicate professional depth with restrained weights, readable body text and short explanatory line lengths.

## Homepage role

The homepage is the patient facing **FRAME Navigation Home**. It is not a one page brochure and it is not a normal menu restyled as questions.

The first visible screen must do two things at once:

1. establish Raum und Zeit briefly
2. ask for the visitor’s current state

Binding first choices:

1. Ich bin neu hier.
2. Ich bin bereits Patient:in.
3. Ich möchte eine Behandlung besser verstehen.
4. Ich möchte bei Raum und Zeit arbeiten.

Only after that choice should the interface reveal the relevant next routes. The visitor should not have to understand the site architecture before knowing where to go.

The classic navigation remains available for people who prefer direct browsing.

## FRAME translation

The structural model remains:

`INPUT → RELEVANCE → STRUCTURE → DECISION`

On this website:

- INPUT means visitor state
- RELEVANCE means the small set of next routes that match that state
- STRUCTURE means concise information on the relevant subpage with progressive depth
- DECISION means a useful next action such as understanding the practice, reaching appointment information, contacting the practice or exploring a role

Do not introduce a chatbot, symptom triage, diagnosis, patient account or clinical decision system.

## Navigation signals

The prototype prepares only bounded non clinical navigation signals.

- selected visitor state
- selected next route

The current implementation emits local browser events and may hold the first state in session storage. No external analytics service is active by default.

Any later analytics integration must preserve data minimization and must not collect symptoms, diagnoses, patient names or medical free text through the Navigation Home.

## Multi page rule

Every subpage answers one concrete need.

- `Arbeitsweise`: positioning and therapeutic logic
- `Therapie`: understandable contexts first, methods deeper
- `Team`: people, continuity and professional depth
- `Praxisbesuch`: self service orientation, contact and appointment
- `Karriere`: recruiting and employer context
- `Aktuelles`: only genuinely current practice information

Do not collapse this structure back into a one pager.

## Copy rules

Prioritize time, functional relationships, professional depth, individual treatment and personal continuity.

Do not use generic `ganzheitlich` as the primary differentiator.

Public copy uses natural German sentences. Avoid Gedankenstriche as a stylistic device and avoid artificial AI style hyphen constructions. Do not mechanically break correct URLs, technical syntax, established abbreviations or genuinely required compounds.

Avoid healing guarantees, unsupported outcome claims, invented reviews, invented current staff, invented openings, invented news and any wording that suggests automated medical advice.

## Photography

Use real practice and team photography when approved. Prefer natural daylight, rooms, movement, conversation and real materials. Avoid generic medical stock, exaggerated treatment poses, wellness imagery and overly polished corporate team grids.

Until approved photography exists, restrained geometric placeholders are intentional.

## Motion and accessibility

Use restrained transitions. No scroll jacking and no parallax dependency. Preserve keyboard navigation, visible focus, semantic headings, reduced motion support and responsive integrity at roughly 390, 900 and 1440 pixels.

## Technical boundary

This design contract is independent from the eventual production framework.

Tilmann retains authority over hosting, security, Plesk deployment and technical continuity. Sarah retains professional truth and ordinary content autonomy. Franklyn owns positioning, information architecture, visitor logic, UX, visual direction and the Visibility Intelligence concept.

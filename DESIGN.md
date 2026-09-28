# Raum & Zeit Design Contract

## Decision

The current direction combines two design families.

**Professional / Editorial** provides typographic hierarchy, generous space, fine rules and a mature multi page structure.

**Botanical / Human** preserves Sarah’s green identity, warm paper tones and a calm, personal character without drifting into spa aesthetics.

The repository calls the synthesis **Editorial Green Practice**.

## Brand principle

**Preserve → Refine → Reduce**

Do not import Franklyn’s visual identity and do not clone a reference site. Use Raum und Zeit’s existing green identity as the foundation.

The real Raum und Zeit logo in `assets/logo-raum-und-zeit.png` is a restrained accent. It should not dominate the composition. It appears in the site brand and may reappear selectively as an editorial accent, including the merged homepage section `Was uns prägt`.

The first homepage composition uses a white positioning field and a clearly contrasting green Navigation Home card. The green card is the primary interactive orientation surface.

The Navigation Home card uses a rectilinear editorial geometry with near square outer corners, fine borders and restrained shadow. Avoid soft capsule styling, large rounded app card geometry or a floating SaaS dashboard look. The visitor state rows inside the green surface are flat editorial rows separated by fine rules rather than separate rounded cards.

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

Use white, warm paper and green surfaces in a controlled rhythm. Avoid generic clinical coldness and avoid wellness styling.

## Typography

Preview display type: `Newsreader`

Preview body type: `Manrope`

Before production, use a privacy reviewed font delivery path.

Typography should communicate professional depth with restrained weights, readable body text and short explanatory line lengths.

## Homepage role

The homepage is the patient facing **FRAME Navigation Home**. It is not a one page brochure and it is not a normal menu restyled as questions.

The first visible screen must do two things at once:

1. establish Raum und Zeit briefly
2. ask for the visitor’s current state inside the green Navigation Home card

Binding first choices:

1. Ich bin neu hier.
2. Ich bin bereits Patient:in.
3. Ich möchte eine Behandlung besser verstehen.
4. Ich möchte bei Raum und Zeit arbeiten.

Each choice behaves like an inline accordion row. Its relevant next routes expand directly underneath that same row, not in a detached panel below the full choice list. Clicking the open choice again collapses it. Opening another choice closes the previous one. This interaction must remain visually obvious on desktop and mobile.

The accordion rows themselves stay visually flat and rectilinear. Hover, active and focus states may use subtle sage fill and a fine left inset accent, but should not reintroduce rounded mini cards inside the green Navigation Home surface.

Only after a visitor state is opened should the interface reveal the relevant next routes. The visitor should not have to understand the site architecture before knowing where to go.

The classic navigation remains available for people who prefer direct browsing.

The homepage must also make the multi page depth visually explicit. Immediately after Navigation Home, the previous `Was uns prägt` and `Verstehen, bevor behandelt wird.` sections are one combined section. The differentiators Zeit, funktionelles Kontextdenken, fachliche Tiefe and persönliche Kontinuität remain in the explanatory copy instead of appearing as passive cards.

That combined section exposes six full clickable page cards:

1. Arbeitsweise
2. Therapie
3. Team
4. Praxisbesuch
5. Karriere
6. Aktuelles

The whole card is the link. On pointer hover and keyboard focus the card turns green and keeps sufficient contrast. Clicking opens the corresponding real subpage. The six cards form a balanced three by two desktop composition, two columns on intermediate widths and one column on mobile. This section exists to make the site feel and behave like a genuine multi page practice website rather than a long one page presentation.

`Aktuelles` is a permanent sixth destination. Current notices themselves are conditional. If an active notice is explicitly marked for the homepage, a compact `Aktuelles` section appears between the multi page navigation and the therapy orientation. If there is no such notice, that section remains hidden so empty content does not create visual noise.

The treatment context preview remains below this page navigation and optional notice section and continues to route into deeper anchors on `therapie.html`.

## FRAME translation

The structural model remains:

`INPUT → RELEVANCE → STRUCTURE → DECISION`

On this website:

- INPUT means visitor state or an approved practice content change
- RELEVANCE means the small set of next routes or public information that matters now
- STRUCTURE means concise information on the relevant subpage or a bounded current notice
- DECISION means a useful next action or Sarah’s reviewed publication decision

Do not introduce a chatbot, symptom triage, diagnosis, patient account or clinical decision system.

## Navigation signals

The prototype prepares only bounded non clinical navigation signals.

- selected visitor state
- selected next route

The first selected visitor state and the currently open visitor state may be held in session storage for the current browser session. Closing the active accordion may clear the current state while preserving the original first state. No external analytics service is active by default.

Any later analytics integration must preserve data minimization and must not collect symptoms, diagnoses, patient names or medical free text through the Navigation Home.

## Aktuelles and content autonomy

Sarah must be able to maintain ordinary notices without needing a developer for each update.

The current prototype uses `content/aktuelles.json` as a small portable semantic content source. It is not a final CMS decision. `aktuelles.html` renders all active published items. The homepage renders only active items explicitly marked for homepage visibility and shows at most two.

Do not add fictional preview news. An empty content source is a valid state.

The future product direction is that authenticated FRAME may provide a bounded `Website / Aktuelles` editing surface that lets Sarah structure, preview and approve a notice. After approval, an adapter writes to the authoritative production website content source and FRAME re reads or syncs the resulting state.

FRAME must not become a second website state store. The final production content owner and write path remain subject to Tilmann’s Plesk compatible content maintenance decision. Do not build a generic CMS or authentication layer from this prototype alone.

See `CONTENT.md` for the bounded schema and responsibility contract.

## Multi page rule

Every subpage answers one concrete need.

- `Arbeitsweise`: positioning and therapeutic logic
- `Therapie`: understandable contexts first, methods deeper
- `Team`: people, continuity and professional depth
- `Praxisbesuch`: self service orientation, contact and appointment
- `Karriere`: recruiting and employer context
- `Aktuelles`: genuinely current practice information only

The homepage page cards must remain direct links to all six core subpages. They are navigation previews, not substitute content for those pages.

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

The inline visitor state accordions must expose their open state through accessible attributes and remain operable without moving focus away from the selected control unexpectedly.

The six homepage page cards must expose the same visual emphasis on keyboard focus that pointer users receive on hover.

Current notices must remain readable and useful without decorative motion. If notice data cannot be loaded, the homepage notice surface stays hidden and `aktuelles.html` retains its public empty state.

## Technical boundary

This design contract is independent from the eventual production framework.

Tilmann retains authority over hosting, security, Plesk deployment, the authoritative content storage path and technical continuity. Sarah retains professional truth and ordinary content autonomy. Franklyn owns positioning, information architecture, visitor logic, UX, visual direction and the Visibility Intelligence concept.

## Design Review V2 (isolated branch `feat/sarah-design-review-v2`)

This pass refines the Editorial Green Practice direction under the working
title **Human & Alive**. It preserves the brand identity, the accepted
Navigation Home experience, all URLs and the full multi page structure. It
changes composition, imagery, rhythm, states and motion. Nothing here has
been approved for the production website.

### Geometry

Surfaces are rectilinear. `--radius: 3px`, `--radius-sm: 2px`. Interactive
controls keep the full pill radius. This is a documented mixed rule:
**surfaces are near square, controls are pill**. The previous 22px card
radius produced the SaaS card look the contract already rejects for the
Navigation Home; the rest of the page now agrees with it.

### Section head forms

The eyebrow plus headline plus small explainer paragraph in a three column
grid was the single section head on every section of every page. It is
replaced by two forms that rotate by content type:

- **stacked** — headline, then a lede at a 66 character measure below it;
- **rule and index** — a hairline carrying a small label, headline below.

Eyebrows are reduced to surfaces that genuinely label themselves: the page
hero, Navigation Home, the merged `Was uns prägt` head and the CTA band.
They no longer sit above every mid page heading.

### Editorial compositions

Uniform card grids are kept only where the contract requires them. The six
homepage page cards remain a three by two grid of full clickable cards, now
as a hairline grid with the index and arrow on top and the title anchored to
the bottom. Elsewhere the repeated grids became distinct compositions: a
treatment context index with hairlines, a numbered step sequence, an
orientation definition list, a contact block with the telephone number as
display type, a method tag wall and an editorial team roster without card
chrome.

### Photography

`src/_data/images.yaml` defines nine practice image slots. Each has a fixed
aspect ratio, an `object-position` focal point, alt text and a note
describing what the photograph should show. An empty `src` renders a quiet
brand surface at exactly the same size, without any visible label, so a
later photograph replaces it without any layout change. The local editor
exposes these slots as **Praxisbilder**.

No stock photography, no generated practice imagery and no invented people.
The client preview currently fills the slots with photographs from the
earlier public practice website as provisional placeholders; their rights
and currency are unconfirmed and they are kept out of Git (public
repository) until Sarah confirms or replaces them.

### The Raum und Zeit mark

The hourglass, which is also the Z in Zeit, is drawn as a fine line SVG. It
appears as a low contrast watermark inside image placeholders, as a quiet
accent in the Navigation Home card and in the footer. It carries exactly one
motion moment, on `arbeitsweise.html`: when the section about treatment time
enters the viewport the sand flows once, ending mid flow rather than empty.
The logo itself is never animated.

### Motion budget

One authored moment, precise micro feedback, nothing else:

| Surface | Purpose | Motion |
| --- | --- | --- |
| Visitor state accordion | state indication | `grid-template-rows` 0fr to 1fr, 280ms, routes staggered 45ms |
| Treatment context disclosure | state indication | `grid-template-rows`, 280ms |
| Buttons, cards, rows | feedback | `scale(.975–.99)` on `:active`, 140ms |
| Page cards, links | feedback | colour and transform, 200ms, gated on `hover: hover` and `pointer: fine` |
| Section entrances | pacing | 12px rise plus opacity, 520ms, staggered 60ms, once |
| `arbeitsweise` time mark | explanation | sand flows once, 1500ms |

Deliberately not animated: page transitions and navigation, the header, the
logo, anything parallax or scroll driven that content depends on.

Easing tokens are `--ease-out: cubic-bezier(.23, 1, .32, 1)` and
`--ease-in-out: cubic-bezier(.77, 0, .175, 1)`. Only `transform`, `opacity`
and `grid-template-rows` are animated; the previous hover states animated
`padding`, which forces layout on every frame.

Scroll reveal is opt in. It is enabled only when JavaScript runs and the
visitor has not asked for reduced motion, it shows anything already on
screen immediately, and it has a failsafe plus a print rule. No content ever
depends on an animation having played.

### Colour and text

`--muted` moved to `#5a6460` and a new `--sage-ink: #456052` carries sage
toned text on light surfaces. The previous `--sage` at `#809787` was used as
a text colour at 2.8:1, which failed. Every rendered text node on all seven
pages now meets WCAG AA; `npm run contrast` proves it.

Browser surfaces are themed from the palette rather than left at their
defaults: text selection, the caret, the scrollbar, the focus ring and the
underline offset on the telephone link.

### Client preview pass (2026-09-28)

Franklyn's visual review fixed the page surfaces: **website white for
ordinary content, the established Raum und Zeit green for the header and
for emphasis sections, nothing else.** No beige, stone or pale sage section
backgrounds. Components take their colours from role tokens (`--ink`,
`--muted`, `--line`, `--link`, `--focus`), which the green scope redefines,
so a section turns green by class alone.

The rendered website carries no internal preview language: no preview
markers, no placeholder labels, no verification notes. Unresolved data is
omitted, not explained. `noindex,nofollow` stays in the metadata.

`→` marks internal routes, `↗` only external links. The six homepage page
cards carry no arrow; their green hover and focus state is the affordance.

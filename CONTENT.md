# Raum & Zeit Content Contract

## Purpose

Sarah must be able to maintain ordinary website content without becoming dependent on Franklyn or a developer for every small change. The first bounded content case is `Aktuelles`.

The prototype therefore defines one small semantic content contract without deciding the final production CMS, framework or storage layer.

## Current prototype source

`content/aktuelles.json`

This file is the current prototype source for published practice notices. It is intentionally small and portable.

Schema per item:

```json
{
  "id": "ferien-winter-2026",
  "status": "draft",
  "title": "Kurzer Titel",
  "text": "Kurzer Hinweis für Praxisbesucher.",
  "publishedAt": "2026-12-20",
  "expiresAt": "2027-01-05",
  "showOnHomepage": true
}
```

Rules:

- `id` is stable and unique.
- `status` is `draft` or `published`.
- `title` and `text` contain public practice information only.
- `publishedAt` uses `YYYY-MM-DD`. A future date keeps the item hidden until that date.
- `expiresAt` is optional. After that date the item is no longer rendered.
- `showOnHomepage` controls whether an active published item may appear in the compact homepage notice surface.
- The homepage shows at most two active items.
- `aktuelles.html` shows all active published items, newest first.
- Never put patient names, symptoms, diagnoses, treatment records or other health information into this content source.

The repository starts with an empty item list. Do not create fictional practice news for the preview.

## Website behavior

`Aktuelles` is a real sixth website destination alongside Arbeitsweise, Therapie, Team, Praxisbesuch and Karriere.

The homepage always exposes the `Aktuelles` page through the multi page navigation cards.

A compact homepage notice section is conditional. It remains hidden when no active item with `showOnHomepage: true` exists. When Sarah publishes a relevant item, the section appears without requiring a homepage redesign.

`aktuelles.html` has a calm public empty state when no active item exists.

## Future FRAME editing path

The intended product relationship is:

`Sarah input → FRAME structure and preview → Sarah review and approval → authoritative website content source → publish or deploy → FRAME syncs the resulting state`

FRAME is the authenticated inside view of the practice. The public website is the outside Navigation Layer. This makes website editing a legitimate future FRAME capability, but FRAME must not become a second website truth store.

A future Sarah facing surface may therefore expose a bounded `Website / Aktuelles` editor with exactly the fields above, preview the public result and let Sarah publish, unpublish or expire a notice after review.

The final write target remains open until Tilmann confirms the production content maintenance model. It may be a CMS, repository backed content collection or another Plesk compatible source. If the storage implementation changes, preserve the semantic content contract where useful rather than forcing the JSON file to remain the production database.

Do not build authentication, a generic CMS, a second deployment system or a broad website editor from this prototype alone.

## Responsibility

Sarah owns the professional truth of notices and ordinary content approval.

Franklyn owns experience, information architecture and Visibility Intelligence direction.

Tilmann owns production hosting, security, deployment continuity and the final technical content maintenance path.

FRAME may prepare, preview and coordinate content changes. The responsible human approves publication, and the production website content owner remains authoritative.

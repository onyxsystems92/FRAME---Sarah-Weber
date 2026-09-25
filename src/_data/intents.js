// The four binding Navigation Home visitor states and their curated next
// routes. Behavior contract (DESIGN.md / AGENTS.md): unchanged inline
// accordion rows, unchanged first choices, unchanged curated routes.
module.exports = [
  {
    key: "new",
    index: "01",
    label: "Ich bin neu hier.",
    panelTitle: "Für Ihren ersten Eindruck",
    routes: [
      { label: "Wie arbeitet Raum und Zeit?", href: "arbeitsweise.html", route: "working-method" },
      { label: "Welche Behandlungskontexte gibt es?", href: "therapie.html", route: "treatment-contexts" },
      { label: "Wer begleitet mich therapeutisch?", href: "team.html", route: "team" },
      { label: "Wie bereite ich meinen ersten Praxisbesuch vor?", href: "praxis.html#termin", route: "first-visit" },
    ],
  },
  {
    key: "existing",
    index: "02",
    label: "Ich bin bereits Patient:in.",
    panelTitle: "Direkt zu Ihrem Anliegen",
    routes: [
      { label: "Termin und Kontakt", href: "praxis.html#termin", route: "appointment-contact" },
      { label: "Praxisinformationen und Anfahrt", href: "praxis.html", route: "practice-info" },
      { label: "Aktuelle Hinweise aus der Praxis", href: "aktuelles.html", route: "updates" },
    ],
  },
  {
    key: "treatment",
    index: "03",
    label: "Ich möchte eine Behandlung besser verstehen.",
    panelTitle: "Fachlich orientieren",
    routes: [
      { label: "Behandlungskontexte ansehen", href: "therapie.html", route: "treatment-contexts" },
      { label: "Unsere Arbeitsweise verstehen", href: "arbeitsweise.html", route: "working-method" },
      { label: "Termin und Kontakt", href: "praxis.html#termin", route: "appointment-contact" },
    ],
  },
  {
    key: "career",
    index: "04",
    label: "Ich möchte bei Raum und Zeit arbeiten.",
    panelTitle: "Raum und Zeit als Arbeitsplatz",
    routes: [
      { label: "Arbeiten bei Raum und Zeit", href: "karriere.html", route: "career" },
      { label: "Das Team kennenlernen", href: "team.html", route: "team" },
      { label: "Praxis kontaktieren", href: "praxis.html#termin", route: "career-contact" },
    ],
  },
];

// The six core subpages. Single source for main nav, footer links and
// the homepage's six-card multi-page navigation grid — same destinations
// everywhere, defined once instead of duplicated per template.
module.exports = [
  {
    key: "arbeitsweise",
    href: "arbeitsweise.html",
    navLabel: "Arbeitsweise",
    num: "01",
    title: "Arbeitsweise",
    summary:
      "Wie wir Zusammenhänge verstehen und Therapie individuell strukturieren.",
    footerLabel: "Wie wir arbeiten",
    inNav: true,
  },
  {
    key: "therapie",
    href: "therapie.html",
    navLabel: "Therapie",
    num: "02",
    title: "Therapie",
    summary:
      "Behandlungskontexte verständlich einordnen und Methoden tiefer ansehen.",
    footerLabel: "Therapie & Behandlungskontexte",
    inNav: true,
  },
  {
    key: "team",
    href: "team.html",
    navLabel: "Team",
    num: "03",
    title: "Team",
    summary:
      "Menschen, therapeutische Haltung und fachliche Schwerpunkte kennenlernen.",
    footerLabel: "Team",
    inNav: true,
  },
  {
    key: "praxis",
    href: "praxis.html",
    navLabel: "Praxisbesuch",
    num: "04",
    title: "Praxisbesuch",
    summary:
      "Termin, Kontakt, Anfahrt und Informationen für den Besuch an einem Ort.",
    footerLabel: "Praxisbesuch & Termin",
    inNav: true,
  },
  {
    key: "karriere",
    href: "karriere.html",
    navLabel: "Karriere",
    num: "05",
    title: "Karriere",
    summary:
      "Erfahren, wie Arbeiten mit Zeit, Austausch und fachlicher Entwicklung aussieht.",
    footerLabel: "Karriere",
    inNav: true,
  },
  {
    key: "aktuelles",
    href: "aktuelles.html",
    navLabel: "Aktuelles",
    num: "06",
    title: "Aktuelles",
    summary: "Hinweise zu Praxisablauf, Erreichbarkeit und Veränderungen ansehen.",
    footerLabel: "Aktuelles",
    inNav: false,
  },
];

// The six core subpages. Single source for main nav, footer links and
// the homepage's six-card multi-page navigation grid — same destinations
// everywhere, defined once instead of duplicated per template. Structure
// only: the short card texts are editable in copy/home.yaml (destinations).
module.exports = [
  {
    key: "arbeitsweise",
    href: "arbeitsweise.html",
    navLabel: "Arbeitsweise",
    num: "01",
    title: "Arbeitsweise",
    footerLabel: "Wie wir arbeiten",
    inNav: true,
  },
  {
    key: "therapie",
    href: "therapie.html",
    navLabel: "Therapie",
    num: "02",
    title: "Therapie",
    footerLabel: "Therapie & Behandlungskontexte",
    inNav: true,
  },
  {
    key: "team",
    href: "team.html",
    navLabel: "Team",
    num: "03",
    title: "Team",
    footerLabel: "Team",
    inNav: true,
  },
  {
    key: "praxis",
    href: "praxis.html",
    navLabel: "Praxisbesuch",
    num: "04",
    title: "Praxisbesuch",
    footerLabel: "Praxisbesuch & Termin",
    inNav: true,
  },
  {
    key: "karriere",
    href: "karriere.html",
    navLabel: "Karriere",
    num: "05",
    title: "Karriere",
    footerLabel: "Karriere",
    inNav: true,
  },
  {
    key: "aktuelles",
    href: "aktuelles.html",
    navLabel: "Aktuelles",
    num: "06",
    title: "Aktuelles",
    footerLabel: "Aktuelles",
    inNav: false,
  },
];

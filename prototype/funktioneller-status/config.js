/* ==========================================================================
   Raum & Zeit · Funktioneller Status · zentrale Konfiguration
   --------------------------------------------------------------------------
   Diese Datei ist die EINZIGE Stelle für Inhalte des Prototyps:
   Feldnamen, Reihenfolge, Kategorien, Demo-Fall, Interventionstypen und
   Textbausteine. Die Oberfläche (app.js) liest nur von hier. Nach Sarahs
   Feedback wird in der Regel nur diese Datei geändert.

   Regeln
   - Reihenfolge in einer Liste = Reihenfolge in der Oberfläche.
   - Jede "id" ist ein technischer Schlüssel: kurz, ohne Leerzeichen,
     innerhalb ihrer Liste eindeutig. Labels dürfen frei geändert werden.
   - Verweise zwischen Einträgen laufen über ids (z. B. factorIds, source).
   - Nur synthetische Demo-Inhalte. Keine realen Patientendaten.
   ========================================================================== */

window.RZ_FUNKTIONELLER_STATUS = {

  /* --- Kopf und Rahmen ---------------------------------------------------- */
  meta: {
    practice: "Raum & Zeit",
    title: "Funktioneller Status",
    demoBadge: "Demo · synthetische Daten",
    caseLabel: "Demo-Fall A",
    caseSummary: "46 J. · Rückenbeschwerden, belastungsabhängig",
  },

  /* --- Ablauf ------------------------------------------------------------- */
  // Fünf Schritte. "title" ist die Überschrift im Arbeitsbereich,
  // "label" die Beschriftung im Ablauf oben.
  steps: [
    {
      id: "status",
      label: "Status erfassen",
      title: "Status erfassen",
      intro: "Die gewohnte Befundgrammatik. Jede Angabe bleibt frei formulierbar und kann jederzeit ergänzt werden.",
    },
    {
      id: "factors",
      label: "Relevante Faktoren",
      title: "Relevante Faktoren",
      intro: "Aus dem Status verdichtete Faktoren. Einordnen, ändern, entfernen oder ergänzen: nichts davon ist gesetzt.",
    },
    {
      id: "problem",
      label: "Funktionelles Problem",
      title: "Funktionelles Problem",
      intro: "Ein Entwurf, wie die Einzelbefunde zusammenhängen könnten. Er wird erst durch Bestätigung zur Arbeitshypothese.",
    },
    {
      id: "interventions",
      label: "Intervention",
      title: "Interventionskandidaten",
      intro: "Mögliche Ansätze mit Bezug zum funktionellen Problem. Kandidaten, keine Verordnung: übernommen wird nur, was bestätigt ist.",
    },
    {
      id: "documentation",
      label: "Dokumentation",
      title: "Dokumentation",
      intro: "Zusammenfassung aus dem bestätigten Stand. Der Text bleibt editierbar und kann kopiert oder als Textdatei gesichert werden.",
    },
  ],

  /* --- Schritt 1 · Status ------------------------------------------------- */
  // size: "short" = einzeilig wirkend, "long" = Fließtext.
  // Gruppen gliedern die Erfassung optisch; ihre Reihenfolge gilt.
  // columns: Spalten auf großen Bildschirmen (Standard 2).
  statusGroups: [
    { id: "zuweisung", label: "Zuweisung und Ausgangslage" },
    { id: "anamnese",  label: "Anamnese" },
    { id: "kontext",   label: "Lebenskontext", columns: 3 },
    { id: "einordnung", label: "Einordnung", note: "Diese beiden Felder führen direkt zu den relevanten Faktoren." },
  ],

  statusFields: [
    { id: "kondition",   group: "zuweisung", size: "short", label: "Kondition",
      hint: "Allgemeinzustand, Belastbarkeit" },
    { id: "diagnose",    group: "zuweisung", size: "short", label: "Diagnose / Überweisung",
      hint: "Laut Verordnung oder Zuweisung" },
    { id: "anamnese",    group: "anamnese",  size: "long",  label: "Anamnese",
      hint: "Beginn, Verlauf, Auslöser, Tagesrhythmus" },
    { id: "andereLeiden", group: "anamnese", size: "short", label: "Andere Leiden" },
    { id: "medikamente", group: "anamnese",  size: "short", label: "Medikamente" },
    { id: "beruf",       group: "kontext",   size: "short", label: "Beruf / Alltag" },
    { id: "sport",       group: "kontext",   size: "short", label: "Sport / Belastung" },
    { id: "therapie",    group: "kontext",   size: "short", label: "Bisherige Therapie" },
    { id: "unveraenderbar", group: "einordnung", size: "long", label: "Unveränderbare Größen",
      hint: "Kontext, der die Behandlung rahmt" },
    { id: "veraenderbar", group: "einordnung", size: "long", label: "Durch Therapie veränderbare Größen",
      hint: "Befunde, an denen die Therapie ansetzen kann" },
  ],

  /* --- Schritt 2 · Faktoren ----------------------------------------------- */
  factorCategories: [
    { id: "modifiable", label: "Therapeutisch veränderbar",
      short: "Veränderbar",
      description: "Hier kann die Therapie ansetzen." },
    { id: "context", label: "Unveränderbar / Kontext",
      short: "Kontext",
      description: "Rahmt die Behandlung, wird aber nicht behandelt." },
    { id: "open", label: "Noch offen",
      short: "Offen",
      description: "Nicht ausreichend geklärt. Nachfragen oder prüfen." },
  ],

  /* --- Schritt 3 · Funktionelles Problem ---------------------------------- */
  statementTypes: [
    { id: "observation", label: "Beobachtung",               plural: "Beobachtungen" },
    { id: "relation",    label: "Funktioneller Zusammenhang", plural: "Funktionelle Zusammenhänge" },
    { id: "question",    label: "Offene Frage",              plural: "Offene Fragen" },
  ],

  /* --- Schritt 4 · Interventionen ----------------------------------------- */
  interventionCategories: [
    { id: "mobilisation",   label: "Mobilisation" },
    { id: "zentrierung",    label: "Zentrierung" },
    { id: "stabilisation",  label: "Stabilisation" },
    { id: "sensomotorik",   label: "Sensomotorisches Training" },
    { id: "belastung",      label: "Belastungs- und Gangschulung" },
    { id: "weichteil",      label: "Weichteilbehandlung" },
    { id: "eigen",          label: "Eigenübungen / Selbstmanagement" },
  ],

  /* --- Synthetischer Demo-Fall -------------------------------------------- */
  // Eigens für die Demo formuliert. Kein realer Fall, keine reale Akte.
  demoCase: {
    status: {
      kondition: "Allgemein gut belastbar, sportlich aktiv. Beschwerden seit etwa vier Monaten, zuletzt häufiger.",
      diagnose: "Verordnung KG: Lumbalgie mit Ausstrahlung ins rechte Gesäß, keine neurologischen Defizite beschrieben.",
      anamnese: "Ziehender Schmerz im unteren Rücken rechts, nach längerem Sitzen und nach Läufen über 8 km. Morgens steif, nach etwa 20 Minuten Bewegung deutlich besser. Kein Trauma erinnerlich. Seit dem Einstieg in Intervalltraining vor sechs Wochen stärker. Laufschuhe im selben Zeitraum gewechselt.",
      andereLeiden: "Sprunggelenksdistorsion links vor mehreren Jahren, ausgeheilt.",
      medikamente: "Bei Bedarf Ibuprofen nach dem Laufen.",
      beruf: "Bürotätigkeit, überwiegend sitzend, rund acht Stunden täglich.",
      sport: "Laufen drei- bis viermal pro Woche, Vorbereitung auf einen Halbmarathon, Umfang zuletzt schnell gesteigert.",
      therapie: "Vor zwei Jahren sechs Einheiten KG bei ähnlichen Beschwerden, damals rasch gebessert.",
      unveraenderbar: "Sitzender Beruf in unveränderter Form. Zurückliegende Distorsion links. Wettkampftermin in zehn Wochen.",
      veraenderbar: "Hüftextension rechts endgradig eingeschränkt. Lumbopelvine Stabilisation unter Last reduziert. Hüftabduktoren rechts schwächer, Becken sinkt im Einbeinstand rechts auf der Gegenseite ab. Rotation der BWS eingeschränkt. Trainingsumfang.",
    },

    // source: aus welchem Statusfeld der Faktor stammt (id oder leer).
    factors: [
      { id: "f-hueftext", category: "modifiable", source: "veraenderbar",
        text: "Hüftextension rechts endgradig eingeschränkt" },
      { id: "f-stabil", category: "modifiable", source: "veraenderbar",
        text: "Lumbopelvine Stabilisation unter Last reduziert" },
      { id: "f-abduktion", category: "modifiable", source: "veraenderbar",
        text: "Hüftabduktoren rechts schwächer, Becken sinkt im Einbeinstand ab" },
      { id: "f-bws", category: "modifiable", source: "veraenderbar",
        text: "Rotation der BWS eingeschränkt" },
      { id: "f-umfang", category: "modifiable", source: "sport",
        text: "Trainingsumfang in kurzer Zeit gesteigert" },
      { id: "f-sitzen", category: "context", source: "beruf",
        text: "Überwiegend sitzender Arbeitstag, rund acht Stunden" },
      { id: "f-termin", category: "context", source: "unveraenderbar",
        text: "Wettkampftermin in zehn Wochen" },
      { id: "f-schuh", category: "open", source: "anamnese",
        text: "Einfluss des Laufschuhwechsels unklar" },
      { id: "f-regeneration", category: "open", source: "",
        text: "Regeneration zwischen den Einheiten nicht erfragt" },
    ],

    problem: {
      hypothesis: "Die Kombination aus eingeschränkter Hüftextension rechts, reduzierter lumbopelviner Stabilisation und schwächerer Hüftabduktion rechts könnte die Belastung beim Laufen und im Sitzen in den unteren Rücken rechts verlagern. Die rasche Steigerung des Trainingsumfangs wirkt dabei eher als Auslöser denn als Ursache.",
      statements: [
        { id: "s-1", type: "observation", factorIds: ["f-umfang", "f-sitzen"],
          text: "Beschwerden treten belastungsabhängig auf: nach langem Sitzen und nach längeren Läufen." },
        { id: "s-2", type: "observation", factorIds: ["f-abduktion"],
          text: "Im Einbeinstand rechts sinkt das Becken auf der Gegenseite ab." },
        { id: "s-3", type: "relation", factorIds: ["f-hueftext", "f-stabil"],
          text: "Fehlende Hüftextension rechts könnte in der Standbeinphase über vermehrte Extension der LWS ausgeglichen werden." },
        { id: "s-4", type: "relation", factorIds: ["f-bws"],
          text: "Die eingeschränkte Rotation der BWS könnte Rotationsarbeit beim Laufen zusätzlich in den lumbalen Bereich verschieben." },
        { id: "s-5", type: "question", factorIds: ["f-schuh"],
          text: "Welche Rolle spielt der Schuhwechsel vor sechs Wochen?" },
        { id: "s-6", type: "question", factorIds: ["f-regeneration"],
          text: "Reicht die Regeneration zwischen den Einheiten aus?" },
      ],
    },

    // Kandidaten. factorIds = Bezug zu Faktoren (für Begründung und Prüfung).
    interventions: [
      { id: "i-hueftmob", category: "mobilisation", factorIds: ["f-hueftext"],
        title: "Hüftextension rechts mobilisieren",
        rationale: "Setzt an der eingeschränkten Hüftextension an, die als möglicher Grund für die lumbale Ausweichbewegung gilt.",
        dosage: "" },
      { id: "i-lpstab", category: "stabilisation", factorIds: ["f-stabil"],
        title: "Lumbopelvine Stabilisation in Belastungspositionen",
        rationale: "Verbessert die Kontrolle des Beckens dort, wo die Beschwerden entstehen: im Stand und in der Laufbewegung.",
        dosage: "" },
      { id: "i-einbein", category: "sensomotorik", factorIds: ["f-abduktion", "f-stabil"],
        title: "Beckenkontrolle im Einbeinstand rechts",
        rationale: "Trainiert die Abduktoren funktionell und zielt direkt auf das beobachtete Absinken des Beckens.",
        dosage: "" },
      { id: "i-bwsrot", category: "mobilisation", factorIds: ["f-bws"],
        title: "Rotationsmobilisation der BWS",
        rationale: "Kann Rotationsarbeit aus dem lumbalen Bereich zurück in die BWS verlagern.",
        dosage: "" },
      { id: "i-laufumfang", category: "belastung", factorIds: ["f-umfang", "f-schuh", "f-termin"],
        title: "Laufumfang anpassen, Laufbild prüfen",
        rationale: "Nimmt den Auslöser vorübergehend zurück, ohne das Wettkampfziel aufzugeben. Klärt nebenbei die Frage zum Schuh.",
        dosage: "" },
      { id: "i-weichteil", category: "weichteil", factorIds: ["f-hueftext"],
        title: "Weichteilbehandlung Hüftbeuger rechts",
        rationale: "Kann die Mobilisation der Hüftextension vorbereiten und unterstützen.",
        dosage: "" },
      { id: "i-alltag", category: "eigen", factorIds: ["f-sitzen", "f-hueftext"],
        title: "Bewegungspausen im Arbeitstag und kurzes Heimprogramm",
        rationale: "Der Beruf bleibt sitzend. Kurze, feste Pausen und zwei Übungen für die Hüfte machen den Alltag zum Teil der Therapie.",
        dosage: "" },
    ],
  },

  /* --- Schritt 5 · Dokumentation ------------------------------------------ */
  // Überschriften und Formulierungen des erzeugten Textes.
  documentation: {
    title: "FUNKTIONELLER STATUS",
    headings: {
      status: "STATUS",
      factors: "RELEVANTE FAKTOREN",
      problem: "FUNKTIONELLES PROBLEM",
      plan: "THERAPEUTISCHER PLAN",
    },
    hypothesisConfirmed: "Arbeitshypothese (bestätigt)",
    hypothesisDraft: "Arbeitshypothese (Entwurf, noch nicht bestätigt)",
    rationaleLabel: "Begründung",
    dosageLabel: "Umfang",
    ownMarker: "eigene Ergänzung",
    emptyPlan: "Noch keine Intervention übernommen.",
    fileName: "funktioneller-status-demo.txt",
  },

  /* --- Oberflächentexte --------------------------------------------------- */
  text: {
    next: "Weiter",
    back: "Zurück",
    reset: "Demo zurücksetzen",
    resetConfirm: "Wirklich zurücksetzen?",
    resetDone: "Demo-Fall wiederhergestellt.",
    undo: "Rückgängig",
    edit: "Bearbeiten",
    save: "Speichern",
    cancel: "Abbrechen",
    remove: "Entfernen",
    fromStatus: "aus",
    statusChanged: "Status geändert · prüfen",
    ownEntry: "Ergänzt",
    addFactor: "Faktor ergänzen",
    addFactorPlaceholder: "Neuer Faktor",
    factorRemoved: "Faktor entfernt.",
    classify: "Einordnung",
    emptyCategory: "Noch nichts eingeordnet.",
    hypothesisLabel: "Arbeitshypothese",
    draft: "Entwurf",
    draftChanged: "Entwurf · nach Bestätigung geändert",
    confirmed: "Bestätigt",
    confirm: "Als Arbeitshypothese bestätigen",
    reopen: "Wieder als Entwurf bearbeiten",
    addStatement: "Ergänzen",
    addStatementPlaceholder: "Neuer Eintrag",
    statementRemoved: "Eintrag entfernt.",
    relatesTo: "Bezug",
    relationRemoved: "entfernt",
    relationShifted: "jetzt",
    accept: "Übernehmen",
    accepted: "Übernommen",
    withdraw: "Zurücknehmen",
    adjust: "Anpassen",
    adjusted: "angepasst",
    dosagePlaceholder: "Umfang, z. B. 2× pro Woche, 20 Minuten",
    rationaleField: "Begründung",
    titleField: "Titel",
    categoryField: "Kategorie",
    dosageField: "Umfang",
    interventionRemoved: "Vorschlag entfernt.",
    removedList: "Entfernte Vorschläge",
    restore: "Wiederherstellen",
    addOwn: "Eigene Intervention hinzufügen",
    ownTitlePlaceholder: "Was soll gemacht werden?",
    ownRationalePlaceholder: "Warum, mit Bezug zum funktionellen Problem",
    relatesPick: "Bezug zu Faktoren (optional)",
    planSummary: "Plan",
    undecided: "noch offen",
    copy: "Text kopieren",
    copied: "In die Zwischenablage kopiert.",
    download: "Als Textdatei sichern",
    regenerate: "Aus aktuellem Stand neu erzeugen",
    docManual: "Manuell bearbeitet. Änderungen in den Schritten werden nicht automatisch übernommen.",
    docStale: "Die Schritte wurden nach der manuellen Bearbeitung geändert.",
    docUndecided: "Vorschläge noch nicht entschieden",
    docUnconfirmed: "Das funktionelle Problem ist noch nicht bestätigt.",
    threadTitle: "Fallfaden",
    threadStatus: "Angaben",
    threadFactors: "veränderbar",
    threadOpen: "offen",
    threadPlan: "im Plan",
  },
};

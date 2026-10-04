/* ==========================================================================
   Raum & Zeit · Funktioneller Status · Oberfläche (V2)
   --------------------------------------------------------------------------
   Liest alle Inhalte aus config.js (window.RZ_FUNKTIONELLER_STATUS).
   Zustand nur im Arbeitsspeicher: kein Speichern im Browser, kein Netzwerk.
   Neu laden setzt die Demo zurück.

   Zwei Ansichten auf denselben Zustand:
   - Überblick: die ganze Fallogik auf einer Arbeitsfläche. Ein gewähltes
     Element zeigt, womit es zusammenhängt.
   - Detail: die fünf Bearbeitungsschritte (Status, Faktoren, Problem,
     Interventionen, Dokumentation).
   ========================================================================== */
(() => {
  "use strict";

  const C = window.RZ_FUNKTIONELLER_STATUS;
  const T = C.text;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Verbindungslinien nur, wenn die vier Bereiche nebeneinander stehen.
  const wideLayout = window.matchMedia("(min-width: 1180px)");

  /* --- Helfer --------------------------------------------------------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const byId = (list, id) => list.find((item) => item.id === id);
  const stepIndex = (id) => C.steps.findIndex((s) => s.id === id);
  let counter = 0;
  const newId = (prefix) => `${prefix}-neu-${++counter}`;

  // Elemente ausschließlich per DOM-API bauen: Eingaben landen immer als
  // Text im Dokument, nie als HTML.
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === "class") el.className = value;
        else if (key === "text") el.textContent = value;
        else if (key === "value") el.value = value;
        else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
        else el.setAttribute(key, value === true ? "" : String(value));
      }
    }
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      el.append(child.nodeType ? child : String(child));
    }
    return el;
  }

  const ICONS = {
    edit: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M13.6 3.6l2.8 2.8M4 16l.7-3.4L13.6 3.6l2.8 2.8-8.9 8.9L4 16z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    remove: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 4.5v11M4.5 10h11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 10h11.5M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M16 10H4.5M9 5.5L4.5 10 9 14.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    review: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10 6.8v3.6M10 12.9v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    overview: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3.5 4.5h4v11h-4zM9 4.5h7.5v5H9zM9 11h7.5v4.5H9z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  };
  function icon(name) {
    const span = h("span", { class: "icon" });
    span.innerHTML = ICONS[name]; // statische Zeichen, keine Eingaben
    return span;
  }

  function iconButton(name, label, key, onClick, extraClass = "") {
    return h("button", {
      type: "button", class: `icon-button ${extraClass}`.trim(),
      "aria-label": label, title: label, "data-key": key, onClick,
    }, icon(name));
  }

  /* --- Zustand -------------------------------------------------------- */

  let state;

  const sourcesOf = (f) => (Array.isArray(f.sources) ? f.sources : f.source ? [f.source] : []);

  function initialState() {
    const demo = clone(C.demoCase);
    const s = {
      view: "overview",
      step: 0,
      status: Object.fromEntries(C.statusFields.map((f) => [f.id, demo.status[f.id] ?? ""])),
      factors: demo.factors.map((f) => ({ ...f, sources: sourcesOf(f), origin: "suggested" })),
      problem: {
        hypothesis: demo.problem.hypothesis,
        statements: demo.problem.statements.map((st) => ({ ...st, factorIds: st.factorIds || [] })),
        confirmed: false,
        changedAfterConfirm: false,
        confirmedBasis: "",
      },
      interventions: demo.interventions.map((i) => ({
        ...i, factorIds: i.factorIds || [], dosage: i.dosage || "",
        state: "candidate", origin: "suggested", adjusted: false,
      })),
      doc: { text: "", manual: false, basis: "" },
      ui: {
        focus: null, returnFocus: null,
        editingFactor: null, addingFactor: null,
        editingStatement: null, addingStatement: null,
        adjusting: null, addingOwn: false, ownDraft: null,
      },
    };
    state = s;
    // Jede abgeleitete Aussage merkt sich, worauf sie beruht.
    s.factors.forEach(snapshotFactor);
    s.problem.statements.forEach(snapshotItem);
    s.interventions.forEach(snapshotItem);
    return s;
  }

  const statusTouched = (fieldId) =>
    (state.status[fieldId] || "") !== (C.demoCase.status[fieldId] ?? "");

  const filledStatus = () => C.statusFields.filter((f) => (state.status[f.id] || "").trim());
  const factorsIn = (categoryId) => state.factors.filter((f) => f.category === categoryId);
  const planned = () => state.interventions.filter((i) => i.state === "accepted");
  const undecided = () => state.interventions.filter((i) => i.state === "candidate");
  const removedInterventions = () => state.interventions.filter((i) => i.state === "removed");
  const liveInterventions = () => state.interventions.filter((i) => i.state !== "removed");
  const categoryLabel = (id) => (byId(C.interventionCategories, id) || { label: id }).label;
  const fieldLabel = (id) => (byId(C.statusFields, id) || { label: id }).label;

  /* --- Grundlagen und Prüfbedarf --------------------------------------
     Faktor:       beruht auf seinen Statusfeldern.
     Eintrag/Intervention: beruht auf ihren Faktoren (Text, Einordnung)
                   und deren Statusfeldern.
     Ändert sich eine Grundlage, wird nichts gelöscht oder umgeschrieben:
     das Element zeigt „Grundlage geändert · prüfen“, bis die Therapeutin
     es prüft, bearbeitet oder übernimmt. */

  function factorSig(fid) {
    const f = byId(state.factors, fid);
    if (!f) return null;
    return { text: f.text, category: f.category, status: Object.fromEntries(f.sources.map((sid) => [sid, state.status[sid] || ""])) };
  }

  function snapshotFactor(f) {
    f.basis = Object.fromEntries(f.sources.map((sid) => [sid, state.status[sid] || ""]));
  }

  function snapshotItem(item) {
    item.basis = Object.fromEntries(item.factorIds.map((fid) => [fid, factorSig(fid)]));
  }

  function factorReasons(f) {
    if (!f.basis) return [];
    return f.sources.filter((sid) => (state.status[sid] || "") !== f.basis[sid])
      .map((sid) => `${T.reasonStatus}: ${fieldLabel(sid)}`);
  }

  function itemReasons(item) {
    if (!item.basis) return [];
    const reasons = [];
    for (const fid of item.factorIds) {
      const was = item.basis[fid];
      const now = factorSig(fid);
      if (was === undefined) continue;
      const name = (now || was || {}).text || fid;
      if (!now && was) { reasons.push(`${T.reasonFactorRemoved}: ${name}`); continue; }
      if (!now || !was) continue;
      if (now.text !== was.text || now.category !== was.category) { reasons.push(`${T.reasonFactor}: ${name}`); continue; }
      const changed = Object.keys(now.status).filter((sid) => now.status[sid] !== was.status[sid]);
      if (changed.length) reasons.push(`${T.reasonStatus}: ${changed.map(fieldLabel).join(", ")}`);
    }
    return [...new Set(reasons)];
  }

  const reasonsFor = (kind, item) => (kind === "factor" ? factorReasons(item) : itemReasons(item));

  function factorsBasisKey() {
    return JSON.stringify(state.factors.map((f) => [f.id, factorSig(f.id)]));
  }

  // Bestätigt ist nur, was die Therapeutin in genau dieser Form gesehen hat.
  // Direkte Änderungen am Problem heben die Bestätigung auf; geänderte
  // Grundlagen lassen sie stehen, kennzeichnen sie aber sichtbar.
  const problemNeedsReview = () => state.problem.confirmed && state.problem.confirmedBasis !== factorsBasisKey();

  function problemChanged() {
    if (state.problem.confirmed) {
      state.problem.confirmed = false;
      state.problem.changedAfterConfirm = true;
      return true;
    }
    return false;
  }

  function confirmProblem() {
    const p = state.problem;
    p.confirmed = true;
    p.changedAfterConfirm = false;
    p.confirmedBasis = factorsBasisKey();
    p.statements.forEach(snapshotItem);
  }

  function reviewQueue() {
    const queue = [];
    state.factors.forEach((f) => { if (factorReasons(f).length) queue.push({ kind: "factor", id: f.id }); });
    if (problemNeedsReview()) queue.push({ kind: "problem", id: "hypothesis" });
    state.problem.statements.forEach((s) => { if (itemReasons(s).length) queue.push({ kind: "statement", id: s.id }); });
    liveInterventions().forEach((i) => { if (itemReasons(i).length) queue.push({ kind: "intervention", id: i.id }); });
    return queue;
  }

  function markReviewed(kind, item) {
    if (kind === "factor") snapshotFactor(item);
    else snapshotItem(item);
  }

  /* --- Zusammenhänge ---------------------------------------------------- */

  function itemOf(kind, id) {
    if (kind === "status") return byId(C.statusFields, id);
    if (kind === "factor") return byId(state.factors, id);
    if (kind === "statement") return byId(state.problem.statements, id);
    if (kind === "intervention") return byId(state.interventions, id);
    return null;
  }

  // Alles, was mit dem gewählten Element über Faktoren verbunden ist.
  function related(focus) {
    const out = { status: new Set(), factor: new Set(), statement: new Set(), intervention: new Set() };
    if (!focus) return out;
    const item = itemOf(focus.kind, focus.id);
    if (!item) return out;
    const exists = (fid) => byId(state.factors, fid);
    let factors = [];
    if (focus.kind === "status") factors = state.factors.filter((f) => f.sources.includes(focus.id)).map((f) => f.id);
    if (focus.kind === "factor") factors = [focus.id];
    if (focus.kind === "statement" || focus.kind === "intervention") factors = item.factorIds.filter(exists);
    factors.forEach((fid) => out.factor.add(fid));
    if (focus.kind === "status") out.status.add(focus.id);
    for (const fid of factors) exists(fid).sources.forEach((sid) => out.status.add(sid));
    for (const s of state.problem.statements) if (s.factorIds.some((fid) => out.factor.has(fid))) out.statement.add(s.id);
    for (const i of liveInterventions()) if (i.factorIds.some((fid) => out.factor.has(fid))) out.intervention.add(i.id);
    out[focus.kind].add(focus.id);
    return out;
  }

  // Linien nur zwischen benachbarten Bereichen: Status → Faktor → Eintrag →
  // Intervention. So bleibt jede Linie in ihrer Spalte und nichts kreuzt Text.
  function relationPairs(focus, rel) {
    const pairs = [];
    for (const fid of rel.factor) {
      const f = byId(state.factors, fid);
      for (const sid of f.sources) if (rel.status.has(sid)) pairs.push([`status:${sid}`, `factor:${fid}`]);
    }
    for (const sid of rel.statement) {
      const s = byId(state.problem.statements, sid);
      for (const fid of s.factorIds) if (rel.factor.has(fid)) pairs.push([`factor:${fid}`, `statement:${sid}`]);
    }
    if (focus.kind !== "status") {
      for (const sid of rel.statement) {
        const s = byId(state.problem.statements, sid);
        for (const iid of rel.intervention) {
          const i = byId(state.interventions, iid);
          if (s.factorIds.some((fid) => rel.factor.has(fid) && i.factorIds.includes(fid))) pairs.push([`statement:${sid}`, `intervention:${iid}`]);
        }
      }
    }
    return pairs;
  }

  function nodeTitle(kind, id) {
    const item = itemOf(kind, id);
    if (!item) return "";
    if (kind === "status") return item.label;
    if (kind === "intervention") return item.title;
    return item.text;
  }

  function relationSummary(focus) {
    if (!focus) return "";
    const rel = related(focus);
    const parts = [];
    for (const kind of ["status", "factor", "statement", "intervention"]) {
      const n = rel[kind].size - (kind === focus.kind ? 1 : 0);
      if (n > 0) parts.push(`${n} ${T.relCounts[kind][n === 1 ? 0 : 1]}`);
    }
    const title = nodeTitle(focus.kind, focus.id);
    return parts.length ? `${title}: ${T.connected} mit ${parts.join(", ")}.` : `${title}: ${T.noRelations}`;
  }

  /* --- Rendering ------------------------------------------------------ */

  const toastRegion = $("[data-toast-region]");
  let toastTimer = null;
  const flowEl = $("[data-flow]");
  const stageEl = $("#stage");
  const flowCaption = $("[data-flow-caption]");
  let lastView = null;
  let lastPreview = null;

  function render({ enter = false, focus = null } = {}) {
    // Fokus und Cursor über das Neuzeichnen hinweg halten.
    const active = document.activeElement;
    const activeKey = active && active.dataset ? active.dataset.key : null;
    const selection = active && "selectionStart" in active && typeof active.selectionStart === "number"
      ? [active.selectionStart, active.selectionEnd] : null;
    const sameView = lastView === viewKey();
    const before = sameView ? snapshotPositions() : null;

    if (!state.doc.manual) {
      state.doc.text = generateDocumentation();
      state.doc.basis = basisKey();
    }

    renderFlow();
    const flowNav = flowEl.closest(".flow");
    if (flowNav) flowNav.classList.toggle("is-overview", state.view === "overview");
    stageEl.replaceChildren(state.view === "overview" ? renderOverview() : renderStep());
    stageEl.querySelectorAll("textarea").forEach(autosize);
    lastView = viewKey();

    if (enter && !reduceMotion.matches) {
      stageEl.classList.remove("is-entering");
      void stageEl.offsetWidth;
      stageEl.classList.add("is-entering");
    }

    const target = focus ? document.querySelector(focus)
      : activeKey ? document.querySelector(`[data-key="${CSS.escape(activeKey)}"]`) : null;
    if (target) {
      target.focus({ preventScroll: !enter });
      if (!focus && selection && "setSelectionRange" in target) {
        try { target.setSelectionRange(selection[0], selection[1]); } catch (_) { /* nicht jedes Feld */ }
      }
    }

    if (before) playMoves(before);
    if (state.view === "overview") {
      applyFocus();
      markPreviewChanges();
    } else {
      lastPreview = null;
    }
  }

  const viewKey = () => (state.view === "overview" ? "overview" : `step-${state.step}`);

  // FLIP: Elemente, die durch eine Änderung ihren Platz wechseln (Einordnung,
  // Plan, Prüfstatus), gleiten an die neue Stelle statt zu springen.
  function snapshotPositions() {
    const map = new Map();
    stageEl.querySelectorAll("[data-flip]").forEach((el) => map.set(el.dataset.flip, el.getBoundingClientRect()));
    return map;
  }

  function playMoves(before) {
    if (reduceMotion.matches) return;
    stageEl.querySelectorAll("[data-flip]").forEach((el) => {
      const was = before.get(el.dataset.flip);
      if (!was) {
        el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
          { duration: 320, easing: "cubic-bezier(.23,1,.32,1)" });
        return;
      }
      const now = el.getBoundingClientRect();
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 360, easing: "cubic-bezier(.23,1,.32,1)" });
    });
  }

  // Ein Ansichtswechsel beendet offene Rückgängig-Angebote.
  function dismissToast() { clearTimeout(toastTimer); toastRegion.replaceChildren(); }

  function goTo(index, { focus = null } = {}) {
    if (index < 0 || index >= C.steps.length) return;
    dismissToast();
    state.view = "detail";
    state.step = index;
    if (C.steps[index].id === "documentation") prepareDocumentation();
    render({ enter: true, focus: focus || "#step-title" });
    if (focus) {
      const el = document.querySelector(focus);
      if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function goOverview() {
    dismissToast();
    const back = state.ui.returnFocus;
    state.view = "overview";
    state.ui.editingFactor = null; state.ui.addingFactor = null;
    state.ui.editingStatement = null; state.ui.addingStatement = null;
    state.ui.adjusting = null; state.ui.addingOwn = false;
    state.ui.focus = null;
    state.ui.returnFocus = null;
    let focus = "#overview-title";
    if (back?.kind === "status") {
      const signal = (C.overview.signals || []).find((s) => s.source === back.id);
      if (signal) focus = `[data-key="overview-signal-${signal.id}"]`;
    } else if (back?.kind === "problem" || back?.kind === "statement") {
      focus = '[data-key="overview-hypothesis-edit"]';
    } else if (back?.kind === "intervention") {
      focus = document.querySelector(`[data-key="overview-choice-${back.id}-detail"]`)
        ? `[data-key="overview-choice-${back.id}-detail"]` : '[data-key="overview-all-interventions"]';
    } else if (back?.kind === "factor") {
      focus = '[data-key="overview-details"]';
    }
    render({ enter: true, focus });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // Direkter Weg aus dem Überblick in den passenden Detail-Editor.
  function openDetail(kind, id) {
    state.ui.returnFocus = kind && id ? { kind, id } : state.ui.focus;
    if (kind === "status") return goTo(stepIndex("status"), { focus: `#field-${id}` });
    if (kind === "factor") { state.ui.editingFactor = id; return goTo(stepIndex("factors"), { focus: `[data-key="factor-${id}-input"]` }); }
    if (kind === "statement") { state.ui.editingStatement = id; return goTo(stepIndex("problem"), { focus: `[data-key="st-${id}-input"]` }); }
    if (kind === "intervention") { state.ui.adjusting = id; return goTo(stepIndex("interventions"), { focus: `#adjust-${id}-title` }); }
    if (kind === "own") {
      state.ui.addingOwn = true;
      state.ui.ownDraft = { category: C.interventionCategories[0].id, title: "", rationale: "", dosage: "", factorIds: [] };
      return goTo(stepIndex("interventions"), { focus: "#own-title" });
    }
    return goTo(stepIndex(kind));
  }

  // Der Ablauf oben: Überblick plus die fünf Detailschritte. Einmal gebaut
  // und danach nur aktualisiert, damit die Markenlinie sichtbar wandert.
  function renderFlow() {
    if (!flowEl.children.length) {
      const items = [{ id: "overview", label: C.overview.label, num: null }, ...C.steps.map((s, i) => ({ id: s.id, label: s.label, num: i + 1 }))];
      flowEl.append(...items.map((item) => h("li", { class: `flow__item${item.num ? "" : " flow__item--overview"}`, "data-flow-id": item.id },
        h("button", {
          type: "button", class: "flow__button", "data-key": `flow-${item.id}`,
          onClick: () => (item.num ? goTo(item.num - 1) : goOverview()),
        },
          item.num ? h("span", { class: "flow__num", "aria-hidden": "true" }, String(item.num).padStart(2, "0")) : icon("overview"),
          h("span", { class: "flow__text" },
            h("span", { class: "flow__label", text: item.label }),
            h("span", { class: "flow__badge", "data-flow-badge": item.id }))))));
    }
    const current = state.view === "overview" ? "overview" : C.steps[state.step].id;
    [...flowEl.children].forEach((li) => {
      const isCurrent = li.dataset.flowId === current;
      li.classList.toggle("is-current", isCurrent);
      const button = li.firstElementChild;
      if (isCurrent) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    refreshFlowValues();
    flowCaption.textContent = state.view === "overview"
      ? C.overview.label
      : `Schritt ${state.step + 1} von ${C.steps.length} · ${C.steps[state.step].label}`;
  }

  function refreshFlowValues() {
    const confirmed = flowEl.querySelector('[data-flow-badge="problem"]');
    if (confirmed) {
      // Sichtbar als Häkchen, für Screenreader als Wort.
      confirmed.replaceChildren(...(state.problem.confirmed ? [icon("check"), h("span", { class: "visually-hidden", text: T.confirmed })] : []));
      confirmed.classList.toggle("is-confirmed", state.problem.confirmed);
      confirmed.classList.toggle("is-review", problemNeedsReview());
    }
    const review = flowEl.querySelector('[data-flow-badge="overview"]');
    if (review) {
      const n = reviewQueue().length;
      review.textContent = n ? String(n) : "";
      review.classList.toggle("is-review", n > 0);
      review.title = n ? `${n} ${T.reviewCount}` : "";
    }
  }

  /* --- Überblick ---------------------------------------------------------- */

  function zoneHead(stepId, count) {
    const i = stepIndex(stepId);
    const step = C.steps[i];
    return h("header", { class: "zone__head" },
      h("span", { class: "zone__num", "aria-hidden": "true" }, String(i + 1).padStart(2, "0")),
      h("h3", { class: "zone__title", id: `zone-${stepId}` }, step.zone || step.label),
      count != null ? h("span", { class: "count", text: String(count) }) : null,
      h("button", {
        type: "button", class: "zone__open", "data-key": `open-${stepId}`,
        "aria-label": `${step.zone || step.label}: ${T.openDetail}`,
        onClick: () => openDetail(stepId),
      }, h("span", { text: T.openDetail }), icon("arrow")));
  }

  function renderOverview() {
    const queue = reviewQueue();
    const p = state.problem;
    const problemReview = problemNeedsReview();
    const preferred = (C.overview.interventionIds || [])
      .map((id) => byId(state.interventions, id))
      .filter((i) => i && i.state !== "removed");
    const acceptedExtra = planned().filter((i) => !preferred.some((p) => p.id === i.id));
    const visibleInterventions = [...acceptedExtra, ...preferred]
      .filter((item, index, all) => all.findIndex((x) => x.id === item.id) === index)
      .slice(0, C.overview.interventionLimit || 3);
    const remaining = state.interventions.filter((i) => i.state !== "removed" && !visibleInterventions.some((v) => v.id === i.id)).length;

    const openFirstReview = () => {
      const next = queue[0];
      if (!next) return;
      if (next.kind === "problem") return openDetail("problem");
      return openDetail(next.kind, next.id);
    };

    const hero = h("section", { class: "simple-hero", "aria-labelledby": "overview-title" },
      h("div", { class: "simple-hero__meta" },
        h("span", { text: C.meta.caseLabel })),
      h("h2", { class: "simple-hero__title display", id: "overview-title", tabindex: "-1", text: C.meta.caseSummary }),
      h("p", { class: "simple-hero__lead", text: C.overview.intro }),
      queue.length ? h("button", {
        type: "button", class: "simple-review", "data-key": "overview-review",
        onClick: openFirstReview,
      }, icon("review"), h("span", { text: `${queue.length} ${T.reviewCount}` })) : null);

    const signals = h("section", { class: "simple-block simple-signals", "aria-labelledby": "simple-signals-title" },
      h("div", { class: "simple-block__head" },
        h("div", null,
          h("p", { class: "simple-kicker", text: "01" }),
          h("h3", { class: "simple-block__title", id: "simple-signals-title", text: C.overview.signalsTitle })),
        h("p", { class: "simple-block__intro", text: C.overview.signalsIntro })),
      h("ul", { class: "simple-signal-list", role: "list" },
        (C.overview.signals || []).map((signal) => {
          const changed = signal.source ? statusTouched(signal.source) : false;
          return h("li", { class: "simple-signal" },
            h("button", {
              type: "button", class: "simple-signal__button", "data-key": `overview-signal-${signal.id}`,
              onClick: () => openDetail("status", signal.source),
            },
              h("span", { class: "simple-signal__label", text: signal.label }),
              h("span", { class: "simple-signal__text", text: signal.text }),
              changed ? h("span", { class: "simple-signal__changed", text: T.reasonStatus }) : null,
              icon("arrow")));
        })));

    const hypothesisStatus = problemReview ? T.confirmedReview : p.confirmed ? T.confirmed : p.changedAfterConfirm ? T.draftChanged : T.draft;
    const hypothesis = h("section", { class: `simple-block simple-hypothesis${problemReview ? " needs-review" : ""}`, "aria-labelledby": "simple-hypothesis-title" },
      h("div", { class: "simple-block__head" },
        h("div", null,
          h("p", { class: "simple-kicker", text: "02" }),
          h("h3", { class: "simple-block__title", id: "simple-hypothesis-title", text: C.overview.hypothesisTitle })),
        h("span", { class: `simple-state${p.confirmed && !problemReview ? " is-confirmed" : ""}${problemReview ? " is-review" : ""}` },
          p.confirmed && !problemReview ? icon("check") : problemReview ? icon("review") : null,
          h("span", { text: hypothesisStatus }))),
      h("p", { class: "simple-hypothesis__text", text: p.hypothesis === C.demoCase.problem.hypothesis ? C.overview.hypothesisPreview : firstSentence(p.hypothesis) }),
      h("p", { class: "simple-block__intro simple-hypothesis__intro", text: C.overview.hypothesisIntro }),
      h("div", { class: "simple-actions" },
        h("button", { type: "button", class: "button button--small button--ghost", "data-key": "overview-hypothesis-edit", onClick: () => openDetail("problem") }, C.overview.editLabel, icon("arrow")),
        p.confirmed && !problemReview
          ? null
          : h("button", {
            type: "button", class: "button button--small button--primary", "data-key": "overview-confirm",
            onClick: () => { confirmProblem(); render({ focus: '[data-key="overview-hypothesis-edit"]' }); },
          }, icon("check"), h("span", { text: problemReview ? T.reconfirm : T.confirm }))));

    const interventions = h("section", { class: "simple-block simple-next", "aria-labelledby": "simple-next-title" },
      h("div", { class: "simple-block__head" },
        h("div", null,
          h("p", { class: "simple-kicker", text: "03" }),
          h("h3", { class: "simple-block__title", id: "simple-next-title", text: C.overview.interventionsTitle })),
        h("p", { class: "simple-block__intro", text: C.overview.interventionsIntro })),
      h("ul", { class: "simple-choice-list", role: "list" }, visibleInterventions.map((i) => {
        const accepted = i.state === "accepted";
        const review = itemReasons(i).length > 0;
        return h("li", { class: `simple-choice${accepted ? " is-accepted" : ""}${review ? " needs-review" : ""}` },
          h("button", {
            type: "button", class: "simple-choice__toggle", "data-key": `overview-choice-${i.id}`,
            "aria-pressed": String(accepted), "aria-label": `${accepted ? T.withdraw : T.accept}: ${i.title}`,
            onClick: () => {
              i.state = accepted ? "candidate" : "accepted";
              if (!accepted) snapshotItem(i);
              render({ focus: `[data-key="overview-choice-${i.id}"]` });
            },
          }, icon("check")),
          h("button", {
            type: "button", class: "simple-choice__main", "data-key": `overview-choice-${i.id}-detail`,
            onClick: () => openDetail("intervention", i.id),
          },
            h("span", { class: "simple-choice__category", text: categoryLabel(i.category) }),
            h("span", { class: "simple-choice__title", text: i.title }),
            review ? h("span", { class: "simple-choice__review", text: T.basisChanged }) : null),
          icon("arrow"));
      })),
      h("button", { type: "button", class: "simple-more", "data-key": "overview-all-interventions", onClick: () => openDetail("interventions") },
        h("span", { text: remaining > 0 ? `${C.overview.moreLabel} · ${remaining} weitere` : C.overview.moreLabel }), icon("arrow")));

    const details = h("div", { class: "simple-footer" },
      h("p", { class: "simple-footer__note", text: C.overview.detailsHint }),
      h("button", { type: "button", class: "button button--primary simple-footer__button", "data-key": "overview-details", onClick: () => openDetail("status") },
        h("span", { text: C.overview.detailsLabel }), icon("arrow")));

    return h("div", { class: "simple-overview" }, hero, signals, hypothesis, interventions, details);
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function firstSentence(text) {
    const clean = (text || "").trim().replace(/\s+/g, " ");
    const match = clean.match(/^(.+?[.!?])(\s|$)/);
    return match ? match[1] : clean;
  }

  // Ein auswählbares Element im Überblick. Die Hauptfläche ist ein Button
  // (aria-pressed = gewählt); Aktionen erscheinen nur am gewählten Element.
  function node({ kind, id, label, text, classes = "", meta = null, aside = null, tools = null, reasons = [] }) {
    const isFocus = state.ui.focus && state.ui.focus.kind === kind && state.ui.focus.id === id;
    const reviewText = reasons.length ? reasons.join(" · ") : "";
    return h("li", {
      class: `node node--${kind}${classes ? ` ${classes}` : ""}${reasons.length ? " needs-review" : ""}${isFocus ? " is-focus" : ""}`,
      "data-node": `${kind}:${id}`, "data-flip": `${kind}:${id}`,
    },
      h("div", { class: "node__row" },
        h("button", {
          type: "button", class: "node__main", "data-key": `node-${kind}-${id}`,
          "aria-pressed": String(Boolean(isFocus)),
          onClick: () => setFocus(isFocus ? null : { kind, id }),
        },
          label ? h("span", { class: "node__label" }, label) : null,
          h("span", { class: "node__text", text }),
          reasons.length ? h("span", { class: "node__flag", title: reviewText }, icon("review"), h("span", { text: T.basisChanged })) : null,
          meta,
          h("span", { class: "visually-hidden node__sr", "data-sr-related": true })),
        aside),
      isFocus && tools ? h("div", { class: "node__tools" },
        reasons.length ? h("p", { class: "node__reason", text: reviewText }) : null,
        tools) : null);
  }

  function reviewButton(kind, item, key) {
    return h("button", {
      type: "button", class: "button button--small button--accept", "data-key": key,
      onClick: () => { markReviewed(kind, item); render(); },
    }, icon("check"), h("span", { text: T.markReviewed }));
  }

  function detailButton(kind, id) {
    return h("button", {
      type: "button", class: "button button--small button--ghost", "data-key": `node-${kind}-${id}-detail`,
      onClick: () => openDetail(kind, id),
    }, h("span", { text: kind === "intervention" ? T.adjust : T.edit }), icon("arrow"));
  }

  function zoneStatus() {
    const fields = C.statusFields.filter((f) => (f.overview || "signal") === "signal");
    return h("section", { class: "zone zone--status", "aria-labelledby": "zone-status" },
      zoneHead("status", fields.filter((f) => (state.status[f.id] || "").trim()).length),
      h("ul", { class: "nodes", role: "list" }, fields.map((f) => {
        const derived = state.factors.filter((fa) => fa.sources.includes(f.id)).length;
        const value = (state.status[f.id] || "").trim();
        return node({
          kind: "status", id: f.id,
          label: [f.label, statusTouched(f.id) ? h("span", { class: "node__changed", text: " · geändert" }) : null],
          text: value ? (isFocused("status", f.id) ? value : firstSentence(value)) : "–",
          classes: `${statusTouched(f.id) ? "is-touched" : ""}${value ? "" : " is-empty"}`,
          meta: derived ? h("span", { class: "node__links", "aria-hidden": "true", text: `→ ${derived}` }) : null,
          tools: [detailButton("status", f.id)],
        });
      })));
  }

  const isFocused = (kind, id) => state.ui.focus && state.ui.focus.kind === kind && state.ui.focus.id === id;

  function zoneFactors() {
    return h("section", { class: "zone zone--factors", "aria-labelledby": "zone-factors" },
      zoneHead("factors", state.factors.length),
      C.factorCategories.map((cat) => {
        const items = factorsIn(cat.id);
        return h("div", { class: `fgroup fgroup--${cat.id}` },
          h("p", { class: "fgroup__title" }, h("span", { text: cat.label }), h("span", { class: "fgroup__count", text: String(items.length) })),
          items.length ? h("ul", { class: "nodes", role: "list" }, items.map((f) => node({
            kind: "factor", id: f.id, text: f.text,
            classes: f.origin === "own" ? "is-own" : "",
            reasons: factorReasons(f),
            tools: [
              h("div", { class: "segmented", role: "group", "aria-label": `${T.classify}: ${f.text}` },
                C.factorCategories.map((c) => h("button", {
                  type: "button", class: "segmented__option", "aria-pressed": String(c.id === f.category),
                  "data-key": `ov-factor-${f.id}-cat-${c.id}`, text: c.short,
                  onClick: () => {
                    if (c.id === f.category) return;
                    f.category = c.id;
                    render({ focus: `[data-key="ov-factor-${f.id}-cat-${c.id}"]` });
                  },
                }))),
              h("div", { class: "node__actions" },
                factorReasons(f).length ? reviewButton("factor", f, `ov-review-factor-${f.id}`) : null,
                detailButton("factor", f.id),
                h("button", {
                  type: "button", class: "button button--small button--quiet", "data-key": `ov-factor-${f.id}-remove`, text: T.remove,
                  onClick: () => removeFactor(f, { overview: true }),
                })),
            ],
          }))) : h("p", { class: "empty", text: T.emptyCategory }));
      }));
  }

  function zoneProblem() {
    const p = state.problem;
    const review = problemNeedsReview();
    const pillText = review ? T.confirmedReview : p.confirmed ? T.confirmed : p.changedAfterConfirm ? T.draftChanged : T.draft;
    return h("section", { class: `zone zone--problem${p.confirmed ? " is-confirmed" : ""}${review ? " needs-review" : ""}`, "aria-labelledby": "zone-problem" },
      zoneHead("problem"),
      h("div", { class: "synth", "data-flip": "synth" },
        h("div", { class: "synth__head" },
          h("label", { for: "ov-hypothesis", class: "synth__label", text: T.hypothesisLabel }),
          h("span", { class: `pill${review ? " pill--review" : p.confirmed ? " pill--confirmed" : ""}` },
            review ? icon("review") : p.confirmed ? icon("check") : null, h("span", { text: pillText }))),
        h("textarea", {
          id: "ov-hypothesis", class: "synth__input", rows: 3, "data-key": "ov-hypothesis", value: p.hypothesis,
          onInput: (e) => {
            p.hypothesis = e.target.value;
            autosize(e.target);
            if (problemChanged()) render();
            else refreshLive();
          },
        }),
        h("div", { class: "synth__foot" },
          p.confirmed && !review
            ? h("button", {
              type: "button", class: "button button--small button--quiet", "data-key": "ov-reopen", text: T.reopen,
              onClick: () => { p.confirmed = false; p.changedAfterConfirm = false; render({ focus: "#ov-hypothesis" }); },
            })
            : h("button", {
              type: "button", class: "button button--small button--primary", "data-key": "ov-confirm",
              onClick: () => { confirmProblem(); render({ focus: '[data-key="ov-reopen"]' }); pulse(".synth"); },
            }, icon("check"), h("span", { text: review ? T.reconfirm : T.confirm })))),
      C.statementTypes.map((type) => {
        const items = p.statements.filter((s) => s.type === type.id);
        if (!items.length) return null;
        return h("div", { class: `sgroup sgroup--${type.id}` },
          h("p", { class: "sgroup__title", text: type.plural }),
          h("ul", { class: "nodes", role: "list" }, items.map((s) => node({
            kind: "statement", id: s.id, text: s.text, reasons: itemReasons(s),
            tools: [h("div", { class: "node__actions" },
              itemReasons(s).length ? reviewButton("statement", s, `ov-review-statement-${s.id}`) : null,
              detailButton("statement", s.id))],
          }))));
      }));
  }

  function zonePlan() {
    const accepted = planned();
    const open = undecided();
    const removed = removedInterventions();
    const row = (i) => {
      const isAccepted = i.state === "accepted";
      const markers = [i.origin === "own" ? C.documentation.ownMarker : null, i.adjusted ? T.adjusted : null].filter(Boolean);
      return node({
        kind: "intervention", id: i.id, text: i.title,
        label: [categoryLabel(i.category), markers.length ? h("span", { class: "node__marker", text: ` · ${markers.join(" · ")}` }) : null],
        classes: `${isAccepted ? "is-accepted" : ""}${i.origin === "own" ? " is-own" : ""}`,
        reasons: itemReasons(i),
        meta: i.dosage ? h("span", { class: "node__dosage", text: i.dosage }) : null,
        aside: h("button", {
          type: "button", class: `plan-toggle${isAccepted ? " is-on" : ""}`, "data-key": `ov-i-${i.id}-accept`,
          "aria-pressed": String(isAccepted), "aria-label": `${isAccepted ? T.accepted : T.accept}: ${i.title}`,
          title: isAccepted ? T.withdraw : T.accept,
          onClick: () => {
            i.state = isAccepted ? "candidate" : "accepted";
            if (!isAccepted) snapshotItem(i);
            render({ focus: `[data-key="ov-i-${i.id}-accept"]` });
          },
        }, icon("check")),
        tools: [h("div", { class: "node__actions" },
          itemReasons(i).length ? reviewButton("intervention", i, `ov-review-intervention-${i.id}`) : null,
          detailButton("intervention", i.id),
          h("button", {
            type: "button", class: "button button--small button--quiet", "data-key": `ov-i-${i.id}-remove`, text: T.remove,
            onClick: () => removeIntervention(i, { overview: true }),
          }))],
      });
    };
    return h("section", { class: "zone zone--plan", "aria-labelledby": "zone-interventions" },
      zoneHead("interventions", accepted.length),
      h("div", { class: "pgroup pgroup--accepted" },
        h("p", { class: "pgroup__title" },
          h("span", { text: T.inPlan }), h("span", { class: "fgroup__count", text: String(accepted.length) }),
          accepted.length ? null : h("span", { class: "pgroup__empty", text: C.documentation.emptyPlan })),
        accepted.length ? h("ul", { class: "nodes", role: "list" }, accepted.map(row)) : null),
      h("div", { class: "pgroup" },
        h("p", { class: "pgroup__title" },
          h("span", { text: T.candidates }), h("span", { class: "fgroup__count", text: String(open.length) }),
          h("span", { class: "pgroup__tools" },
            removed.length ? h("button", {
              type: "button", class: "text-button text-button--muted", "data-key": "ov-removed",
              onClick: () => openDetail("interventions"), text: `${removed.length} ${T.removedShort}`,
            }) : null,
            h("button", {
              type: "button", class: "text-button", "data-key": "ov-add-own", "aria-label": T.addOwn,
              onClick: () => openDetail("own"),
            }, icon("plus"), h("span", { text: T.ownShort })))),
        open.length ? h("ul", { class: "nodes", role: "list" }, open.map(row)) : null));
  }

  function docPreviewLines() {
    const D = C.documentation;
    const lines = state.doc.text.split("\n");
    const start = lines.findIndex((l) => l.trim() === D.headings.problem);
    const picked = [];
    const from = start === -1 ? 0 : start;
    let inPlan = false;
    for (let n = from; n < lines.length; n++) {
      const line = lines[n];
      if (!line.trim()) continue;
      if (line.trim() === D.headings.plan) inPlan = true;
      // Kurzfassung: Problemkopf, Hypothese, dann der Plan ohne Begründungen.
      if (!inPlan && n > from + 2) continue;
      if (inPlan && /^\s{2,}/.test(line)) continue;
      picked.push(line.trim());
    }
    return picked.slice(0, C.overview.docPreviewLines || 9);
  }

  function zoneDocumentation() {
    const stale = state.doc.manual && state.doc.basis !== basisKey();
    const stateText = stale ? T.docOutdated : state.doc.manual ? T.docEdited : T.docLive;
    const headings = new Set(Object.values(C.documentation.headings));
    return h("section", { class: `zone zone--doc${stale ? " needs-review" : ""}`, "aria-labelledby": "zone-documentation" },
      zoneHead("documentation"),
      h("p", { class: `docstate${stale ? " docstate--stale" : ""}`, "data-docstate": true }, stale ? icon("review") : h("span", { class: "docstate__dot", "aria-hidden": "true" }), h("span", { text: stateText })),
      h("div", { class: "docprev", "data-docprev": true },
        docPreviewLines().map((line) => h("p", { class: `docprev__line${headings.has(line) ? " is-heading" : ""}`, "data-line": line, text: line }))),
      h("div", { class: "docprev__actions" },
        h("button", { type: "button", class: "button button--small button--ghost", "data-key": "ov-doc-open", onClick: () => openDetail("documentation") },
          h("span", { text: T.docOpen }), icon("arrow")),
        h("button", { type: "button", class: "button button--small button--quiet", "data-key": "ov-doc-copy", onClick: copyDocumentation, text: T.copy })));
  }

  // Die Vorschau zeigt, welche Zeilen sich durch die letzte Handlung geändert
  // haben: die Dokumentation entsteht sichtbar aus dem aktuellen Stand.
  function markPreviewChanges() {
    const lines = [...stageEl.querySelectorAll("[data-docprev] .docprev__line")];
    const previous = lastPreview;
    lastPreview = new Set(lines.map((l) => l.dataset.line));
    if (!previous) return;
    for (const line of lines) {
      if (!previous.has(line.dataset.line)) {
        line.classList.add("is-new");
        if (!reduceMotion.matches) line.animate([{ backgroundColor: "rgba(76,197,131,.28)" }, { backgroundColor: "rgba(76,197,131,0)" }], { duration: 1400, easing: "ease-out" });
      }
    }
  }

  // Für Eingaben ohne Neuzeichnen (Hypothese tippen): nur Zähler, Vorschau
  // und Prüfstatus nachziehen.
  function refreshLive() {
    if (!state.doc.manual) { state.doc.text = generateDocumentation(); state.doc.basis = basisKey(); }
    refreshFlowValues();
    const prev = stageEl.querySelector("[data-docprev]");
    if (prev) {
      const headings = new Set(Object.values(C.documentation.headings));
      prev.replaceChildren(...docPreviewLines().map((line) => h("p", { class: `docprev__line${headings.has(line) ? " is-heading" : ""}`, "data-line": line, text: line })));
      lastPreview = new Set(docPreviewLines());
    }
  }

  /* --- Fokus und Zusammenhänge im Überblick ----------------------------- */

  function setFocus(focus) {
    state.ui.focus = focus;
    render({ focus: focus ? `[data-key="node-${focus.kind}-${focus.id}"]` : null });
  }

  function focusNextReview() {
    const queue = reviewQueue();
    if (!queue.length) return;
    const current = state.ui.focus;
    const at = current ? queue.findIndex((q) => q.kind === current.kind && q.id === current.id) : -1;
    const next = queue[(at + 1) % queue.length];
    if (next.kind === "problem") {
      state.ui.focus = null;
      render({ focus: "#ov-hypothesis" });
      $("#ov-hypothesis").scrollIntoView({ block: "center" });
      return;
    }
    state.ui.focus = { kind: next.kind, id: next.id };
    render({ focus: `[data-key="node-${next.kind}-${next.id}"]` });
    const el = document.querySelector(`[data-key="node-${next.kind}-${next.id}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  function applyFocus() {
    const surface = stageEl.querySelector("[data-surface]");
    if (!surface) return;
    const focus = state.ui.focus && itemOf(state.ui.focus.kind, state.ui.focus.id) ? state.ui.focus : null;
    if (!focus) state.ui.focus = null;
    const rel = related(focus);
    surface.querySelectorAll("[data-node]").forEach((el) => {
      const [kind, id] = el.dataset.node.split(":");
      const isRelated = Boolean(focus) && rel[kind] && rel[kind].has(id) && !(kind === focus.kind && id === focus.id);
      el.classList.toggle("is-related", isRelated);
      const sr = el.querySelector("[data-sr-related]");
      if (sr) sr.textContent = isRelated ? ` (${T.connected})` : "";
    });
    drawRelations(surface, focus, rel);
  }

  function drawRelations(surface, focus, rel) {
    const svg = surface.querySelector(".relations");
    svg.replaceChildren();
    if (!focus || !wideLayout.matches) return;
    const box = surface.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const defs = svgEl("defs");
    const grad = svgEl("linearGradient", { id: "rel-grad", x1: "0", x2: "1", y1: "0", y2: "0" });
    grad.append(svgEl("stop", { offset: "0", "stop-color": "#17c6bd" }), svgEl("stop", { offset: "1", "stop-color": "#4cc583" }));
    defs.append(grad);
    svg.append(defs);
    const anchor = (key) => {
      const el = surface.querySelector(`[data-node="${CSS.escape(key)}"] .node__row`);
      return el ? el.getBoundingClientRect() : null;
    };
    for (const [a, b] of relationPairs(focus, rel)) {
      const ra = anchor(a);
      const rb = anchor(b);
      if (!ra || !rb) continue;
      const x1 = ra.right - box.left;
      const y1 = ra.top - box.top + Math.min(ra.height / 2, 20);
      const x2 = rb.left - box.left;
      const y2 = rb.top - box.top + Math.min(rb.height / 2, 20);
      if (x2 <= x1) continue;
      const mid = (x2 - x1) / 2;
      const path = svgEl("path", { d: `M${x1},${y1} C${x1 + mid},${y1} ${x2 - mid},${y2} ${x2},${y2}`, class: "relations__line", stroke: "url(#rel-grad)" });
      svg.append(path,
        svgEl("circle", { cx: x1, cy: y1, r: 2.6, class: "relations__dot" }),
        svgEl("circle", { cx: x2, cy: y2, r: 2.6, class: "relations__dot" }));
      if (!reduceMotion.matches) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { duration: 420, easing: "cubic-bezier(.23,1,.32,1)" });
      }
    }
  }

  let redrawFrame = 0;
  function scheduleRedraw() {
    cancelAnimationFrame(redrawFrame);
    redrawFrame = requestAnimationFrame(() => {
      stageEl.querySelectorAll("textarea").forEach(autosize);
      if (state.view === "overview") {
        const surface = stageEl.querySelector("[data-surface]");
        if (surface) drawRelations(surface, state.ui.focus, related(state.ui.focus));
      }
    });
  }

  /* --- Detailansicht -------------------------------------------------- */

  function renderStep() {
    const id = C.steps[state.step].id;
    const body = {
      status: renderStatus,
      factors: renderFactors,
      problem: renderProblem,
      interventions: renderInterventions,
      documentation: renderDocumentation,
    }[id]();
    return h("div", { class: `step step--${id}` }, stepHead(), body, stepNav());
  }

  function stepHead() {
    const step = C.steps[state.step];
    const queue = reviewQueue().length;
    return h("header", { class: "step-head" },
      h("button", { type: "button", class: "back-link", "data-key": "nav-overview", onClick: goOverview },
        icon("back"), h("span", { text: T.backToOverview }),
        queue ? h("span", { class: "back-link__review", text: `${queue} ${T.reviewCount}` }) : null),
      h("p", { class: "eyebrow" },
        h("span", { text: `Schritt ${state.step + 1} von ${C.steps.length}` }),
        h("span", { class: "eyebrow__case", text: `${C.meta.caseLabel} · ${C.meta.caseSummary}` })),
      h("h2", { class: "step-title display", id: "step-title", tabindex: "-1", text: step.title }),
      h("p", { class: "step-intro", text: step.intro }));
  }

  function stepNav() {
    const prev = C.steps[state.step - 1];
    const next = C.steps[state.step + 1];
    return h("nav", { class: "step-nav", "aria-label": "Schritte" },
      prev
        ? h("button", { type: "button", class: "button button--ghost", "data-key": "nav-back", onClick: () => goTo(state.step - 1) },
          icon("back"), h("span", { text: `${T.back}` }))
        : h("button", { type: "button", class: "button button--ghost", "data-key": "nav-back", onClick: goOverview },
          icon("back"), h("span", { text: T.backToOverview })),
      next
        ? h("button", { type: "button", class: "button button--primary", "data-key": "nav-next", onClick: () => goTo(state.step + 1) },
          h("span", { text: `${T.next}: ${next.label}` }), icon("arrow"))
        : h("button", { type: "button", class: "button button--primary", "data-key": "nav-next", onClick: goOverview },
          h("span", { text: T.backToOverview }), icon("arrow")));
  }

  function reviewFlag(reasons) {
    if (!reasons.length) return null;
    return h("span", { class: "flag flag--review", title: reasons.join(" · ") }, icon("review"), h("span", { text: T.basisChanged }));
  }

  /* --- Inline-Editor --------------------------------------------------- */

  function inlineEditor({ value = "", label, key, placeholder = "", onSave, onCancel }) {
    const input = h("textarea", {
      class: "inline-editor__input", rows: 1, "aria-label": label, placeholder,
      "data-key": key, value,
      onInput: (e) => autosize(e.target),
      onKeydown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCancel(); }
      },
    });
    function save() {
      const text = input.value.trim();
      if (!text) onCancel(); else onSave(text);
    }
    return h("div", { class: "inline-editor" }, input,
      h("div", { class: "inline-editor__actions" },
        h("button", { type: "button", class: "button button--small button--primary", "data-key": `${key}-save`, onClick: save, text: T.save }),
        h("button", { type: "button", class: "button button--small button--quiet", "data-key": `${key}-cancel`, onClick: onCancel, text: T.cancel })));
  }

  /* --- Schritt 1 · Status --------------------------------------------- */

  function renderStatus() {
    return h("div", { class: "status" },
      C.statusGroups.map((group) => {
        const fields = C.statusFields.filter((f) => f.group === group.id);
        if (!fields.length) return null;
        return h("fieldset", { class: `status-group status-group--${group.id}` },
          h("legend", { class: "group-label", text: group.label }),
          group.note ? h("p", { class: "group-note", text: group.note }) : null,
          h("div", { class: "field-grid", "data-columns": group.columns || 2 }, fields.map(statusField)));
      }));
  }

  function statusField(field) {
    const id = `field-${field.id}`;
    const hintId = field.hint ? `${id}-hint` : null;
    const derived = state.factors.filter((f) => f.sources.includes(field.id)).length;
    const wrap = h("div", { class: `field field--${field.size}${statusTouched(field.id) ? " is-touched" : ""}` },
      h("div", { class: "field__top" },
        h("label", { for: id, class: "field__label", text: field.label }),
        h("span", { class: "field__flag", text: derived ? `geändert · ${derived} ${T.relCounts.factor[derived === 1 ? 0 : 1]} prüfen` : "geändert" })),
      field.hint ? h("p", { class: "field__hint", id: hintId, text: field.hint }) : null,
      h("textarea", {
        id, class: "field__input", rows: field.size === "long" ? 3 : 1,
        "aria-describedby": hintId, "data-key": id, value: state.status[field.id],
        onInput: (e) => {
          state.status[field.id] = e.target.value;
          autosize(e.target);
          wrap.classList.toggle("is-touched", statusTouched(field.id));
          refreshLive();
        },
      }));
    return wrap;
  }

  /* --- Schritt 2 · Faktoren ------------------------------------------- */

  function renderFactors() {
    return h("div", { class: "factor-board" },
      C.factorCategories.map((cat) => {
        const items = factorsIn(cat.id);
        return h("section", { class: `factor-col factor-col--${cat.id}`, "aria-labelledby": `cat-${cat.id}` },
          h("header", { class: "factor-col__head" },
            h("h3", { id: `cat-${cat.id}`, class: "factor-col__title" },
              h("span", { text: cat.label }),
              h("span", { class: "count", "aria-label": `${items.length} Einträge`, text: String(items.length) })),
            h("p", { class: "factor-col__desc", text: cat.description })),
          items.length
            ? h("ul", { class: "factor-list", role: "list" }, items.map(factorCard))
            : h("p", { class: "empty", text: T.emptyCategory }),
          addFactor(cat));
      }));
  }

  function factorCard(f) {
    const editing = state.ui.editingFactor === f.id;
    const sources = f.sources.map((sid) => byId(C.statusFields, sid)).filter(Boolean);
    const reasons = factorReasons(f);
    return h("li", { class: `factor${reasons.length ? " is-stale" : ""}${f.origin === "own" ? " is-own" : ""}`, "data-factor": f.id, "data-flip": `dfactor:${f.id}` },
      editing
        ? inlineEditor({
          value: f.text, label: "Faktor bearbeiten", key: `factor-${f.id}-input`,
          onSave: (text) => { f.text = text; snapshotFactor(f); state.ui.editingFactor = null; render({ focus: `[data-key="factor-${f.id}-edit"]` }); },
          onCancel: () => { state.ui.editingFactor = null; render({ focus: `[data-key="factor-${f.id}-edit"]` }); },
        })
        : h("p", { class: "factor__text", text: f.text }),
      editing ? null : h("div", { class: "factor__meta" },
        h("span", { class: "factor__source" },
          sources.length ? `${T.fromStatus} ${sources.map((s) => s.label).join(", ")}` : f.origin === "own" ? T.ownEntry : "",
          reviewFlag(reasons)),
        h("span", { class: "factor__tools" },
          iconButton("edit", `${T.edit}: ${f.text}`, `factor-${f.id}-edit`, () => {
            state.ui.editingFactor = f.id; state.ui.addingFactor = null;
            render({ focus: `[data-key="factor-${f.id}-input"]` });
          }),
          iconButton("remove", `${T.remove}: ${f.text}`, `factor-${f.id}-remove`, () => removeFactor(f)))),
      editing || !reasons.length ? null : h("div", { class: "review-row" },
        h("span", { class: "review-row__reason", text: reasons.join(" · ") }),
        reviewButton("factor", f, `review-factor-${f.id}`)),
      editing ? null : h("div", { class: "segmented", role: "group", "aria-label": `${T.classify}: ${f.text}` },
        C.factorCategories.map((cat) => h("button", {
          type: "button", class: "segmented__option", "aria-pressed": String(cat.id === f.category),
          "data-key": `factor-${f.id}-cat-${cat.id}`, text: cat.short,
          onClick: () => {
            if (cat.id === f.category) return;
            f.category = cat.id;
            render({ focus: `[data-key="factor-${f.id}-cat-${cat.id}"]` });
          },
        }))));
  }

  function addFactor(cat) {
    if (state.ui.addingFactor === cat.id) {
      return h("div", { class: "factor factor--new" }, inlineEditor({
        label: `${T.addFactor}: ${cat.label}`, key: `add-factor-${cat.id}-input`, placeholder: T.addFactorPlaceholder,
        onSave: (text) => {
          const id = newId("f");
          const f = { id, category: cat.id, sources: [], origin: "own", text };
          snapshotFactor(f);
          state.factors.push(f);
          state.ui.addingFactor = null;
          render({ focus: `[data-key="add-factor-${cat.id}"]` });
        },
        onCancel: () => { state.ui.addingFactor = null; render({ focus: `[data-key="add-factor-${cat.id}"]` }); },
      }));
    }
    return h("button", {
      type: "button", class: "add-button", "data-key": `add-factor-${cat.id}`,
      onClick: () => { state.ui.addingFactor = cat.id; state.ui.editingFactor = null; render({ focus: `[data-key="add-factor-${cat.id}-input"]` }); },
    }, icon("plus"), h("span", { text: T.addFactor }));
  }

  function removeFactor(f, { overview = false } = {}) {
    const index = state.factors.indexOf(f);
    state.factors.splice(index, 1);
    if (overview && isFocused("factor", f.id)) state.ui.focus = null;
    render({ focus: overview ? "#overview-title" : `[data-key="add-factor-${f.category}"]` });
    toast(T.factorRemoved, () => {
      state.factors.splice(Math.min(index, state.factors.length), 0, f);
      if (overview) state.ui.focus = { kind: "factor", id: f.id };
      render({ focus: overview ? `[data-key="node-factor-${f.id}"]` : `[data-key="factor-${f.id}-edit"]` });
    });
  }

  // Bezug-Chips: zeigen, worauf sich ein Eintrag stützt, und ob diese
  // Grundlage inzwischen entfernt oder umgeordnet wurde.
  function relationChips(factorIds) {
    if (!factorIds || !factorIds.length) return null;
    return h("ul", { class: "chips", role: "list", "aria-label": T.relatesTo },
      factorIds.map((id) => {
        const f = byId(state.factors, id);
        const original = byId(C.demoCase.factors, id);
        const text = f ? f.text : original ? original.text : id;
        const shifted = f && original && original.category !== f.category
          ? byId(C.factorCategories, f.category) : null;
        const note = !f ? T.relationRemoved : shifted ? `${T.relationShifted} ${shifted.short}` : "";
        return h("li", { class: `chip${!f ? " is-removed" : ""}${note && f ? " is-shifted" : ""}`, title: note ? `${text} · ${note}` : text },
          h("span", { class: "chip__text", text }),
          note ? h("span", { class: "chip__note", text: note }) : null);
      }));
  }

  /* --- Schritt 3 · Funktionelles Problem ------------------------------ */

  function renderProblem() {
    const p = state.problem;
    const review = problemNeedsReview();
    const statusLabel = review ? T.confirmedReview : p.confirmed ? T.confirmed : p.changedAfterConfirm ? T.draftChanged : T.draft;
    const hypothesis = h("textarea", {
      id: "hypothesis", class: "hypothesis__input", rows: 3, "data-key": "hypothesis", value: p.hypothesis,
      onInput: (e) => {
        p.hypothesis = e.target.value;
        autosize(e.target);
        if (problemChanged()) render();
        else refreshLive();
      },
    });
    return h("div", { class: "problem" },
      h("section", { class: `hypothesis${p.confirmed ? " is-confirmed" : ""}${review ? " needs-review" : ""}`, "aria-labelledby": "hypothesis-label" },
        h("div", { class: "hypothesis__head" },
          h("label", { id: "hypothesis-label", for: "hypothesis", class: "hypothesis__label", text: T.hypothesisLabel }),
          h("span", { class: `pill${review ? " pill--review" : p.confirmed ? " pill--confirmed" : ""}` },
            review ? icon("review") : p.confirmed ? icon("check") : null, h("span", { text: statusLabel }))),
        hypothesis,
        h("div", { class: "hypothesis__foot" },
          p.confirmed
            ? h("button", {
              type: "button", class: "button button--quiet", "data-key": "reopen",
              onClick: () => { p.confirmed = false; p.changedAfterConfirm = false; render({ focus: "#hypothesis" }); },
              text: T.reopen,
            })
            : null,
          !p.confirmed || review
            ? h("button", {
              type: "button", class: "button button--primary", "data-key": "confirm",
              onClick: () => { confirmProblem(); render({ focus: '[data-key="reopen"]' }); pulse(".hypothesis"); },
            }, icon("check"), h("span", { text: review ? T.reconfirm : T.confirm }))
            : null)),
      h("div", { class: "statement-board" },
        C.statementTypes.map((type) => {
          const items = p.statements.filter((s) => s.type === type.id);
          return h("section", { class: `statement-col statement-col--${type.id}`, "aria-labelledby": `type-${type.id}` },
            h("h3", { id: `type-${type.id}`, class: "statement-col__title" },
              h("span", { text: type.plural }), h("span", { class: "count", text: String(items.length) })),
            items.length ? h("ul", { class: "statement-list", role: "list" }, items.map(statementItem)) : null,
            addStatement(type));
        })));
  }

  function statementItem(s) {
    const editing = state.ui.editingStatement === s.id;
    const reasons = itemReasons(s);
    return h("li", { class: `statement${reasons.length ? " is-stale" : ""}`, "data-statement": s.id, "data-flip": `dstatement:${s.id}` },
      editing
        ? inlineEditor({
          value: s.text, label: "Eintrag bearbeiten", key: `st-${s.id}-input`,
          onSave: (text) => { s.text = text; snapshotItem(s); problemChanged(); state.ui.editingStatement = null; render({ focus: `[data-key="st-${s.id}-edit"]` }); },
          onCancel: () => { state.ui.editingStatement = null; render({ focus: `[data-key="st-${s.id}-edit"]` }); },
        })
        : h("p", { class: "statement__text", text: s.text }),
      editing ? null : relationChips(s.factorIds),
      editing || !reasons.length ? null : h("div", { class: "review-row" },
        reviewFlag(reasons),
        reviewButton("statement", s, `review-statement-${s.id}`)),
      editing ? null : h("div", { class: "statement__tools" },
        h("label", { class: "select-inline" },
          h("span", { class: "visually-hidden", text: "Art des Eintrags" }),
          h("select", {
            "data-key": `st-${s.id}-type`,
            onChange: (e) => { s.type = e.target.value; problemChanged(); render({ focus: `[data-key="st-${s.id}-type"]` }); },
          }, C.statementTypes.map((t) => h("option", { value: t.id, selected: t.id === s.type, text: t.label })))),
        iconButton("edit", `${T.edit}: ${s.text}`, `st-${s.id}-edit`, () => {
          state.ui.editingStatement = s.id; state.ui.addingStatement = null;
          render({ focus: `[data-key="st-${s.id}-input"]` });
        }),
        iconButton("remove", `${T.remove}: ${s.text}`, `st-${s.id}-remove`, () => {
          const list = state.problem.statements;
          const index = list.indexOf(s);
          list.splice(index, 1);
          const wasConfirmed = state.problem.confirmed;
          problemChanged();
          render({ focus: `[data-key="add-st-${s.type}"]` });
          toast(T.statementRemoved, () => {
            list.splice(Math.min(index, list.length), 0, s);
            if (wasConfirmed) { state.problem.confirmed = true; state.problem.changedAfterConfirm = false; }
            render({ focus: `[data-key="st-${s.id}-edit"]` });
          });
        })));
  }

  function addStatement(type) {
    if (state.ui.addingStatement === type.id) {
      return h("div", { class: "statement statement--new" }, inlineEditor({
        label: `${T.addStatement}: ${type.label}`, key: `add-st-${type.id}-input`, placeholder: T.addStatementPlaceholder,
        onSave: (text) => {
          const id = newId("s");
          const s = { id, type: type.id, text, factorIds: [] };
          snapshotItem(s);
          state.problem.statements.push(s);
          problemChanged();
          state.ui.addingStatement = null;
          render({ focus: `[data-key="add-st-${type.id}"]` });
        },
        onCancel: () => { state.ui.addingStatement = null; render({ focus: `[data-key="add-st-${type.id}"]` }); },
      }));
    }
    return h("button", {
      type: "button", class: "add-button", "data-key": `add-st-${type.id}`,
      onClick: () => { state.ui.addingStatement = type.id; state.ui.editingStatement = null; render({ focus: `[data-key="add-st-${type.id}-input"]` }); },
    }, icon("plus"), h("span", { text: `${type.label} ${T.addStatement.toLowerCase()}` }));
  }

  /* --- Schritt 4 · Interventionen ------------------------------------- */

  function removeIntervention(i, { overview = false } = {}) {
    const previous = i.state;
    i.state = "removed";
    if (overview && isFocused("intervention", i.id)) state.ui.focus = null;
    render({ focus: overview ? '[data-key="ov-add-own"]' : '[data-key="add-own"]' });
    toast(T.interventionRemoved, () => {
      i.state = previous;
      if (overview) state.ui.focus = { kind: "intervention", id: i.id };
      render({ focus: overview ? `[data-key="ov-i-${i.id}-accept"]` : `[data-key="i-${i.id}-accept"]` });
    });
  }

  function renderInterventions() {
    const visible = liveInterventions();
    const removed = removedInterventions();
    return h("div", { class: "interventions" },
      h("p", { class: "plan-bar", "aria-live": "polite" },
        h("span", { class: "plan-bar__label", text: T.planSummary }),
        h("span", { text: `${planned().length} ${T.accepted.toLowerCase()}` }),
        h("span", { class: "plan-bar__dot", "aria-hidden": "true" }),
        h("span", { text: `${undecided().length} ${T.undecided}` }),
        state.problem.confirmed ? null : h("button", {
          type: "button", class: "text-button", "data-key": "plan-to-problem",
          onClick: () => goTo(stepIndex("problem")),
          text: T.docUnconfirmed,
        })),
      h("div", { class: "card-grid" },
        visible.map(interventionCard),
        ownInterventionCard()),
      removed.length ? h("details", { class: "removed-list", open: true },
        h("summary", { "data-key": "removed-summary" }, `${T.removedList} (${removed.length})`),
        h("ul", { role: "list" }, removed.map((i) => h("li", null,
          h("span", { class: "removed-list__title", text: `${i.title} · ${categoryLabel(i.category)}` }),
          h("button", {
            type: "button", class: "text-button", "data-key": `i-${i.id}-restore`, text: T.restore,
            onClick: () => { i.state = "candidate"; render({ focus: `[data-key="i-${i.id}-accept"]` }); },
          }))))) : null);
  }

  function interventionCard(i) {
    if (state.ui.adjusting === i.id) return adjustForm(i);
    const accepted = i.state === "accepted";
    const liveFactors = i.factorIds.filter((id) => byId(state.factors, id));
    const orphan = i.factorIds.length > 0 && liveFactors.length === 0;
    const reasons = itemReasons(i);
    const markers = [
      i.origin === "own" ? C.documentation.ownMarker : null,
      i.adjusted ? T.adjusted : null,
    ].filter(Boolean);
    return h("article", {
      class: `icard${accepted ? " is-accepted" : ""}${orphan ? " is-orphan" : ""}${i.origin === "own" ? " is-own" : ""}${reasons.length ? " is-stale" : ""}`,
      "data-intervention": i.id, "aria-labelledby": `i-${i.id}-title`, "data-flip": `dint:${i.id}`,
    },
      h("p", { class: "icard__eyebrow" },
        h("span", { text: categoryLabel(i.category) }),
        markers.length ? h("span", { class: "icard__marker", text: markers.join(" · ") }) : null,
        accepted ? h("span", { class: "icard__state" }, icon("check"), h("span", { text: T.accepted })) : null),
      h("h3", { class: "icard__title", id: `i-${i.id}-title`, text: i.title }),
      i.rationale ? h("p", { class: "icard__rationale", text: i.rationale }) : null,
      i.dosage ? h("p", { class: "icard__dosage" }, h("span", { text: `${C.documentation.dosageLabel}: ` }), i.dosage) : null,
      relationChips(i.factorIds),
      reasons.length ? h("div", { class: "review-row" }, reviewFlag(reasons), reviewButton("intervention", i, `review-intervention-${i.id}`)) : null,
      h("div", { class: "icard__actions" },
        accepted
          ? h("button", {
            type: "button", class: "button button--small button--quiet", "data-key": `i-${i.id}-accept`,
            onClick: () => { i.state = "candidate"; render(); }, text: T.withdraw,
          })
          : h("button", {
            type: "button", class: "button button--small button--accept", "data-key": `i-${i.id}-accept`,
            onClick: () => { i.state = "accepted"; snapshotItem(i); render(); pulse(`[data-intervention="${i.id}"]`); },
          }, icon("check"), h("span", { text: T.accept })),
        h("button", {
          type: "button", class: "button button--small button--ghost", "data-key": `i-${i.id}-adjust`, text: T.adjust,
          onClick: () => { state.ui.adjusting = i.id; state.ui.addingOwn = false; render({ focus: `#adjust-${i.id}-title` }); },
        }),
        h("button", {
          type: "button", class: "button button--small button--quiet", "data-key": `i-${i.id}-remove`, text: T.remove,
          onClick: () => removeIntervention(i),
        })));
  }

  function interventionFields(prefix, values) {
    const catSelect = h("select", { id: `${prefix}-category` },
      C.interventionCategories.map((c) => h("option", { value: c.id, selected: c.id === values.category, text: c.label })));
    const title = h("input", { id: `${prefix}-title`, type: "text", value: values.title, placeholder: T.ownTitlePlaceholder, autocomplete: "off" });
    const rationale = h("textarea", { id: `${prefix}-rationale`, rows: 2, value: values.rationale, placeholder: T.ownRationalePlaceholder, onInput: (e) => autosize(e.target) });
    const dosage = h("input", { id: `${prefix}-dosage`, type: "text", value: values.dosage, placeholder: T.dosagePlaceholder, autocomplete: "off" });
    const grid = h("div", { class: "form-grid" },
      h("div", { class: "form-field form-field--wide" }, h("label", { for: `${prefix}-title`, text: T.titleField }), title),
      h("div", { class: "form-field" }, h("label", { for: `${prefix}-category`, text: T.categoryField }), catSelect),
      h("div", { class: "form-field" }, h("label", { for: `${prefix}-dosage`, text: T.dosageField }), dosage),
      h("div", { class: "form-field form-field--wide" }, h("label", { for: `${prefix}-rationale`, text: T.rationaleField }), rationale));
    const read = () => ({
      category: catSelect.value, title: title.value.trim(),
      rationale: rationale.value.trim(), dosage: dosage.value.trim(),
    });
    return { grid, read, title };
  }

  function adjustForm(i) {
    const fields = interventionFields(`adjust-${i.id}`, i);
    const cancel = () => { state.ui.adjusting = null; render({ focus: `[data-key="i-${i.id}-adjust"]` }); };
    return h("form", {
      class: "icard icard--form", "data-intervention": i.id, "aria-label": `${T.adjust}: ${i.title}`,
      onSubmit: (e) => {
        e.preventDefault();
        const v = fields.read();
        if (!v.title) { fields.title.focus(); return; }
        const changed = ["category", "title", "rationale", "dosage"].some((k) => v[k] !== i[k]);
        Object.assign(i, v);
        if (changed && i.origin === "suggested") i.adjusted = true;
        snapshotItem(i);
        state.ui.adjusting = null;
        render({ focus: `[data-key="i-${i.id}-adjust"]` });
      },
      onKeydown: (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); } },
    },
      h("p", { class: "icard__eyebrow", text: T.adjust }),
      fields.grid,
      h("div", { class: "icard__actions" },
        h("button", { type: "submit", class: "button button--small button--primary", text: T.save }),
        h("button", { type: "button", class: "button button--small button--quiet", text: T.cancel, onClick: cancel })));
  }

  function ownInterventionCard() {
    if (!state.ui.addingOwn) {
      return h("button", {
        type: "button", class: "icard icard--add", "data-key": "add-own",
        onClick: () => {
          state.ui.addingOwn = true; state.ui.adjusting = null;
          state.ui.ownDraft = { category: C.interventionCategories[0].id, title: "", rationale: "", dosage: "", factorIds: [] };
          render({ focus: "#own-title" });
        },
      }, icon("plus"), h("span", { text: T.addOwn }));
    }
    const draft = state.ui.ownDraft;
    const fields = interventionFields("own", draft);
    const pickable = state.factors.filter((f) => f.category !== "context");
    const cancel = () => { state.ui.addingOwn = false; state.ui.ownDraft = null; render({ focus: '[data-key="add-own"]' }); };
    return h("form", {
      class: "icard icard--form icard--own-form", "aria-label": T.addOwn,
      onSubmit: (e) => {
        e.preventDefault();
        const v = fields.read();
        if (!v.title) { fields.title.focus(); return; }
        const id = newId("i");
        const item = { id, ...v, factorIds: draft.factorIds.slice(), state: "accepted", origin: "own", adjusted: false };
        snapshotItem(item);
        state.interventions.push(item);
        state.ui.addingOwn = false; state.ui.ownDraft = null;
        state.ui.returnFocus = { kind: "intervention", id };
        render({ focus: '[data-key="add-own"]' });
      },
      onKeydown: (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); } },
    },
      h("p", { class: "icard__eyebrow", text: T.addOwn }),
      fields.grid,
      pickable.length ? h("fieldset", { class: "pick" },
        h("legend", { text: T.relatesPick }),
        h("div", { class: "pick__options" }, pickable.map((f) => h("button", {
          type: "button", class: "pick__option", "aria-pressed": String(draft.factorIds.includes(f.id)),
          "data-key": `own-pick-${f.id}`, text: f.text,
          onClick: (e) => {
            Object.assign(draft, fields.read());
            const at = draft.factorIds.indexOf(f.id);
            if (at === -1) draft.factorIds.push(f.id); else draft.factorIds.splice(at, 1);
            e.currentTarget.setAttribute("aria-pressed", String(at === -1));
          },
        })))) : null,
      h("div", { class: "icard__actions" },
        h("button", { type: "submit", class: "button button--small button--primary" }, icon("check"), h("span", { text: `${T.accept}` })),
        h("button", { type: "button", class: "button button--small button--quiet", text: T.cancel, onClick: cancel })));
  }

  /* --- Schritt 5 · Dokumentation -------------------------------------- */

  // Alles, was in die Dokumentation einfließt. Ändert es sich nach einer
  // manuellen Bearbeitung, wird darauf hingewiesen statt still zu überschreiben.
  function basisKey() {
    return JSON.stringify([
      state.status,
      state.factors.map((f) => [f.id, f.category, f.text]),
      state.problem.hypothesis, state.problem.confirmed, problemNeedsReview(),
      state.problem.statements.map((s) => [s.type, s.text]),
      state.interventions.map((i) => [i.id, i.state, i.category, i.title, i.rationale, i.dosage]),
    ]);
  }

  function prepareDocumentation() {
    if (!state.doc.manual) {
      state.doc.text = generateDocumentation();
      state.doc.basis = basisKey();
    }
  }

  function today() {
    return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function generateDocumentation() {
    const D = C.documentation;
    const lines = [];
    const blank = () => { if (lines.length && lines[lines.length - 1] !== "") lines.push(""); };

    lines.push(D.title);
    lines.push(`${C.meta.caseLabel} · ${C.meta.caseSummary} · ${today()}`);

    blank(); lines.push(D.headings.status);
    for (const f of filledStatus()) lines.push(`${f.label}: ${state.status[f.id].trim().replace(/\s*\n\s*/g, " ")}`);

    blank(); lines.push(D.headings.factors);
    for (const cat of C.factorCategories) {
      const items = factorsIn(cat.id);
      if (!items.length) continue;
      lines.push(cat.label);
      for (const f of items) lines.push(`- ${f.text}`);
    }

    blank(); lines.push(D.headings.problem);
    lines.push(problemNeedsReview() ? D.hypothesisReview : state.problem.confirmed ? D.hypothesisConfirmed : D.hypothesisDraft);
    lines.push(state.problem.hypothesis.trim());
    for (const type of C.statementTypes) {
      const items = state.problem.statements.filter((s) => s.type === type.id);
      if (!items.length) continue;
      blank(); lines.push(type.plural);
      for (const s of items) lines.push(`- ${s.text}`);
    }

    blank(); lines.push(D.headings.plan);
    const plan = planned();
    if (!plan.length) lines.push(D.emptyPlan);
    plan.forEach((i, n) => {
      const own = i.origin === "own" ? ` · ${D.ownMarker}` : "";
      lines.push(`${n + 1}. ${i.title} (${categoryLabel(i.category)}${own})`);
      if (i.rationale) lines.push(`   ${D.rationaleLabel}: ${i.rationale}`);
      if (i.dosage) lines.push(`   ${D.dosageLabel}: ${i.dosage}`);
    });
    return lines.join("\n");
  }

  function renderDocumentation() {
    const stale = state.doc.manual && state.doc.basis !== basisKey();
    const open = undecided().length;
    const notices = [];
    if (!state.problem.confirmed) notices.push(notice(T.docUnconfirmed, "Zum funktionellen Problem", "doc-to-problem", "problem"));
    if (open) notices.push(notice(`${open} ${T.docUndecided}.`, "Zu den Interventionen", "doc-to-interventions", "interventions"));
    if (stale) notices.push(h("p", { class: "notice notice--strong" },
      h("span", { text: T.docStale }),
      h("button", { type: "button", class: "text-button", "data-key": "doc-regenerate-inline", onClick: regenerate, text: T.regenerate })));

    const area = h("textarea", {
      class: "doc__text", id: "doc-text", "data-key": "doc-text", spellcheck: "false",
      "aria-label": "Dokumentationstext", value: state.doc.text,
      onInput: (e) => {
        state.doc.text = e.target.value;
        autosize(e.target);
        if (!state.doc.manual) { state.doc.manual = true; render(); }
      },
    });

    return h("div", { class: "doc" },
      notices.length ? h("div", { class: "notices" }, notices) : null,
      h("div", { class: "doc__paper" },
        h("div", { class: "doc__paperhead" },
          h("img", { src: "assets/logo-raum-und-zeit.png", alt: "", width: 24, height: 24 }),
          h("span", { text: `${C.meta.practice} · ${C.meta.title}` }),
          h("span", { class: "doc__date", text: today() })),
        area),
      state.doc.manual && !stale ? h("p", { class: "doc__manual", text: T.docManual }) : null,
      h("div", { class: "doc__actions" },
        h("button", { type: "button", class: "button button--primary", "data-key": "doc-copy", onClick: copyDocumentation }, h("span", { text: T.copy })),
        h("button", { type: "button", class: "button button--ghost", "data-key": "doc-download", onClick: downloadDocumentation, text: T.download }),
        state.doc.manual ? h("button", { type: "button", class: "button button--quiet", "data-key": "doc-regenerate", onClick: regenerate, text: T.regenerate }) : null));
  }

  function notice(text, action, key, stepId) {
    return h("p", { class: "notice" },
      h("span", { text }),
      h("button", { type: "button", class: "text-button", "data-key": key, text: action, onClick: () => goTo(stepIndex(stepId)) }));
  }

  function regenerate() {
    state.doc.manual = false;
    prepareDocumentation();
    render({ focus: "#doc-text" });
    pulse(".doc__paper");
  }

  async function copyDocumentation() {
    const text = state.doc.text;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; }
    } catch (_) { ok = false; }
    if (!ok) {
      // Rückfall ohne Clipboard-API: unsichtbares Feld mit dem Text markieren.
      const area = h("textarea", { class: "visually-hidden", "aria-hidden": "true", tabindex: "-1", value: text });
      document.body.append(area);
      area.select();
      try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
      area.remove();
    }
    toast(ok ? T.copied : "Kopieren nicht möglich. Text markieren und kopieren.");
  }

  function downloadDocumentation() {
    const blob = new Blob([state.doc.text + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: C.documentation.fileName });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* --- Rückmeldungen -------------------------------------------------- */

  function toast(message, undo) {
    clearTimeout(toastTimer);
    const el = h("div", { class: "toast" },
      h("span", { text: message }),
      undo ? h("button", {
        type: "button", class: "toast__undo", "data-key": "toast-undo", text: T.undo,
        onClick: () => { toastRegion.replaceChildren(); clearTimeout(toastTimer); undo(); },
      }) : null);
    toastRegion.replaceChildren(el);
    toastTimer = setTimeout(() => toastRegion.replaceChildren(), undo ? 7000 : 3200);
  }

  // Kurzer Lichtimpuls nach einer Bestätigung: hier hat sich etwas entschieden.
  function pulse(selector) {
    if (reduceMotion.matches) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.animate([{ boxShadow: "0 0 0 0 rgba(23,198,189,0)" }, { boxShadow: "0 0 0 5px rgba(23,198,189,.22)" }, { boxShadow: "0 0 0 0 rgba(23,198,189,0)" }],
      { duration: 900, easing: "cubic-bezier(.23,1,.32,1)" });
  }

  function autosize(el) {
    if (!el || el.tagName !== "TEXTAREA" || el.classList.contains("visually-hidden")) return;
    // Auf 0 setzen, damit "rows" die Messung nicht nach oben verfälscht.
    const y = window.scrollY;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight + 2}px`;
    if (window.scrollY !== y) window.scrollTo(0, y);
  }

  /* --- Zurücksetzen ---------------------------------------------------- */

  const resetButton = $("[data-reset]");
  let resetTimer = null;
  resetButton.textContent = T.reset;
  resetButton.addEventListener("click", () => {
    if (!resetButton.classList.contains("is-armed")) {
      resetButton.classList.add("is-armed");
      resetButton.textContent = T.resetConfirm;
      resetTimer = setTimeout(disarmReset, 4000);
      return;
    }
    disarmReset();
    initialState();
    toastRegion.replaceChildren();
    lastPreview = null;
    render({ enter: true, focus: "#overview-title" });
    window.scrollTo({ top: 0 });
    toast(T.resetDone);
  });
  function disarmReset() {
    clearTimeout(resetTimer);
    resetButton.classList.remove("is-armed");
    resetButton.textContent = T.reset;
  }

  /* --- Start ---------------------------------------------------------- */

  for (const [slot, value] of Object.entries(C.meta)) {
    document.querySelectorAll(`[data-slot="${slot}"]`).forEach((el) => { el.textContent = value; });
  }
  document.title = `${C.meta.title} · ${C.meta.practice}`;
  window.addEventListener("resize", scheduleRedraw);
  // Escape hebt im Überblick die Auswahl auf (nicht beim Schreiben).
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || state.view !== "overview" || !state.ui.focus) return;
    if (e.target.closest && e.target.closest("textarea, input, select")) return;
    const f = state.ui.focus;
    setFocus(null);
    const back = document.querySelector(`[data-key="node-${f.kind}-${f.id}"]`);
    if (back) back.focus();
  });

  initialState();
  render();
  // Höhen und Linien erst mit geladener Schrift endgültig messen.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRedraw);
})();

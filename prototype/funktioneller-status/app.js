/* ==========================================================================
   Raum & Zeit · Funktioneller Status · Oberfläche
   --------------------------------------------------------------------------
   Liest alle Inhalte aus config.js (window.RZ_FUNKTIONELLER_STATUS).
   Zustand nur im Arbeitsspeicher: kein Speichern im Browser, kein Netzwerk.
   Neu laden setzt die Demo zurück.
   ========================================================================== */
(() => {
  "use strict";

  const C = window.RZ_FUNKTIONELLER_STATUS;
  const T = C.text;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- Helfer --------------------------------------------------------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const byId = (list, id) => list.find((item) => item.id === id);
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

  function initialState() {
    const demo = clone(C.demoCase);
    return {
      step: 0,
      status: Object.fromEntries(C.statusFields.map((f) => [f.id, demo.status[f.id] ?? ""])),
      factors: demo.factors.map((f) => ({ ...f, origin: "suggested" })),
      problem: {
        hypothesis: demo.problem.hypothesis,
        statements: demo.problem.statements.map((s) => ({ ...s, factorIds: s.factorIds || [] })),
        confirmed: false,
        changedAfterConfirm: false,
      },
      interventions: demo.interventions.map((i) => ({
        ...i, factorIds: i.factorIds || [], dosage: i.dosage || "",
        state: "candidate", origin: "suggested", adjusted: false,
      })),
      doc: { text: "", manual: false, basis: "" },
      ui: {
        editingFactor: null, addingFactor: null,
        editingStatement: null, addingStatement: null,
        adjusting: null, addingOwn: false, ownDraft: null,
      },
    };
  }

  const statusTouched = (fieldId) =>
    (state.status[fieldId] || "") !== (C.demoCase.status[fieldId] ?? "");

  const filledStatus = () => C.statusFields.filter((f) => (state.status[f.id] || "").trim());
  const factorsIn = (categoryId) => state.factors.filter((f) => f.category === categoryId);
  const planned = () => state.interventions.filter((i) => i.state === "accepted");
  const undecided = () => state.interventions.filter((i) => i.state === "candidate");
  const removedInterventions = () => state.interventions.filter((i) => i.state === "removed");
  const categoryLabel = (id) => (byId(C.interventionCategories, id) || { label: id }).label;

  // Jede inhaltliche Änderung am Problem macht eine Bestätigung ungültig:
  // bestätigt ist nur, was die Therapeutin in genau dieser Form gesehen hat.
  function problemChanged() {
    if (state.problem.confirmed) {
      state.problem.confirmed = false;
      state.problem.changedAfterConfirm = true;
      return true;
    }
    return false;
  }

  /* --- Rendering ------------------------------------------------------ */

  const flowEl = $("[data-flow]");
  const stageEl = $("#stage");
  const flowCaption = $("[data-flow-caption]");

  function render({ enter = false, focus = null } = {}) {
    // Fokus und Cursor über das Neuzeichnen hinweg halten.
    const active = document.activeElement;
    const activeKey = active && active.dataset ? active.dataset.key : null;
    const selection = active && "selectionStart" in active && typeof active.selectionStart === "number"
      ? [active.selectionStart, active.selectionEnd] : null;

    renderFlow();
    stageEl.replaceChildren(renderStep());
    stageEl.querySelectorAll("textarea").forEach(autosize);

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
  }

  function goTo(index) {
    if (index < 0 || index >= C.steps.length) return;
    state.step = index;
    if (C.steps[index].id === "documentation") prepareDocumentation();
    render({ enter: true, focus: "#step-title" });
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function flowValue(stepId) {
    switch (stepId) {
      case "status":
        return `${filledStatus().length} von ${C.statusFields.length} ${T.threadStatus}`;
      case "factors": {
        const open = factorsIn("open").length;
        return `${factorsIn("modifiable").length} ${T.threadFactors}` + (open ? ` · ${open} ${T.threadOpen}` : "");
      }
      case "problem":
        return state.problem.confirmed ? T.confirmed : T.draft;
      case "interventions": {
        const u = undecided().length;
        return `${planned().length} ${T.threadPlan}` + (u ? ` · ${u} ${T.undecided}` : "");
      }
      case "documentation":
        return state.doc.manual ? "bearbeitet" : "aus Schritten";
      default:
        return "";
    }
  }

  // Der Ablauf wird einmal gebaut und danach nur aktualisiert, damit die
  // Markenlinie über dem aktiven Schritt sichtbar wandert.
  function renderFlow() {
    if (!flowEl.children.length) {
      flowEl.append(...C.steps.map((step, i) => h("li", { class: "flow__item" },
        h("button", { type: "button", class: "flow__button", "data-key": `flow-${step.id}`, onClick: () => goTo(i) },
          h("span", { class: "flow__num", "aria-hidden": "true" }, String(i + 1).padStart(2, "0")),
          h("span", { class: "flow__text" },
            h("span", { class: "flow__label", text: step.label }),
            h("span", { class: "flow__value" }))))));
    }
    [...flowEl.children].forEach((li, i) => {
      li.classList.toggle("is-current", i === state.step);
      li.classList.toggle("is-past", i < state.step);
      const button = li.firstElementChild;
      if (i === state.step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    refreshFlowValues();
    flowCaption.textContent = `Schritt ${state.step + 1} von ${C.steps.length} · ${C.steps[state.step].label}`;
  }

  function refreshFlowValues() {
    flowEl.querySelectorAll(".flow__value").forEach((el, i) => {
      const id = C.steps[i].id;
      el.textContent = flowValue(id);
      el.classList.toggle("is-confirmed", id === "problem" && state.problem.confirmed);
    });
  }

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
    return h("header", { class: "step-head" },
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
      prev ? h("button", { type: "button", class: "button button--ghost", "data-key": "nav-back", onClick: () => goTo(state.step - 1) },
        icon("back"), h("span", { text: `${T.back}` })) : h("span"),
      next ? h("button", { type: "button", class: "button button--primary", "data-key": "nav-next", onClick: () => goTo(state.step + 1) },
        h("span", { text: `${T.next}: ${next.label}` }), icon("arrow")) : null);
  }

  /* --- Inline-Editor --------------------------------------------------- */

  function inlineEditor({ value = "", label, key, placeholder = "", onSave, onCancel }) {
    const input = h("textarea", {
      class: "inline-editor__input", rows: 1, "aria-label": label, placeholder,
      "data-key": key, value,
      onInput: (e) => autosize(e.target),
      onKeydown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
        if (e.key === "Escape") { e.preventDefault(); onCancel(); }
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
          h("div", { class: "field-grid", style: null, "data-columns": group.columns || 2 }, fields.map(statusField)));
      }));
  }

  function statusField(field) {
    const id = `field-${field.id}`;
    const hintId = field.hint ? `${id}-hint` : null;
    const wrap = h("div", { class: `field field--${field.size}${statusTouched(field.id) ? " is-touched" : ""}` },
      h("div", { class: "field__top" },
        h("label", { for: id, class: "field__label", text: field.label }),
        h("span", { class: "field__flag", text: "geändert" })),
      field.hint ? h("p", { class: "field__hint", id: hintId, text: field.hint }) : null,
      h("textarea", {
        id, class: "field__input", rows: field.size === "long" ? 3 : 1,
        "aria-describedby": hintId, "data-key": id, value: state.status[field.id],
        onInput: (e) => {
          state.status[field.id] = e.target.value;
          autosize(e.target);
          wrap.classList.toggle("is-touched", statusTouched(field.id));
          refreshFlowValues();
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
    const source = f.source ? byId(C.statusFields, f.source) : null;
    const stale = source && f.origin === "suggested" && statusTouched(source.id);
    return h("li", { class: `factor${stale ? " is-stale" : ""}${f.origin === "own" ? " is-own" : ""}`, "data-factor": f.id },
      editing
        ? inlineEditor({
          value: f.text, label: "Faktor bearbeiten", key: `factor-${f.id}-input`,
          onSave: (text) => { f.text = text; state.ui.editingFactor = null; render({ focus: `[data-key="factor-${f.id}-edit"]` }); },
          onCancel: () => { state.ui.editingFactor = null; render({ focus: `[data-key="factor-${f.id}-edit"]` }); },
        })
        : h("p", { class: "factor__text", text: f.text }),
      editing ? null : h("div", { class: "factor__meta" },
        h("span", { class: "factor__source" },
          source ? `${T.fromStatus} ${source.label}` : f.origin === "own" ? T.ownEntry : "",
          stale ? h("span", { class: "flag", text: T.statusChanged }) : null),
        h("span", { class: "factor__tools" },
          iconButton("edit", `${T.edit}: ${f.text}`, `factor-${f.id}-edit`, () => {
            state.ui.editingFactor = f.id; state.ui.addingFactor = null;
            render({ focus: `[data-key="factor-${f.id}-input"]` });
          }),
          iconButton("remove", `${T.remove}: ${f.text}`, `factor-${f.id}-remove`, () => removeFactor(f)))),
      editing ? null : h("div", { class: "segmented", role: "group", "aria-label": `${T.classify}: ${f.text}` },
        C.factorCategories.map((cat) => h("button", {
          type: "button", class: "segmented__option", "aria-pressed": String(cat.id === f.category),
          "data-key": `factor-${f.id}-cat-${cat.id}`, text: cat.short,
          onClick: () => {
            if (cat.id === f.category) return;
            f.category = cat.id;
            render({ focus: `[data-key="factor-${f.id}-cat-${cat.id}"]` });
            flash(`[data-factor="${f.id}"]`);
          },
        }))));
  }

  function addFactor(cat) {
    if (state.ui.addingFactor === cat.id) {
      return h("div", { class: "factor factor--new" }, inlineEditor({
        label: `${T.addFactor}: ${cat.label}`, key: `add-factor-${cat.id}-input`, placeholder: T.addFactorPlaceholder,
        onSave: (text) => {
          const id = newId("f");
          state.factors.push({ id, category: cat.id, source: "", origin: "own", text });
          state.ui.addingFactor = null;
          render({ focus: `[data-key="add-factor-${cat.id}"]` });
          flash(`[data-factor="${id}"]`);
        },
        onCancel: () => { state.ui.addingFactor = null; render({ focus: `[data-key="add-factor-${cat.id}"]` }); },
      }));
    }
    return h("button", {
      type: "button", class: "add-button", "data-key": `add-factor-${cat.id}`,
      onClick: () => { state.ui.addingFactor = cat.id; state.ui.editingFactor = null; render({ focus: `[data-key="add-factor-${cat.id}-input"]` }); },
    }, icon("plus"), h("span", { text: T.addFactor }));
  }

  function removeFactor(f) {
    const index = state.factors.indexOf(f);
    state.factors.splice(index, 1);
    render({ focus: `[data-key="add-factor-${f.category}"]` });
    toast(T.factorRemoved, () => {
      state.factors.splice(Math.min(index, state.factors.length), 0, f);
      render({ focus: `[data-key="factor-${f.id}-edit"]` });
      flash(`[data-factor="${f.id}"]`);
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
    const statusLabel = p.confirmed ? T.confirmed : p.changedAfterConfirm ? T.draftChanged : T.draft;
    const hypothesis = h("textarea", {
      id: "hypothesis", class: "hypothesis__input", rows: 3, "data-key": "hypothesis", value: p.hypothesis,
      onInput: (e) => {
        p.hypothesis = e.target.value;
        autosize(e.target);
        if (problemChanged()) render();
      },
    });
    return h("div", { class: "problem" },
      h("section", { class: `hypothesis${p.confirmed ? " is-confirmed" : ""}`, "aria-labelledby": "hypothesis-label" },
        h("div", { class: "hypothesis__head" },
          h("label", { id: "hypothesis-label", for: "hypothesis", class: "hypothesis__label", text: T.hypothesisLabel }),
          h("span", { class: `pill${p.confirmed ? " pill--confirmed" : ""}` },
            p.confirmed ? icon("check") : null, h("span", { text: statusLabel }))),
        hypothesis,
        h("div", { class: "hypothesis__foot" },
          p.confirmed
            ? h("button", {
              type: "button", class: "button button--quiet", "data-key": "reopen",
              onClick: () => { p.confirmed = false; p.changedAfterConfirm = false; render({ focus: "#hypothesis" }); },
              text: T.reopen,
            })
            : h("button", {
              type: "button", class: "button button--primary", "data-key": "confirm",
              onClick: () => { p.confirmed = true; p.changedAfterConfirm = false; render({ focus: '[data-key="reopen"]' }); flash(".hypothesis"); },
            }, icon("check"), h("span", { text: T.confirm })))),
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
    return h("li", { class: "statement", "data-statement": s.id },
      editing
        ? inlineEditor({
          value: s.text, label: "Eintrag bearbeiten", key: `st-${s.id}-input`,
          onSave: (text) => { s.text = text; problemChanged(); state.ui.editingStatement = null; render({ focus: `[data-key="st-${s.id}-edit"]` }); },
          onCancel: () => { state.ui.editingStatement = null; render({ focus: `[data-key="st-${s.id}-edit"]` }); },
        })
        : h("p", { class: "statement__text", text: s.text }),
      editing ? null : relationChips(s.factorIds),
      editing ? null : h("div", { class: "statement__tools" },
        h("label", { class: "select-inline" },
          h("span", { class: "visually-hidden", text: "Art des Eintrags" }),
          h("select", {
            "data-key": `st-${s.id}-type`,
            onChange: (e) => { s.type = e.target.value; problemChanged(); render({ focus: `[data-key="st-${s.id}-type"]` }); flash(`[data-statement="${s.id}"]`); },
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
            flash(`[data-statement="${s.id}"]`);
          });
        })));
  }

  function addStatement(type) {
    if (state.ui.addingStatement === type.id) {
      return h("div", { class: "statement statement--new" }, inlineEditor({
        label: `${T.addStatement}: ${type.label}`, key: `add-st-${type.id}-input`, placeholder: T.addStatementPlaceholder,
        onSave: (text) => {
          const id = newId("s");
          state.problem.statements.push({ id, type: type.id, text, factorIds: [] });
          problemChanged();
          state.ui.addingStatement = null;
          render({ focus: `[data-key="add-st-${type.id}"]` });
          flash(`[data-statement="${id}"]`);
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

  function renderInterventions() {
    const visible = state.interventions.filter((i) => i.state !== "removed");
    const removed = removedInterventions();
    return h("div", { class: "interventions" },
      h("p", { class: "plan-bar", "aria-live": "polite" },
        h("span", { class: "plan-bar__label", text: T.planSummary }),
        h("span", { text: `${planned().length} ${T.accepted.toLowerCase()}` }),
        h("span", { class: "plan-bar__dot", "aria-hidden": "true" }),
        h("span", { text: `${undecided().length} ${T.undecided}` }),
        state.problem.confirmed ? null : h("button", {
          type: "button", class: "text-button", "data-key": "plan-to-problem",
          onClick: () => goTo(C.steps.findIndex((s) => s.id === "problem")),
          text: T.docUnconfirmed,
        })),
      h("div", { class: "card-grid" },
        visible.map(interventionCard),
        ownInterventionCard()),
      removed.length ? h("details", { class: "removed-list" },
        h("summary", { "data-key": "removed-summary" }, `${T.removedList} (${removed.length})`),
        h("ul", { role: "list" }, removed.map((i) => h("li", null,
          h("span", { class: "removed-list__title", text: `${i.title} · ${categoryLabel(i.category)}` }),
          h("button", {
            type: "button", class: "text-button", "data-key": `i-${i.id}-restore`, text: T.restore,
            onClick: () => { i.state = "candidate"; render({ focus: `[data-key="i-${i.id}-accept"]` }); flash(`[data-intervention="${i.id}"]`); },
          }))))) : null);
  }

  function interventionCard(i) {
    if (state.ui.adjusting === i.id) return adjustForm(i);
    const accepted = i.state === "accepted";
    const liveFactors = i.factorIds.filter((id) => byId(state.factors, id));
    const orphan = i.factorIds.length > 0 && liveFactors.length === 0;
    const markers = [
      i.origin === "own" ? C.documentation.ownMarker : null,
      i.adjusted ? T.adjusted : null,
    ].filter(Boolean);
    return h("article", {
      class: `icard${accepted ? " is-accepted" : ""}${orphan ? " is-orphan" : ""}${i.origin === "own" ? " is-own" : ""}`,
      "data-intervention": i.id, "aria-labelledby": `i-${i.id}-title`,
    },
      h("p", { class: "icard__eyebrow" },
        h("span", { text: categoryLabel(i.category) }),
        markers.length ? h("span", { class: "icard__marker", text: markers.join(" · ") }) : null,
        accepted ? h("span", { class: "icard__state" }, icon("check"), h("span", { text: T.accepted })) : null),
      h("h3", { class: "icard__title", id: `i-${i.id}-title`, text: i.title }),
      i.rationale ? h("p", { class: "icard__rationale", text: i.rationale }) : null,
      i.dosage ? h("p", { class: "icard__dosage" }, h("span", { text: `${C.documentation.dosageLabel}: ` }), i.dosage) : null,
      relationChips(i.factorIds),
      h("div", { class: "icard__actions" },
        accepted
          ? h("button", {
            type: "button", class: "button button--small button--quiet", "data-key": `i-${i.id}-accept`,
            onClick: () => { i.state = "candidate"; render(); }, text: T.withdraw,
          })
          : h("button", {
            type: "button", class: "button button--small button--accept", "data-key": `i-${i.id}-accept`,
            onClick: () => { i.state = "accepted"; render(); flash(`[data-intervention="${i.id}"]`); },
          }, icon("check"), h("span", { text: T.accept })),
        h("button", {
          type: "button", class: "button button--small button--ghost", "data-key": `i-${i.id}-adjust`, text: T.adjust,
          onClick: () => { state.ui.adjusting = i.id; state.ui.addingOwn = false; render({ focus: `#adjust-${i.id}-title` }); },
        }),
        h("button", {
          type: "button", class: "button button--small button--quiet", "data-key": `i-${i.id}-remove`, text: T.remove,
          onClick: () => {
            const previous = i.state;
            i.state = "removed";
            render({ focus: '[data-key="add-own"]' });
            toast(T.interventionRemoved, () => { i.state = previous; render({ focus: `[data-key="i-${i.id}-accept"]` }); flash(`[data-intervention="${i.id}"]`); });
          },
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
        state.ui.adjusting = null;
        render({ focus: `[data-key="i-${i.id}-adjust"]` });
        flash(`[data-intervention="${i.id}"]`);
      },
      onKeydown: (e) => { if (e.key === "Escape") { e.preventDefault(); cancel(); } },
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
        state.interventions.push({ id, ...v, factorIds: draft.factorIds.slice(), state: "accepted", origin: "own", adjusted: false });
        state.ui.addingOwn = false; state.ui.ownDraft = null;
        render({ focus: '[data-key="add-own"]' });
        flash(`[data-intervention="${id}"]`);
      },
      onKeydown: (e) => { if (e.key === "Escape") { e.preventDefault(); cancel(); } },
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
      state.problem.hypothesis, state.problem.confirmed,
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
    lines.push(state.problem.confirmed ? D.hypothesisConfirmed : D.hypothesisDraft);
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
      h("button", { type: "button", class: "text-button", "data-key": key, text: action, onClick: () => goTo(C.steps.findIndex((s) => s.id === stepId)) }));
  }

  function regenerate() {
    state.doc.manual = false;
    prepareDocumentation();
    render({ focus: "#doc-text" });
    flash(".doc__paper");
  }

  async function copyDocumentation() {
    const text = state.doc.text;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; }
    } catch (_) { ok = false; }
    if (!ok) {
      const area = $("#doc-text");
      area.select();
      try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
      area.setSelectionRange(0, 0);
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

  const toastRegion = $("[data-toast-region]");
  let toastTimer = null;

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

  function flash(selector) {
    if (reduceMotion.matches) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove("is-flash");
    void el.offsetWidth;
    el.classList.add("is-flash");
  }

  function autosize(el) {
    if (!el || el.tagName !== "TEXTAREA") return;
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
    state = initialState();
    toastRegion.replaceChildren();
    render({ enter: true, focus: "#step-title" });
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
  window.addEventListener("resize", () => stageEl.querySelectorAll("textarea").forEach(autosize));

  state = initialState();
  render();
  // Höhe der Textfelder erst mit geladener Schrift endgültig messen.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => stageEl.querySelectorAll("textarea").forEach(autosize));
  }
})();

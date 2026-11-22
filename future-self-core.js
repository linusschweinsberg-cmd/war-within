/* Future Self: local, explicit rules. No network, no new progress score. */
(function (G) {
  'use strict';
  const MODES = ['confront', 'next', 'verdict'];
  const DEFAULTS = {v: 1, enabled: true, minimized: false, hints: false, lastMode: null, history: [], hintDay: null};
  const TEXT = {
    identity: 'Du willst mein Leben führen? Dann beginne heute, meine Entscheidungen zu treffen.',
    rest: 'Du hast Erholung eingeplant. Halte diese Entscheidung. Konsequenz heißt auch, einen Ruhetag einzuhalten.',
    energy: 'Du hast wenig Energie notiert. Verkleinere den nächsten Schritt oder ändere deinen Plan bewusst. Eine Einschränkung ist kein Beweis für mangelnden Willen.',
    missing: 'Ich kann dich nicht an einem Vorhaben messen, das du noch nicht festgelegt hast. Bestimme einen konkreten nächsten Schritt.',
    success: 'Deine erfassten Handlungen decken deinen bestätigten Tagesplan ab. Genau so werden aus Entscheidungen Standards. Prüfe, was du morgen wiederholst.'
  };
  const text = (x, max = 200) => typeof x === 'string' ? x.trim().slice(0, max) : '';
  function settings(S) {
    const p = S.life && S.life.futureSelf || {};
    return {...DEFAULTS, enabled: p.enabled !== false, minimized: p.minimized === true, hints: p.hints === true,
      lastMode: MODES.includes(p.lastMode) ? p.lastMode : null, history: Array.isArray(p.history) ? p.history.filter(x => x && MODES.includes(x.mode)).slice(-30).map(x => ({day: String(x.day).slice(0, 40), mode: x.mode, rule: String(x.rule || '').slice(0, 40)})) : [], hintDay: p.hintDay == null ? null : String(p.hintDay).slice(0, 40)};
  }
  function ensure(S) {
    if (!S.life) return S;
    S.life.futureSelf = settings(S);
    return S;
  }
  function configure(S, patch) {
    ensure(S); if (!S.life) return;
    const p = S.life.futureSelf;
    for (const k of ['enabled', 'minimized', 'hints']) if (typeof patch[k] === 'boolean') p[k] = patch[k];
  }
  function record(S, mode, rule, day) {
    if (!MODES.includes(mode)) return;
    ensure(S); if (!S.life) return;
    const p = S.life.futureSelf;
    p.lastMode = mode;
    // Store codes, never copies of private answers, messages or prompts.
    p.history = [...p.history, {day: String(day), mode, rule: String(rule).slice(0, 40)}].slice(-30);
  }
  function markHint(S, day) { ensure(S); if (S.life) S.life.futureSelf.hintDay = String(day); }
  function hint(S, day, choices) {
    const p = settings(S);
    if (!p.enabled || p.minimized || !p.hints || p.hintDay === String(day)) return null;
    if ((S.rest || []).includes(S.day)) return 'Heute zählt auch deine Entscheidung für Erholung.';
    return choices.length ? 'Dein nächster Schritt ist noch offen. Willst du ihn prüfen?' : null;
  }
  function context(S, opts) {
    const LC = opts.LC || G.LC, L = S.life || {}, d = L.d || 0, wk = LC.curWk(L);
    const goals = (L.goals || []).filter(g => g.status === 'active');
    const doneIds = new Set((S.missions || []).filter(m => opts.isDone(S, m)).map(m => m.id));
    const loggedIds = (L.log || []).filter(e => e.d === d && e.src !== 'migration').map(e => (L.actions || []).find(a => a.id === e.aid)?.missionId).filter(Boolean);
    const todayIds = new Set([...(S.missions || []).filter(m => S.done?.[m.id] && (m.freq === 'daily' || m.freq === 'multi')).map(m => m.id), ...loggedIds, ...Object.entries(S.ctime || {}).filter(([, rows]) => Array.isArray(rows) && rows.some(x => x.day === opts.day)).map(([id]) => id)]);
    const done = (S.missions || []).filter(m => todayIds.has(m.id));
    for (const e of (L.stdLog || []).filter(e => e.d === d)) {const std=(L.standards||{})[e.area];if(std&&std.std)done.push({id:'std:'+e.area, title:e.kind==='min'?'Minimum: '+text(std.min?.text||std.std.text,160):'Standard: '+text(std.std.text,160)})}
    const commitment=L.onboard&&L.onboard.commit;if(commitment&&!commitment.mid&&commitment.done&&!commitment.dropped&&commitment.doneD===d)done.push({id:'commit',title:'Erster Schritt: '+text(commitment.text,160)});
    const brief = S.brief && S.brief.k === opts.day && !S.brief.auto ? S.brief : null;
    const planned = brief ? [...new Set(brief.ids || [])].map(id => (S.missions || []).find(m => m.id === id)).filter(Boolean) : [];
    const daily = (L.daily || []).find(e => e.d === d);
    const energy = !!daily && (daily.obst || []).includes('energy'), strain = !!daily && daily.mood === 'hard';
    const rest = (S.rest || []).includes(S.day);
    const weeks = goals.map(g => ({g, w: LC.goalWeek(L, g, wk)}));
    const standards = Object.values(L.standards || {}).filter(s => s.std && s.status !== 'paused').map(s => ({s, w: LC.standardWeek(L, s.area, wk)}));
    return {LC, L, d, wk, goals, weeks, standards, done, daily, rest, energy, strain, planned, doneIds,
      todayIds, choices: opts.choices || [], next: (opts.choices || [])[0] || null, block: opts.block || null,
      values: (S.principles || []).map(p => text(p.n, 50)).filter(Boolean).slice(0, 4),
      why: text(L.why && L.why.text), identity: text(L.future && L.future.identity), vision: text(L.future && L.future.vision)};
  }
  function evidence(C) {
    return [
      ...C.weeks.map(({g, w}) => {const value=C.LC.goalNow(C.L,g);return {label:(C.LC.AREA[g.area]?.de||'Ziel')+' · '+text(g.title,100),value:`${w.done} von ${w.planned} Einheiten erfasst · diese Woche`+(value!=null?' · Ergebnis: '+C.LC.fmtV(g.metric,value):' · Ergebnis noch nicht gemessen')}}),
      ...C.standards.map(({s, w}) => ({label: (C.LC.AREA[s.area]?.de||'Standard')+' · '+text(s.std.text, 100), value: w ? `${w.done} von ${w.per} erfasst${w.min ? ' · '+w.min+'× Minimum' : ''} · diese Woche` : 'Noch keine auswertbare Woche'}))
    ].slice(0, 6);
  }
  function nextStep(C) {
    const x = C.next;
    if (!x) return {text: 'Lege eine konkrete Handlung fest, die du selbst beeinflussen kannst.', action: {kind: 'goal', label: 'Nächsten Schritt festlegen'}};
    return {text: `Nimm dir „${text(x.title, 180)}“ vor${x.minutes ? ' · '+x.minutes+' Minuten' : ''}. ${x.plan ? text(x.plan, 240) : 'Lege jetzt fest, wann du anfängst.'}`,
      action: {kind: 'item', item: x, label: 'Erledigung erfassen'}};
  }
  function respond(S, mode, opts) {
    if (!MODES.includes(mode)) mode = 'next';
    const C = context(S, opts), step = nextStep(C);
    const missing = [];
    if (!C.goals.length) missing.push('Kein aktives Ziel festgelegt.');
    if ((C.L.log||[]).some(e=>e.src==='migration')) missing.push('Übernommene ältere Einträge belegen keine heutige Erledigung.');
    if (!C.planned.length) missing.push('Kein ausdrücklich bestätigter Tagesplan. Vorschläge sind keine Zusagen.');
    if (C.planned.some(m => C.doneIds.has(m.id) && !C.todayIds.has(m.id))) missing.push('Einige Wochenaufgaben sind erledigt markiert, aber der genaue Erledigungstag ist unbekannt.');
    if (!C.daily) missing.push('Noch keine heutige Reflexion. Gründe für offene Aufgaben sind unbekannt.');
    if (C.goals.some(g => C.LC.goalNow(C.L, g) == null)) missing.push('Für mindestens ein Ziel fehlt ein Ergebnis-Messwert.');
    if (!C.goals.length && !C.standards.length && !C.done.length) missing.push('Keine Grundlage für ein Leistungsurteil.');
    const base = {mode, rule: 'next', title: 'Eine konkrete Entscheidung', message: step.text, action: step.action,
      evidence: evidence(C), missing, done: C.done.map(m => text(m.title, 160)), open: C.planned.filter(m => !C.doneIds.has(m.id)).map(m => text(m.title, 160)),
      suggestions: C.choices.map(x => text(x.title, 160)), values: C.values, why: C.why, identity: C.identity, vision: C.vision,
      loop: C.LC.LOOP.find(x => x.id === opts.loop)?.de || 'Verantwortung', demo: !S.profile || S.profile.mode === 'demo'};
    if (C.rest || C.energy || C.strain) return {...base, rule: C.rest ? 'rest' : C.energy ? 'energy' : 'hard-day', title: C.rest ? 'Halte deinen Ruhetag ein' : 'Passe den Anspruch an deine Lage an',
      message: C.rest ? TEXT.rest : C.energy ? TEXT.energy : 'Du hast deinen Tag als schwierig beschrieben. Prüfe, was heute machbar ist, und passe den nächsten Schritt bewusst an.', action: {kind: 'review', label: 'Lage und Plan reflektieren'}, tomorrow: 'Plane die nächste machbare Handlung. Ruhe und reale Einschränkungen sind Teil dieser Planung.'};
    const allPlannedDone = C.planned.length > 0 && C.planned.every(m => C.todayIds.has(m.id));
    if (mode === 'verdict') {
      const obstacle = C.daily && (C.daily.obst || [])[0];
      const tomorrow = obstacle === 'time' ? 'Reserviere morgen zuerst ein realistisches Zeitfenster für eine wichtige Handlung.' : obstacle === 'distract' ? 'Lege morgen den Startauslöser fest und räume eine bekannte Ablenkung aus dem Weg.' : 'Bestimme morgen eine wichtigste Handlung und ein konkretes Zeitfenster dafür.';
      return {...base, rule: 'verdict', title: 'Mein Tagesurteil', message: allPlannedDone ? TEXT.success : C.done.length ? 'Im aktuellen Spieltag sind Handlungen erfasst. Sie zählen. Was offen ist, verlangt eine Entscheidung, keine Selbstabwertung.' : 'Für den aktuellen Spieltag sind noch keine erledigten Handlungen erfasst. Das sagt nichts darüber aus, was du außerhalb der App getan hast.',
        tomorrow, action: {kind: 'review', label: 'Reflexion und Morgenplanung öffnen'}};
    }
    if (allPlannedDone) return {...base, rule: 'kept', title: 'Deine Zusage ist umgesetzt', message: TEXT.success, action: {kind: 'review', label: 'Nächsten Tag vorbereiten'}};
    if (mode === 'confront') {
      if (C.block && C.block.state === 'past') return {...base, rule: 'past', title: 'Das Zeitfenster ist vorbei', message: `Du hattest „${text(C.block.m.title, 160)}“ eingeplant. Das Fenster ist vorbei, die Aufgabe ist noch offen. Entscheide: neu einplanen, verkleinern oder das Vorhaben bewusst ändern. Warum es offen ist, weiß ich nicht.`, action: {kind: 'plan', label: 'Zeitplan bewusst anpassen'}};
      const gap = C.weeks.find(({w}) => w.planned > w.done);
      if (gap) {const candidate=C.choices.find(x => x.g && x.g.id===gap.g.id);return {...base, rule: 'weekly-gap', title: 'Anspruch und Einträge', message: `${base.demo?'Im Beispiel ist das Ziel':'Dein eingetragenes Ziel lautet'} „${text(gap.g.title, 160)}“. Diese Woche sind ${gap.w.done} von ${gap.w.planned} geplanten Einheiten erfasst. Das ist ein Zwischenstand, kein Urteil über deinen Einsatz. Wenn das weiter dein Ziel ist, entscheide jetzt über die nächste Einheit. Wenn der Plan nicht passt, ändere ihn bewusst.`, next: candidate ? `Plane die nächste Einheit: „${text(candidate.title,180)}“.` : 'Bereite die nächste Einheit vor. Du musst heute keine zusätzliche Einheit erzwingen.', action: candidate ? {kind:'item',item:candidate,label:'Erledigung erfassen'} : {kind:'review',label:'Nächste Einheit vorbereiten'}};}
      if (!C.next) return {...base, rule: 'missing', title: 'Woran soll ich dich messen?', message: TEXT.missing};
      return {...base, rule: 'chosen', title: 'Aus deiner Absicht wird eine Entscheidung', message: `„${text(C.next.title, 180)}“ ist noch offen. Du musst mir nichts versprechen. Lege einen machbaren Anfang fest und handle danach. Ich kenne den Grund für den offenen Eintrag nicht.`};
    }
    if (!C.next) return {...base, rule: 'missing', title: 'Ein eigener Schritt zuerst', message: TEXT.missing};
    return {...base, rule: 'next', title: 'Das würde ich jetzt entscheiden', message: step.text};
  }
  function duelLine(S) {
    if ((S.rest || []).includes(S.day)) return 'Ein geplanter Ruhetag gehört zu deinem Maßstab. Der Vergleich ist nur ein Modell.';
    return 'Du vergleichst dokumentierte Handlungen mit einer Plan-Simulation. Entscheide über deinen nächsten machbaren Schritt.';
  }
  G.FS = {MODES, TEXT, settings, ensure, configure, record, markHint, hint, context, respond, duelLine};
})(typeof window !== 'undefined' ? window : globalThis);

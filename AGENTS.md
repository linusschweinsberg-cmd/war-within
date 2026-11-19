# THE WAR WITHIN – Projektkontext (für Claude Code / Codex)

Mobile-first Selbstverbesserungs-Spiel, Sprache: Deutsch. Ein Prototyp als einzelne Datei `index.html`.

## Technik
- Single-file: React 18 (UMD via CDN), Tailwind (CDN), htm (Tagged Templates: html`...`, Komponenten <${Comp}/>, Ende <//>).
- State: `useState(loadState)`, `upd(fn)`, `derive(S)`; Spielstand in localStorage: `war_within_v5` (Gast/Demo) bzw. `war_within_acc_v1` (Demo-Konto).
- Einstieg: `Root` → `AuthFlow` (Willkommen/Registrieren/Login) → `Onboarding` (9 Schritte, `buildState(ob)` erzeugt den Spielstand) → `App`. Sitzung und Onboarding-Fortschritt in `war_within_auth_v1`, niemals Passwörter.
- Auth läuft über `authApi` (Demo). Für Supabase nur dessen Funktionen ersetzen; Profil liegt in `S.profile`, Konto-Bereich im Sheet `account`.
- Theme über `data-theme` CSS-Variablen (dunkel Standard).
- Alles liegt in einem <script>-Block, Abschnitte: Daten (CORE, M0, SEASON_DEF, Punkte-Katalog), UI (Ring, Radar, LifeTree), Start/Aufgaben/Duell, Liga, Stats, Sheets, App.

## Zusammenarbeit Claude Code + Codex
- Diese Datei ist die gemeinsame Quelle für beide Agenten (`CLAUDE.md` verweist nur hierher). Regeln nur hier ändern.
- Nie direkt auf `main` arbeiten. Branches: `claude/<thema>` bzw. `codex/<thema>`, über Pull Request nach `main`.
- Vor Arbeitsbeginn `git pull` auf `main`, Branch davon abzweigen. Kleine, beschreibende Commits.
- Nicht parallel an denselben Dateien arbeiten; laufende Aufgaben unten unter „In Arbeit“ eintragen (wer, Branch, betroffene Dateien) und nach dem Merge wieder entfernen.
- Der jeweils andere Agent reviewt PRs, bevor gemergt wird.
- Bei Änderungen an `index.html` o. ä. die Cache-Version in `sw.js` erhöhen.

### In Arbeit
- Codex: `codex/weekly-snapshots` – `index.html`, `sw.js`; echte Wochenabschlüsse und saisongetrennte Tagesstände. Review durch Claude ausstehend.
- Claude: `claude/onboarding` (baut auf `codex/weekly-snapshots` auf) – `index.html`, `sw.js`, `AGENTS.md`; Konto-UI, Onboarding, Profilbereich. Review durch Codex ausstehend.
- Claude: `claude/ui-polish` (baut auf `claude/onboarding` auf) – `index.html`, `sw.js`; visuelles Redesign (Materialien, Navigation, Start-Hero). Review durch Codex ausstehend.
- Claude: `claude/perfect-day` (baut auf `claude/ui-polish` auf) – `index.html`, `sw.js`; Perfekter Tag, Partikel, Streak-Flammen. Review durch Codex ausstehend.

## PWA
- `manifest.webmanifest`, `sw.js` (Cache `ww-v5` – bei jeder Änderung Version erhöhen), `icons/`.
- Lokal testen: `node serve.js` → http://localhost:5173. Installation auf dem Handy braucht HTTPS-Hosting.

## Konzepte
- Missionen mit Punkte-Katalog: Basis × (1 + Erfolg + Konstanz + Messwert) × Saisonthema, begrenzt durch Wochenlimits.
- Fünf Kernbereiche in Health / Personal development, Liga, Duell gegen den „Nemesis“, Evaluation nach Jocko Willinks „The Code“ (nur eigene Formulierungen, keine Zitate).
- Lebensbaum (`LifeTree`): ein Ast pro Lebensbereich, Wachstum = Bereichswerte.
- Gesundheitsdaten-Sync und Liga-Mitglieder sind simulierte Demo-Daten.

## Nächste Schritte
- Wochen-Snapshots umgesetzt; Review durch Claude ausstehend.
- Datei in Module aufteilen (Vite + React), echtes Backend für Liga.

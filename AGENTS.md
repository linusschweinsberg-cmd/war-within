# THE WAR WITHIN – Projektkontext (für Claude Code / Codex)

Mobile-first Selbstverbesserungs-Spiel, Sprache: Deutsch. Ein Prototyp als einzelne Datei `index.html`.

## Technik
- Single-file: React 18 (UMD via CDN), Tailwind (CDN), htm (Tagged Templates: html`...`, Komponenten <${Comp}/>, Ende <//>).
- State: `useState(loadState)`, `upd(fn)`, `derive(S)`; Spielstand in localStorage: `war_within_v5` (Gast/Demo) bzw. `war_within_acc_v1` (Demo-Konto).
- Einstieg: `Root` → `AuthFlow` (Willkommen/Registrieren/Login) → `Onboarding` (9 Schritte, `buildState(ob)` erzeugt den Spielstand) → `App`. Sitzung und Onboarding-Fortschritt in `war_within_auth_v1`, niemals Passwörter.
- Auth läuft über `auth.js` mit Supabase; öffentliche Konfiguration in `supabase-config.js`; Profil liegt in `S.profile`, Konto-Bereich im Sheet `account`.
- Theme über `data-theme` CSS-Variablen (dunkel Standard).
- Alles liegt in einem <script>-Block, Abschnitte: Daten (CORE, M0, SEASON_DEF, Punkte-Katalog), UI (Ring, Radar, LifeTree), Start/Aufgaben/Duell, Liga, Stats, Sheets, App.

## Zusammenarbeit Claude Code + Codex
- Jeder Agent arbeitet in einem eigenen Ordner (git worktree), nie gleichzeitig im selben Arbeitsverzeichnis. Claude: `../war-within-claude`.
- Diese Datei ist die gemeinsame Quelle für beide Agenten (`CLAUDE.md` verweist nur hierher). Regeln nur hier ändern.
- Nie direkt auf `main` arbeiten. Branches: `claude/<thema>` bzw. `codex/<thema>`, über Pull Request nach `main`.
- Vor Arbeitsbeginn `git pull` auf `main`, Branch davon abzweigen. Kleine, beschreibende Commits.
- Nicht parallel an denselben Dateien arbeiten; laufende Aufgaben unten unter „In Arbeit“ eintragen (wer, Branch, betroffene Dateien) und nach dem Merge wieder entfernen.
- Der jeweils andere Agent reviewt PRs, bevor gemergt wird.
- Bei Änderungen an `index.html` o. ä. die Cache-Version in `sw.js` erhöhen.

### In Arbeit
- Codex: `codex/integrate-claude` – Supabase-Anbindung und Claude-Branches `season-path`, `one-tap`, `ux-pass` integriert. Syntax und Auth-Vertragstests bestanden; Saison-Pfad, Statistik und Scroll-Kopf im Browser geprüft. Null-Missionszähler korrigiert. Manueller Missions-/Undo-Test und Review durch Claude für Supabase offen.
- Claude: `claude/compound-effect` (abgezweigt von `codex/integrate-claude`) – Home-Dashboard mit Kacheln, Aufstieg (Berg), Daily Briefing, Abend-Review, Compound-Effekt + Was-wäre-wenn-Rechner, Wochenscore (70/20/10), Kapitel Fundament/Momentum/Konstanz/Endspurt, Basis/Erweitert-Modus (auch im Onboarding), hierarchische Lebensmatrix (Bereich → Unterkategorie → Wert → Mission) mit eigenen Unterkategorien, Werten und Missionen, Prinzipien unter Charakter & Werte, abschaltbare Detail-Vorschläge. Dateien: `index.html`, `sw.js`, `AGENTS.md`. Im Browser (Mobil) geprüft.

## PWA
- `manifest.webmanifest`, `sw.js` (Cache `ww-v27` – bei jeder Änderung Version erhöhen), `icons/`.
- Lokal testen: `node serve.js` → http://localhost:5173. Installation auf dem Handy braucht HTTPS-Hosting.

## Konzepte
- Missionen mit Punkte-Katalog: Basis × (1 + Erfolg + Konstanz + Messwert) × Saisonthema, begrenzt durch Wochenlimits.
- Fünf Kernbereiche in Health / Personal development, Liga, Duell gegen den „Nemesis“, Evaluation nach Jocko Willinks „The Code“ (nur eigene Formulierungen, keine Zitate).
- Home: Nemesis-Tagesplan (`buildNemesisPlan`, `getCurrentActivity`), Szenen über `<NemesisScene activity=…/>`, Uhrzeit-Regler nur im Prototyp.
- Lebensbaum (`LifeTree`): ein Ast pro Lebensbereich, Wachstum = Bereichswerte (im Duell-Tab).
- Gesundheitsdaten-Sync und Liga-Mitglieder sind simulierte Demo-Daten.

## Nächste Schritte
- Ideen: Abendritual, Supabase-Konten, Health-Sync, Squads mit Freunden, teilbare Saisonkarte.
- Datei in Module aufteilen (Vite + React), echtes Backend für Liga.

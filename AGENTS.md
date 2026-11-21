# THE WAR WITHIN – Projektkontext (für Claude Code / Codex)

Mobile-first Selbstverbesserungs-Spiel, Sprache: Deutsch. Ein Prototyp als einzelne Datei `index.html`.

## Technik
- Single-file: React 18 (UMD via CDN), Tailwind (CDN), htm (Tagged Templates: html`...`, Komponenten <${Comp}/>, Ende <//>).
- State: `useState(loadState)`, `upd(fn)`, `derive(S)`; Spielstand in localStorage: `war_within_v5` (Gast/Demo) bzw. `war_within_acc_v1_<Supabase-Nutzer-ID>` (E-Mail-Konto).
- Einstieg: `Root` → `AuthFlow` (Willkommen/Registrieren/Login) → `Onboarding` (8 Schritte: Intro, Profil, Kompass, Warum, Bereiche, Ziel, Plan, Briefing; `buildState(ob)` erzeugt den Spielstand) → `App`. Sitzung und Onboarding-Fortschritt in `war_within_auth_v1`, niemals Passwörter.
- Auth läuft über `auth.js` mit Supabase; öffentliche Konfiguration in `supabase-config.js`; Profil liegt in `S.profile`, Konto-Bereich im Sheet `account`.
- Theme über `data-theme` (dunkel/hell) und `data-skin` (`antik` Standard, `violet` wählbar) als CSS-Variablen. Farbrollen: Rost = du/Handeln, Bronze = Ergebnis/Belohnung, Oliv = erledigt, Stahl = Nemesis. Keine festen Hex-Farben im Code, nur Variablen.
- Life-OS-Logik (Ziele, Messwerte, Handlungen, Rückblicke, Experimente, Migration) liegt in `life-core.js` (`window.LC`), Daten in `S.life`. Details: `docs/LIFE-OS.md`.
- Wisdom of the Warrior (Bibliothek mit 72 Impulsen, regelbasierte Auswahl, Favoriten) liegt in `wisdom-core.js` (`window.WC`), Daten in `S.wisdom`. Details: `docs/WISDOM.md`.
- Der Rest liegt in einem <script>-Block, Abschnitte: Daten (CORE, M0, SEASON_DEF, Punkte-Katalog), UI (Ring, Radar, LifeTree), Start/Aufgaben/Duell, Liga, Stats, Sheets, App.

## Zusammenarbeit Claude Code + Codex
- Jeder Agent arbeitet in einem eigenen Ordner (git worktree), nie gleichzeitig im selben Arbeitsverzeichnis. Claude: `../war-within-claude`.
- Diese Datei ist die gemeinsame Quelle für beide Agenten (`CLAUDE.md` verweist nur hierher). Regeln nur hier ändern.
- Nie direkt auf `main` arbeiten. Branches: `claude/<thema>` bzw. `codex/<thema>`, über Pull Request nach `main`.
- Vor Arbeitsbeginn `git pull` auf `main`, Branch davon abzweigen. Kleine, beschreibende Commits.
- Nicht parallel an denselben Dateien arbeiten; laufende Aufgaben unten unter „In Arbeit“ eintragen (wer, Branch, betroffene Dateien) und nach dem Merge wieder entfernen.
- Der jeweils andere Agent reviewt PRs, bevor gemergt wird.
- Bei Änderungen an `index.html` o. ä. die Cache-Version in `sw.js` erhöhen.

### In Arbeit
- Claude: Wisdom of the Warrior, Branch `claude/wisdom` (PR offen, Review durch Codex). Dateien: `wisdom-core.js` (neu), `index.html`, `sw.js`, `tests/wisdom-core.cjs` (neu), `tests/release-smoke.cjs` (lädt wisdom-core.js), `docs/WISDOM.md` (neu).

### Letzte Integration
- Life OS: Claude-Stand `19a47de` durch Codex geprüft und zur Veröffentlichung übernommen. Tests: life-core, release-smoke, auth-contract bestanden. Browser: migrierte Startansicht, Lebenstempel und Reflexion geprüft.
- Claudes Stand `03c9603` (Tagesplan, Nemesis, Lernvorschläge) samt Supabase-Anmeldung über PR #9 integriert. Codex hat Claudes Änderungen geprüft.
- Prüfungen: `node tests/release-smoke.cjs`, `node tests/auth-contract.cjs`; Start, Nemesis, Aufgaben und Tageskalender im Browser. Beispielhistorie bei bestehenden echten Konten entfernt; Lernen verwendet unterschiedliche Erledigungstage.
- Supabase Site URL auf die bestehende öffentliche GitHub-Pages-Adresse gesetzt; localhost bleibt als Test-Redirect erlaubt. Vollständiger Konto-/E-Mail-Reset-Durchlauf weiterhin manuell zu prüfen.

## PWA
- `manifest.webmanifest`, `sw.js` (Cache `ww-v38` – bei jeder Änderung Version erhöhen), `icons/`.
- Lokal testen: `node serve.js` → http://localhost:5173. Tests: `node tests/life-core.cjs`, `node tests/wisdom-core.cjs`, `node tests/release-smoke.cjs`, `node tests/auth-contract.cjs`. Installation auf dem Handy braucht HTTPS-Hosting.

## Konzepte
- Navigation: Heute (Hauptziel, nächste Handlung, Success Loop, Prioritäten, Arena optional), Mein Leben (Werte, Warum, vier Bereiche, Ziele), Fortschritt (Ergebnisse, Umsetzung, Experimente, Wirkung), Reflexion (Check-in, Wochenrückblick, Experimente). Aufgaben, Liga und Duell sind Unterseiten.
- Ergebnis (Messgröße eines Ziels) und Prozess (Handlungen/Missionen) sind getrennt; Punkte gibt es nur für Handlungen.
- Life Temple (Mein Leben): vier Säulen mit 5 Stufen aus gedeckelten Bauregeln (`TEMPLE_RULES` in `life-core.js`), eigene 12-Wochen-Saison, Galerie früherer Saisons; Details in `docs/LIFE-OS.md`.
- Wisdom of the Warrior: höchstens ein kurzer Impuls pro Stelle und Tag (Heute, Daily Debrief/Reflexion, Fortschritt bei Meilensteinen, Mein Leben bei neuer Tempel-Saison), nie als Pop-up, schließbar und in den Optionen abschaltbar; Wisdom Codex mit Favoriten. Lesen bringt keine Punkte und keinen Tempel-Fortschritt.
- Daily Debrief (täglich, ≤ 30 Sek.), Wochenrückblick mit erkannten Mustern (`debriefPatterns`), Monats-Check alle 4 Wochen.
- Wochenrückblick: Diagnose nach festen Regeln → Hindernis → Vorschlag → Experiment mit Kriterium → Prüfung im nächsten Rückblick. Fokusmodus blendet Liga, Nemesis und Punkte aus.
- Missionen mit Punkte-Katalog: Basis × (1 + Erfolg + Konstanz + Messwert) × Saisonthema, begrenzt durch Wochenlimits.
- Fünf Kernbereiche in Health / Personal development, Liga, Duell gegen den „Nemesis“, Evaluation nach Jocko Willinks „The Code“ (nur eigene Formulierungen, keine Zitate).
- Home: Nemesis-Tagesplan (`buildNemesisPlan`, `getCurrentActivity`), Szenen über `<NemesisScene activity=…/>`, Uhrzeit-Regler nur im Prototyp.
- Lebensbaum (`LifeTree`): ein Ast pro Lebensbereich, Wachstum = Bereichswerte (im Duell-Tab).
- Gesundheitsdaten-Sync und Liga-Mitglieder sind simulierte Demo-Daten.

## Nächste Schritte
- Ideen: Abendritual, Supabase-Konten, Health-Sync, Squads mit Freunden, teilbare Saisonkarte.
- Datei in Module aufteilen (Vite + React), echtes Backend für Liga.

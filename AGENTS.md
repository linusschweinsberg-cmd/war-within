# THE WAR WITHIN – Projektkontext (für Claude Code / Codex)

Mobile-first Selbstverbesserungs-Spiel, Sprache: Deutsch. Ein Prototyp als einzelne Datei `index.html`.

## Technik
- Single-file: React 18 (UMD via CDN), Tailwind (CDN), htm (Tagged Templates: html`...`, Komponenten <${Comp}/>, Ende <//>).
- State: `useState(loadState)`, `upd(fn)`, `derive(S)`; Spielstand in localStorage: `war_within_v5` (Gast/Demo) bzw. `war_within_acc_v1_<Supabase-Nutzer-ID>` (E-Mail-Konto).
- Einstieg: `Root` → `AuthFlow` (Willkommen/Registrieren/Login) → `Onboarding` (First-Time-User-Experience: Einstieg → Selbsterkenntnis → Eigenverantwortung → Standards → Handeln (Success Loop, Ziel, erstes Commitment); jede Pflichtangabe überspringbar, Pause und Fortsetzen; Zustandslogik und Datenstruktur in `docs/FTUE.md`, Screens in `docs/ONBOARDING.md`; `buildState(ob)` erzeugt den Spielstand) → `App`. Sitzung und Onboarding-Fortschritt in `war_within_auth_v1`, niemals Passwörter.
- Auth läuft über `auth.js` mit Supabase; öffentliche Konfiguration in `supabase-config.js`; Profil liegt in `S.profile`, Konto-Bereich im Sheet `account`.
- Theme über `data-theme` (dunkel/hell) und `data-skin` (`antik` Standard, `violet` wählbar) als CSS-Variablen. Design „Antik“ folgt dem Designkonzept (Nov 2026, Tokens im CSS-Block „Designkonzept“): Hintergrund #0E0C0B bzw. Pergament, Knochen/Grau als Text, ein Akzent Terrakotta = Handlung/Fortschritt (auch Haken der Checkboxen), Gold = Auszeichnung (z. B. Balken bei 100 %), Oliv = Erledigt-Hinweis/Rekord, Stahl = Nemesis. Schriften: Oswald (Titel, Versalien), Inter (Text), Cinzel (Zitate, Wortmarke). Karten matt mit 1 px Kontur, Radius 16; flache Tab-Leiste mit Unterstrich; Aufgabenzeile mit eckiger Checkbox rechts. Keine festen Hex-Farben im Code, nur Variablen.
- Life Audit (`S.life.audit`) und „Wer könntest du werden?“ (`S.life.future`): Freitexte sind privat und bleiben auf dem Gerät. Eine Synchronisation oder Auswertung darf nur `LC.auditForSync`/`LC.auditSummary` bzw. `LC.futureForSync` nutzen (Zahlen, Codes, Struktur). Gilt auch für den geplanten Cloud-Sync von `game_states`.
- Rückgängig: Abhaken, Standards (Erledigt/Minimum), erster Schritt und Import zeigen 5 Sekunden „Rückgängig“ (Snapshot des Spielstands, `c.restore`).
- Sicherung: Optionen › „Daten sichern“ exportiert/importiert den Spielstand als JSON (enthält private Texte, bleibt beim Nutzer). Import prüft `v===5`, ersetzt erst nach Bestätigung und ist rückgängig machbar.
- Erste Woche nach dem Onboarding: `life.fund.ob.calmUntil` (7 Tage) blendet Punkte, Liga, Nemesis und Duell aus (über `focusMode`); „Jetzt alles zeigen“ oder Fokusmodus aus beendet das vorzeitig.
- Service Worker: Seite und eigene `.js`-Dateien werden zuerst aus dem Netz geladen, CDN-Dateien zuerst aus dem Cache. Eigene Skript-URLs tragen zusätzlich die Release-Version, damit auch ein zuvor installierter cache-first-Worker neue Abhängigkeiten lädt. Beim Release URL-Versionen und APP_SHELL zusammen mit VERSION erhöhen.
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
- Codex: Zukunfts-Ich, Branch `codex/future-self` (auf `codex/today-focus`, PR #21). Dateien: `future-self-core.js` (neu), `index.html`, `sw.js`, `tests/`, `docs/FUTURE-SELF.md`. Claude reviewt vor Merge.
- Codex: Vereinfachte Heute-Ansicht, Branch `codex/today-focus` (auf `codex/calendar-reliability`, PR #20). Dateien: `index.html`, `sw.js`, `tests/`, `docs/TODAY.md`. Claude reviewt vor Merge.
- Codex: Kalenderzuverlässigkeit, Branch `codex/calendar-reliability`. Dateien: `index.html`, `life-core.js`, `wisdom-core.js`, `sw.js`, `tests/`, `docs/CALENDAR.md`. Claude reviewt vor Merge.

### Letzte Integration
- Claude-Stand `622537f` einschließlich UX und Datensicherheit über PR #18 übernommen. Review-Korrekturen: Upgrade-URLs, Konto-Onboarding-Fortsetzen, private Textkopien löschen, vollständige Abendritual-Kandidaten und Farbrollen. Alle sieben Tests bestanden; Browser-Upgrade, vier Darstellungen und Rückgängig geprüft. Keine Supabase-Einstellungen geändert.
- Life OS: Claude-Stand `19a47de` durch Codex geprüft und zur Veröffentlichung übernommen. Tests: life-core, release-smoke, auth-contract bestanden. Browser: migrierte Startansicht, Lebenstempel und Reflexion geprüft.
- Claudes Stand `03c9603` (Tagesplan, Nemesis, Lernvorschläge) samt Supabase-Anmeldung über PR #9 integriert. Codex hat Claudes Änderungen geprüft.
- Prüfungen: `node tests/release-smoke.cjs`, `node tests/auth-contract.cjs`; Start, Nemesis, Aufgaben und Tageskalender im Browser. Beispielhistorie bei bestehenden echten Konten entfernt; Lernen verwendet unterschiedliche Erledigungstage.
- Supabase Site URL auf die bestehende öffentliche GitHub-Pages-Adresse gesetzt; localhost bleibt als Test-Redirect erlaubt. Vollständiger Konto-/E-Mail-Reset-Durchlauf weiterhin manuell zu prüfen.

## PWA
- `manifest.webmanifest`, `sw.js` (Cache `ww-v58` – bei jeder Änderung Version erhöhen), `icons/`.
- Lokal testen: `node serve.js` → http://localhost:5173. Tests: `node tests/life-core.cjs`, `node tests/wisdom-core.cjs`, `node tests/release-smoke.cjs`, `node tests/auth-contract.cjs`, `node tests/ftue-flows.cjs` (Abläufe: neu, vollständig, übersprungen, zurückkehrend). Installation auf dem Handy braucht HTTPS-Hosting.

## Produktprinzip (verbindlich)
Erst Selbsterkenntnis. Dann Eigenverantwortung. Dann persönliche Standards. Und schließlich konsequentes Handeln.
- Onboarding, Fundament und Einladungen folgen dieser Reihenfolge (Details: `docs/FTUE.md`).
- Neue Funktionen ordnen sich einer der vier Stufen zu. Jede Stufe nutzt, was die vorige ergeben hat.
- Abkürzungen wie die Kurzform sind erlaubt. Übersprungene Stufen werden aber im Fundament in dieser Reihenfolge nachgeholt.

## Konzepte
- Navigation (Tab-Leiste, fünf Einträge, Beschriftung deutsch): Heute (`home`: eine Hauptaufgabe und höchstens zwei weitere Vorschläge, nächster fest eingeplanter Zeitblock mit direktem Tagesplan-Zugang, Alle Aufgaben und Reflexion; Standards, Impulse, Wirkungsmodell und optionaler Wettbewerb eingeklappt; Details in `docs/TODAY.md`), Aufgaben (`tasks`: Datum, Tagesfortschritt, Bereichs-Chips; im Fokus zuerst Ziel-Handlungen, drei offene sichtbar, Rest und Erledigtes eingeklappt; Tagesplan über das Kalender-Symbol), Mein Leben (`life`: Tempel mit Säulen-Details erst nach Antippen, Fundament (enthält Audit, Zukunft, Standards), vier Lebensbereiche als Kacheln Gesundheit/Beziehungen/Finanzen/Persönliche Weiterentwicklung, Werte, Warum, Ziele), Fortschritt (`stats`: Saison-Fresko, Kompass des größten Bedarfs, darunter Details Ergebnisse/Umsetzung/Tempel/Experimente/Wirkung), Duell (`solo`: „Nemesis · heute“ mit Arena, Tauziehen, Runden nach Tageszeit, Tagesverlauf; „Schatten · Saison“ mit Saisonvergleich; im Fokusmodus ausgeblendet). Reflexion (`reflect`: Check-in, Wochenrückblick, Experimente) ist Unterseite von Heute (Reflexions-Zeile, Optionen); Liga ist Unterseite von Fortschritt. Bereichsnamen in der Oberfläche immer deutsch (`LC.AREA[id].de`).
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

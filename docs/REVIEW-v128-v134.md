# Gegenreview ww-v128 bis ww-v134 – 27.11.2026

Geprüfte Merges: `1f6bb10`, `d4ed468`, `4a95d3e`, `25d16cc`, `0a47cd7`. Korrekturen und Einladungsabgleich liegen auf `codex/friends-invitation-flow`, Zielrelease ww-v135. Kein Merge nach main, kein Deployment.

## Befunde und Korrekturen

- P2: Gültiges JSON mit beschädigten Ereignissen, etwa `ev: {"tab:home": null}`, wurde von UC.load akzeptiert. UC.summary und damit das Öffnen der Optionen stürzten ab. `uhit` schützte nur das Zählen. Laden validiert jetzt die Struktur und übernimmt ausschließlich Ereigniscodes, Datumskennungen und numerische Zähler; Zusatzfelder werden verworfen. Gesunde Nutzungsdaten bleiben erhalten. Regression in `tests/usage-core.cjs`.
- P2: Minimum und spätere volle Ausführung eines Standards stehen als zwei Einträge in life.stdLog. progressData zählte dadurch zwei Handlungen am selben Tag. Es zählt jetzt je Bereich und Tag einen Standard. Protokolle, Wertung und Wochenberechnung bleiben erhalten. Regression in `tests/progress-charts.cjs`.
- P3: „Bereit“ öffnete die Kurzform, kündigte aber noch 15 Minuten an. Text auf etwa zwei Minuten und spätere Vertiefung im Fundament korrigiert. Keine Änderung des Ablaufs.

## Weitere Prüfpunkte

- Keine Löschmigration durch das Ausblenden von Fähigkeiten, Werte-Abhakchips oder Wisdom. Laden, LC.ensureLife, PC.ensure, WC.ensure, derive und JSON-Rundlauf erhalten skills, principles[].acts sowie Wisdom-Verlauf und Favoriten in Basis und Erweitert. Zusätzliche Regression in `tests/ftue-flows.cjs`.
- usage-core besitzt den separaten Schlüssel war_within_usage_v1, keine Netzaufrufe und keine Aufnahme in den Spielstand. Sicherung exportiert ausschließlich state:S. Die uhit-Aufrufe verwenden feste Codes bzw. interne Tab-/Sheet-IDs und fangen Fehler ab. Freitexte werden an diesen Aufrufstellen nicht übergeben.
- Kurzform ist als ausdrückliche Ausnahme vom Produktprinzip zulässig. Die ausgelassenen Stufen bleiben offen; Fundament und Einladungen holen sie nach Stufen geordnet nach. Der bestehende FTUE-Test prüft insbesondere die erste Audit-Einladung nach dem Einstieg.
- Tagesbalken verwenden life.log und life.stdLog; Wochen und Bereiche verwenden LC.templeWeek. Zielmesswerte in SimpleProgress kommen weiterhin aus den echten Zielmessreihen über LC.goalProgress/goalNow, nicht aus Aktivitätszählungen oder Punkten.
- Arena: Gast/Beispiel → Liga erstellen → Kontoauswahl im Browser geprüft. Sechs Regeln einschließlich „Privat“ erhalten; Formular enthält weiterhin die Angaben zu sichtbaren Arenadaten und privaten Texten.
- Die bestehende Einladungsarbeit wurde gesichert und origin/main bis 0a47cd7 in den Branch übernommen. arena-ui.js wurde automatisch konfliktfrei zusammengeführt und danach geprüft. Der Code bleibt sieben Tage separat lokal erhalten, auch bei Bestätigungsrückkehr ohne arena-Parameter. Öffnen im Fokusmodus erfolgt bewusst. Löschen entfernt nur den Einladungscode aus URL und Speicher. Automatisierte Tests ersetzen keinen echten Mail-/Mehrgeräte-Test.

## Validierung

Lokaler Prüfserver aus diesem Checkout: localhost:5218. Browser: 375×812 und 390×844, Antik dunkel und hell; Heute, Fortschritt/Basis, Mein Leben/Tempel, Arena und Optionen geprüft. Zusätzlich Fortschritt/Erweitert und Gast-Kontoübergang. Keine erfassten Konsolenfehler, geprüfte Ansichten ohne horizontalen Seitenüberlauf. Viewport danach zurückgesetzt. Keine Produktionsdaten verwendet.

Alle 40 beendbaren tests/*.cjs ohne *-preview-server bestanden nach den Korrekturen (einschließlich Arena-SQL/RLS). Neuer echter Kontodurchlauf offen: SMTP-Zustellung und Teilnehmerzugriff auf Bestätigungsmails sowie zweites Gerät fehlen. Details in FRIENDS-TEST.md.

# Decision Impact Engine (Phase 0–1)

Leitsatz: Die langfristigen Folgen heutiger Entscheidungen heute sichtbar machen. Weniger Tracking, mehr Leben.
Branch `claude/hauptschlacht`, Release ww-v76. Phasen 2–10 sind bewusst nicht begonnen.

## Phase 0 – Audit und Plan

- **Wiederverwendet:** Ziele (`S.life.goals`, Messgröße `metric` mit Ziel, Richtung, Startwert), Messwerte (`S.life.meas`, Ergebnis), Handlungen mit Wochenplan (`S.life.actions`, `plannedAt`) und erledigte Einheiten (`S.life.log`, Prozess), Kalenderwochen (`wkOf`/`curWk`), bewusste Pausen (`S.rest`) und Debrief-Erholung (`daily[].recover`). Das Zukunfts-Ich (`future-self-core.js`) bleibt unverändert. Der Compound-Effekt auf Heute nutzt dieselben echten Zählungen.
- **Minimales neues Datenmodell:** nur für Finanzziele das optionale Feld `goal.proj = {rate: € pro Monat, interest: % pro Jahr}`, gesetzt über `PJ.setPlan`. Ein leeres Feld entfernt es. Keine Formatänderung: der Spielstand bleibt `v:5`, alte Stände laden ohne Migration, Export/Import übernimmt das Feld automatisch.
- **Migrationsrisiko:** keins für bestehende Daten. Fehlende Angaben führen zu „Noch nicht berechenbar“ mit dem fehlenden Punkt, nie zu Platzhalterzahlen.

## Phase 1 – Projection Engine (`projection-core.js`, `window.PJ`)

Deterministisch (keine Uhrzeit, kein Zufall, kein Netz), rein lesend bis auf `setPlan`. Zieltyp über `PJ.typeOf(goal)`: Finanzen (`wealth` mit Einheit €), Fitness (`health`), Lernen (`growth`). Andere Bereiche werden nicht projiziert.

- **Finanzen:** Stand (letzter Messwert, sonst Startwert), Ziel und Rate führen zum Zielmonat, zu Zwischenzielen (25/50/75/100 %), zum Stand nach 3/6/12 Monaten, zu alternativen Raten, zur Wirkung einer ausgelassenen Rate und zur Differenz zwischen Durchziehen und Abdriften. Zinsen nur als sichtbare Annahme, Standard 0 %, höchstens 20 %. `unrealistic`, wenn der Zielzeitraum mit der Rate nicht reicht.
- **Fitness:** geplante gegenüber absolvierten Einheiten je Woche, Konstanz (Anteil erfüllter abgeschlossener Wochen), Abweichung und Meilensteine nur aus eingetragenen Messwerten. Künftige Leistung wird ausdrücklich nicht berechnet.
- **Lernen:** investierte Zeit (Einheiten × Minuten der Handlung), Restzeit bei gleichem Messwert-Tempo (mind. zwei Messungen mit 14 Tagen Abstand) und andere Frequenzen. Fortschritt pro Einheit gibt es nur, wenn Messwerte und Einheiten im selben Zeitraum liegen. Ohne Dauer pro Einheit zählt die Ansicht Einheiten statt Stunden.
- **Ruhe ist kein Fehler:** Jeder bewusste Pausentag (`S.rest`) und jeder Debrief mit Ruhe/Krank senkt den Wochenplan um höchstens eine Einheit.
- **Abdriften** ist dein Tempo der letzten bis zu vier abgeschlossenen Wochen, wenn es unter dem Plan liegt. Sonst gilt ausdrücklich „halber Plan“. Die Ansicht nennt, welche Annahme gilt.
- **Kurzfristig** (`PJ.today`): Planerfüllung dieser Woche, wenn heute erledigt bzw. ausgelassen, und ob die Woche noch zu schaffen ist. Keine Schuldzuweisung.

## Ansicht „Was passiert, wenn ich dranbleibe?“

Sheet `impact` (`ImpactSheet`). Erreichbar aus Mein Leben (Zielkarte in der aufgeklappten Säule), aus „Ziel bearbeiten“ und über eine Textzeile unter dem Fortschritt auf Heute für das Hauptziel. Keine neue Navigation. Inhalt: Heute-Wirkung, bei Finanzen Rate/Zinsen, Schalter Durchziehen ↔ Abdriften, schlichtes Liniendiagramm (nur CSS-Variablen; Zeitachse proportional bis 1 Jahr, damit gleichmäßiges Tempo eine Gerade bleibt), Kennzahlen, 5 Jahre als Zahl, Annahmen.

## Tests

`node tests/projection-core.cjs`: Sparziel mit konstanter und veränderter Rate, Zinsannahme, unrealistische Frist, fehlende oder unvollständige Daten, Fitness mit geplanten und ausgefallenen Einheiten, Meilensteine nur aus Messwerten, Ruhe/Krankheit, Änderung eines bestehenden Ziels, Lernen mit und ohne Dauer, Heute-Wirkung, Migration/Speichern/Laden, Einbindung und Offline.

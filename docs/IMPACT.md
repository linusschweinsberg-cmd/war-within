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


## Phase 2 – Ziel zerlegen und adaptive Planung (ww-v77)

- **Ziel anlegen** (bestehender Dialog „Neues Ziel“): neu sind *Zeit pro Woche* (optional) und *Einschränkungen* (optional, kurzer Text, bleibt lokal). Ausgangswert („Heute“), Zielwert und Zeitraum gab es schon. Die neuen optionalen Felder heißen `goal.capacity` (Minuten/Woche), `goal.limits` und `goal.steps`. Keine Formatänderung.
- **Etappen** (`PJ.suggestSteps`): runde Zwischenwerte zwischen Start und Ziel, höchstens sechs, Ziel zuletzt, ganze Zahlen bleiben ganz (z. B. 50 → 60 → … → 100 kg, 3.000 → 5.000 → 10.000 → 15.000 → 20.000 €). Ohne Startwert gibt es keine Etappen. Sie lassen sich entfernen und ergänzen und werden beim Anlegen gespeichert. Termine gibt es nur bei Finanzen mit Rate, bei Gesundheitszielen ausdrücklich keine.
- **Handlungen nach verfügbarer Zeit** (`PJ.fitActions`): Im Plan-Schritt zeigt die Karte geplante gegenüber verfügbaren Minuten. „An meine Zeit anpassen“ senkt die Häufigkeit, nie unter einmal pro Woche; was trotzdem nicht passt, wird genannt.
- **Adaptive Planung** (`PJ.adapt`, Abschnitt „Plan anpassen?“ in „Ziel bearbeiten“, Hinweis „Anpassung vorgeschlagen“ auf der Zielkarte):
  - (a) Plan gehalten (≥ 80 % über 3 Wochen), Ergebnis flach oder schlechter → Methode per Experiment ändern; ohne Messwert zuerst messen.
  - (b) Konstanz unter 60 % in mindestens 2 abgeschlossenen Wochen → Häufigkeit auf das echte Tempo senken. Ruhe- und Krankheitstage zählen nicht dagegen.
  - (c) Ziel oder Zeitraum unrealistisch. Finanzen: Zeitraum verlängern oder nötige Rate. Sonst: Zeitraum verlängern, ohne Datumsversprechen bei Körperzielen.
  - (d) Der Plan braucht mehr Zeit als angegeben → Häufigkeit anpassen.

  Jeder Vorschlag nennt seine Zahlen und ändert erst nach einem Tipp etwas, über die bestehenden Wege (`setActPerWeek`, `updateGoal`, `PJ.setPlan`).
- Tests: `node tests/goal-breakdown.cjs`. Browser 375×812: Ziel mit Startwert, Etappe entfernt, Zeit pro Woche gespeichert; Vorschlag „Rate erhöhen“ übernommen.

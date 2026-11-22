# Onboarding als Geschichte

Der Nutzer ist der Protagonist. Ein Gedanke pro Screen, Text erscheint zeilenweise (`Lines`, ca. 0,8 s Abstand), „Weiter“ blendet erst nach der Pause ein (`wait` je Screen). Bei `prefers-reduced-motion` entfallen Pausen und Verzögerungen. Oben stehen sechs Punkte für die Stationen statt eines Prozentbalkens.

Code: `OB_SCREENS` (Reihenfolge, Station, Pause), `OB_BODY` (Komponenten), `Onboarding` (Rahmen). Daten im Objekt `ob` (`obv: 2, story: 1`), gespeichert in `war_within_auth_v1`; `buildState` → `lifeFromOb` übernimmt sie in den Spielstand.

| # | Station | Screen | Interaktion | Absicht | Daten |
|---|---|---|---|---|---|
| 1 | Bewusstsein | Ankommen | Lichtpunkte ordnen sich zur Linie. „Bevor du verändern kannst, wohin du gehst, musst du wissen, wo du stehst.“ | Tempo herausnehmen, Thema setzen | – |
| 2 | Bewusstsein | Ein möglicher Weg | Zwei Linien aus einem Punkt zeichnen sich nacheinander („dein Weg bis heute“, „ein möglicher Weg“). Frage nach den letzten Jahren, dann „Wie anders könnte dein Leben heute aussehen?“, danach „Das ist kein Vorwurf …“ | Potenzial spüren, ohne Versagensgefühl | – |
| 3 | Bewusstsein | Verantwortung | Links verblassen Herkunft, Zufälle, Verluste, andere Menschen; rechts werden Reaktion, Entscheidung, nächster Schritt hell | Entlasten, dann Fokus auf das Beeinflussbare | – |
| 4 | Bewusstsein | Bereitschaft | „Bist du bereit, ehrlich hinzusehen?“ Zwei Antworten als Karten, kein Weiter-Button. „Erst sehen, wie es funktioniert“ zeigt einen Überblick (Hinsehen, Entscheiden, Handeln und prüfen) mit den Wegen „ca. 5 Min.“ oder „das Nötigste, ca. 2 Min.“ | Erste bewusste Entscheidung, beides ist in Ordnung | `readyChoice`, `short` |
| 5 | Bewusstsein | Name | Eingabe, Antwort „Gut, … Dann fangen wir an.“ Gäste starten mit leerem Feld | Identifikation | `name` |

**Navigationsregeln der Eröffnung**
- Screens 1–3 sind Erzähl-Screens (`tap`): Ein Tippen während der Erzählung zeigt sofort den ganzen Text (`story-skip`), ein weiteres Tippen oder „Weiter“ geht zum nächsten Screen. Bis dahin steht unten „Tippen zeigt den ganzen Text“.
- Screen 4 ist ein Auswahl-Screen (`choice`) ohne Weiter-Button. Die Wahl ist die Navigation, und aus dem Überblick führt „Zurück zur Frage“ zurück.
- Auf Screen 1 gibt es keinen Zurück-Button. Wer zurückgeht, sieht den Text sofort, ohne Pause.
- Der Fortschritt wird gespeichert. Nach einem Neuladen geht es auf demselben Screen weiter.
| 4 | Konfrontation | Vier Säulen | Einschätzung 1–5, Säulen wachsen/reißen live | Ehrlich, ohne Urteil | `areas` |
| 5 | Konfrontation | Spiegel | Niedrigster Bereich hervorgehoben; „Anpassen“ | Feststellung statt Urteil | – |
| 6 | Konfrontation | Preis des Stillstands | Bis zu zwei Chips | Kosten spürbar, ohne Schuld | `cost` → `life.why.q.cost` |
| 7 | Potenzial | Kleine Zahl, lange Zeit | Zähler 1 Tag → 1 Jahr (20 Min. täglich) | Compounding ohne Versprechen | – |
| 8 | Potenzial | Ein Jahr weiter | Bereich wählen, ein Satz | Zukunftsbild als Anker | `focus`, `why` |
| 9 | Potenzial | Messbar machen | `GoalForm` (Ziel) | Vision → Ergebnis | `goal` |
| 10 | Verantwortung | Was liegt in deiner Hand? | Karten sortieren (Buttons oder Wischen), zwei Karten am Ziel | Ergebnis vs. Handlung trennen | `ctrl` |
| 10b | Verantwortung | Success Loop in einer Situation | Siehe unten, ca. 60–90 Sek. | Das bestehende Modell intuitiv verstehen | `loopPick`, `loopDone` |
| 11 | Verantwortung | Was dich aufgehalten hat | Bis zu zwei Hindernisse | Benennen ohne Scham, planbar machen | `obst` |
| 12 | Standards | Woran du dich misst | Drei Werte, „in Stein“ | Identität | `values` |
| 13 | Standards | Vom Wert zum Verhalten | Satzvorschlag je Wert, editierbar (`OB_STD`) | Beobachtbares Verhalten | `stds` → `principles[].std` |
| 14 | Standards | Bekenntnis | 2 Sekunden gedrückt halten (auch Tastatur) | Verbindlichkeit | `signed` |
| 15 | Aufbruch | Erste Handlung | `GoalForm` (Plan), Zeitfenster, Wenn-dann-Plan aus Hindernis | Absicht → Handlung | `goal.actions`, `firstWhen` |
| 16 | Aufbruch | Wann beginnst du? | Jetzt / Heute / Morgen früh | Zeitpunkt festlegen | `start` |
| 17 | Aufbruch | Tag 1 | Tempel als Baustelle, erste Handlung, Fokusmodus | Übergang ins Produkt, keine Belohnung ohne Handlung | `focusMode` |

## Modul: Success Loop in einer Situation (`LoopStory`)

Erklärt das bestehende Modell `LC.LOOP` (Ownership → Execution → Feedback → Adaptation) und zwei der Größen aus „Wie es wirkt“ (Selbstwirksamkeit, Compounding). Es führt kein neues Modell ein. Überzeugungen und Standards sind nicht Teil des Loops und kommen hier deshalb nicht vor. Die Standards folgen später in der Station „Standards“.

1. **Situation:** „Dienstag, 19 Uhr. Die wichtige Aufgabe liegt seit Tagen da. Du bist müde.“ Zwei Antworten: „Morgen. Heute bin ich zu müde.“ oder „Nur 10 Minuten. Anfangen reicht.“ Dazu: „Es gibt hier keine falsche Antwort.“
2. **Wiederholung:** Zwei Raster mit 12 Wochen × 7 Tagen füllen sich automatisch, ein Regler erlaubt das Zurückspulen. Es ist ein Beispielmuster mit 33 statt 8 Anfängen, ausdrücklich „kein Versprechen“. „Klein anfangen“ ist immer in der Handlungsfarbe, egal was gewählt wurde.
3. **Kreislauf:** Vier Schritte, je einer pro Tippen, jeweils mit der passenden App-Funktion: Heute zuerst, Daily Debrief und Wochenrückblick mit Experiment. Wer „Morgen“ gewählt hat, liest bei Feedback: „kein Versagen, sondern ein Signal“ (wie `RULES.missed`). Das Beispiel bei Adaptation entspricht `LC.suggest('energy')`.
4. **Abschluss:** Selbstwirksamkeit und Compounding, dazu der Hinweis, wo das Beispiel wieder zu finden ist.

Erneut aufrufbar über „Heute › Success Loop › Wie es wirkt › Beispiel ansehen“ (Sheet `loopdemo`). Das Modul ist nicht Teil der Kurzversion. Im Onboarding wird „Weiter“ erst nach dem Abschluss aktiv.

Kurzversion (gewählt im Überblick auf Screen 4): Eröffnung, Name, Säulen, Ziel, erste Handlung, Tag 1.

Nach dem Onboarding: `life.onboard` hält Startplan, Hindernis und Startzeitpunkt. Auf „Heute“ steht die erste Handlung oben mit „Beim Start festgelegt“ und dem Wenn-dann-Plan (gleicher Mechanismus wie das Abendritual, `eveToday`). Bei „Morgen früh“ gilt das ab Tag 1.

Sprache: ruhig, erwachsen, kurze Sätze, keine Zitate, keine Superlative, keine Schuld. Name höchstens dreimal.

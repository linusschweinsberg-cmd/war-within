# Onboarding als Geschichte

Der Nutzer ist der Protagonist. Ein Gedanke pro Screen, Text erscheint zeilenweise (`Lines`, ca. 0,8 s Abstand), „Weiter“ blendet erst nach der Pause ein (`wait` je Screen). Bei `prefers-reduced-motion` entfallen Pausen und Verzögerungen. Oben stehen sechs Punkte für die Stationen statt eines Prozentbalkens.

Code: `OB_SCREENS` (Reihenfolge, Station, Pause), `OB_BODY` (Komponenten), `Onboarding` (Rahmen). Daten im Objekt `ob` (`obv: 2, story: 1`), gespeichert in `war_within_auth_v1`; `buildState` → `lifeFromOb` übernimmt sie in den Spielstand.

| # | Station | Screen | Interaktion | Absicht | Daten |
|---|---|---|---|---|---|
| 1 | Bewusstsein | Stille | Lichtpunkte ordnen sich zur Linie; Tippen | Tempo herausnehmen | – |
| 2 | Bewusstsein | Umstände und Wiederholung | Begriffe links verblassen, rechts bleiben hell | Entlasten, dann Fokus auf das Wiederholbare | – |
| 3 | Bewusstsein | Name | Eingabe, Antwort „Gut, … Das ist deine Geschichte.“ | Identifikation | `name` |
| 4 | Konfrontation | Vier Säulen | Einschätzung 1–5, Säulen wachsen/reißen live | Ehrlich, ohne Urteil | `areas` |
| 5 | Konfrontation | Spiegel | Niedrigster Bereich hervorgehoben; „Anpassen“ | Feststellung statt Urteil | – |
| 6 | Konfrontation | Preis des Stillstands | Bis zu zwei Chips | Kosten spürbar, ohne Schuld | `cost` → `life.why.q.cost` |
| 7 | Potenzial | Kleine Zahl, lange Zeit | Zähler 1 Tag → 1 Jahr (20 Min. täglich) | Compounding ohne Versprechen | – |
| 8 | Potenzial | Ein Jahr weiter | Bereich wählen, ein Satz | Zukunftsbild als Anker | `focus`, `why` |
| 9 | Potenzial | Messbar machen | `GoalForm` (Ziel) | Vision → Ergebnis | `goal` |
| 10 | Verantwortung | Was liegt in deiner Hand? | Karten sortieren (Buttons oder Wischen), zwei Karten am Ziel | Ergebnis vs. Handlung trennen | `ctrl` |
| 11 | Verantwortung | Was dich aufgehalten hat | Bis zu zwei Hindernisse | Benennen ohne Scham, planbar machen | `obst` |
| 12 | Standards | Woran du dich misst | Drei Werte, „in Stein“ | Identität | `values` |
| 13 | Standards | Vom Wert zum Verhalten | Satzvorschlag je Wert, editierbar (`OB_STD`) | Beobachtbares Verhalten | `stds` → `principles[].std` |
| 14 | Standards | Bekenntnis | 2 Sekunden gedrückt halten (auch Tastatur) | Verbindlichkeit | `signed` |
| 15 | Aufbruch | Erste Handlung | `GoalForm` (Plan), Zeitfenster, Wenn-dann-Plan aus Hindernis | Absicht → Handlung | `goal.actions`, `firstWhen` |
| 16 | Aufbruch | Wann beginnst du? | Jetzt / Heute / Morgen früh | Zeitpunkt festlegen | `start` |
| 17 | Aufbruch | Tag 1 | Tempel als Baustelle, erste Handlung, Fokusmodus | Übergang ins Produkt, keine Belohnung ohne Handlung | `focusMode` |

Kurzversion („Kurzversion (1 Min.)“ auf Screen 1): Name, Säulen, Ziel, erste Handlung, Tag 1.

Nach dem Onboarding: `life.onboard` hält Startplan, Hindernis und Startzeitpunkt. Auf „Heute“ steht die erste Handlung oben mit „Beim Start festgelegt“ und dem Wenn-dann-Plan (gleicher Mechanismus wie das Abendritual, `eveToday`). Bei „Morgen früh“ gilt das ab Tag 1.

Sprache: ruhig, erwachsen, kurze Sätze, keine Zitate, keine Superlative, keine Schuld. Name höchstens dreimal.

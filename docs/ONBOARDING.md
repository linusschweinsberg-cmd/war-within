# Onboarding als Geschichte

> **Aktueller Stand:** Reihenfolge, Zustände, Überspringen, Pause, Fortsetzen und das Fundament sind in `docs/FTUE.md` beschrieben. Die gültige Reihenfolge folgt dem Produktprinzip: Einstieg → Selbsterkenntnis (Säulen, Audit, Zukunft) → Eigenverantwortung (Kontrolle, Hindernisse, Ownership) → Standards (Werte, Standards, Bekenntnis) → Handeln (Success Loop, Fokus, Ziel, erster Schritt, Commitment). Die Tabelle unten beschreibt die einzelnen Screens. Die Screens „Wert-Sätze“, „Wann beginnst du?“ und „Tag 1“ sind entfallen. Ihre Aufgaben übernehmen „Persönliche Standards“ und „Erstes Commitment“.

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
| 5b | Konfrontation | Life Audit (freiwillig) | Angebot „Möchtest du genauer hinsehen?“ → Dialog je Bereich, siehe unten | Ehrliche Bestandsaufnahme ohne Pflicht | `audit`, `auditOpen`, `auditCur` → `life.audit` |
| 6 | Konfrontation | Preis des Stillstands | Bis zu zwei Chips | Kosten spürbar, ohne Schuld | `cost` → `life.why.q.cost` |
| 6b | Potenzial | Wer könntest du werden? | Siehe unten, ca. 3 Min. | Eigenes Erfolgsbild, heutiges vs. mögliches Ich, Beharrlichkeit | `future`, `futureCur`, `futureDone` → `life.future` |
| 7 | Potenzial | Kleine Zahl, lange Zeit | Zähler 1 Tag → 1 Jahr (20 Min. täglich) | Compounding ohne Versprechen | – |
| 8 | Potenzial | Ein Jahr weiter | Bereich wählen, ein Satz | Zukunftsbild als Anker | `focus`, `why` |
| 9 | Potenzial | Messbar machen | `GoalForm` (Ziel) | Vision → Ergebnis | `goal` |
| 10 | Verantwortung | Was liegt in deiner Hand? | Karten sortieren (Buttons oder Wischen), zwei Karten am Ziel | Ergebnis vs. Handlung trennen | `ctrl` |
| 10b | Verantwortung | Success Loop in einer Situation | Siehe unten, ca. 60–90 Sek. | Das bestehende Modell intuitiv verstehen | `loopPick`, `loopDone` |
| 11 | Verantwortung | Was dich aufgehalten hat | Bis zu zwei Hindernisse | Benennen ohne Scham, planbar machen | `obst` |
| 11b | Verantwortung | Radical Ownership | Siehe unten, ca. 90 Sek. | Verantwortung als Quelle von Selbstwirksamkeit | `own`, `ownDone` → `life.onboard.own` |
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

## Modul: Radical Ownership (`OwnerStory`)

Kernsatz: „Auch wenn du nicht alles kontrollieren kannst, kannst du Verantwortung übernehmen: für deine Entscheidungen, deine Handlungen und deinen nächsten Schritt.“ Darunter: „Nicht als Schuld. Als Handlungsspielraum.“

1. **Drei Situationen** (`OWN_SIT`): Laufen im Regen nach einem langen Tag, eine Präsentation, bei der ein Kollege nicht geliefert hat, und eine Woche Krankheit. Der Nutzer wählt zuerst, was er sich „ehrlich, nicht ideal“ sagen würde. Danach werden alle drei Sätze eingeordnet:
   - **Ausrede**: „Schließt das Thema, bevor du hinsiehst.“ Bei der Krankheit steht stattdessen **Selbstvorwurf**: „Verantwortung heißt nicht, dir die Schuld zu geben.“
   - **Reales Hindernis**: „Stimmt. Das zu benennen ist ehrlich, keine Ausrede.“
   - **Verantwortung**: „Erkennt das Hindernis an und sucht den Teil, der in deiner Hand liegt.“
   
   Wer die Ausrede wählt, liest dazu „Ein Gedanke, den jeder kennt.“ Jede Situation endet mit einem Satz, z. B. „Krankheit ist kein Versagen. Verantwortung beginnt beim Wiedereinstieg.“ Das entspricht der Regel `missed`: Neustart mit halbem Pensum.
2. **Und bei dir?** Ziel und Hindernis aus dem Onboarding stehen als Kontext darüber. Drei Fragen folgen:
   - „Was liegt in deiner Kontrolle?“ (Chips)
   - „Was kannst du nicht verändern?“ (Chips, mit „Das anzuerkennen ist keine Schwäche.“)
   - „Was wäre trotzdem dein nächster sinnvoller Schritt?“ (vorausgefüllt mit der ersten Handlung, Pflichtfeld)
3. **Abschluss:** „Das ist Ownership. Nicht Schuld, sondern Handlungsspielraum.“ Der eigene nächste Schritt wird angezeigt. Ownership ist Schritt 1 im Success Loop (`LC.LOOP[0].q`: „Was kann ich kontrollieren?“). Daraus wächst Selbstwirksamkeit.

Erneut aufrufbar über „Wie es wirkt“ › „Ownership in drei Situationen“ (Sheet `ownerdemo`). Das ist die Kurzfassung ohne persönliche Fragen. Das Modul ist nicht Teil der Kurzversion.

## Modul: Persönliche Standards (`StandardsPanel`, Logik in `life-core.js`)

Für jeden Lebensbereich gibt es vier Teile:
1. **Wo stehst du heute?** (1–10; vorbelegt aus Audit oder Säulen nur auf Klick, sonst offen), dazu die Erfahrung: Einsteiger, Wiedereinstieg oder Erfahren.
2. **Was möchtest du langfristig erreichen?** (vorgeschlagen aus der Gegenüberstellung)
3. **Dein Standard** (Text, Häufigkeit, Minuten)
4. **Dein Minimum** („die kleinste sinnvolle Handlung, die auch an schwierigen Tagen geht“)

Der Vorschlag nennt seine Quellen und lässt sich übernehmen oder überschreiben. Bereiche mit eigenen Angaben sind als „für dich“ markiert.

**In der App:**
- Die Karte „Deine Standards“ auf Heute zeigt „Erledigt“ (nur ohne verknüpfte Ziel-Handlung), „Minimum“ und den Wochenstand.
- Das Sheet `standards` zeigt den Stand der Woche und seit Beginn, die Ausgangslage damals und heute, Comebacks und Anpassungsvorschläge: eine Einheit weniger, kürzer, ruhen lassen oder anspruchsvoller.
- Jede Änderung wird im Verlauf gespeichert, alte Wochen behalten ihr damaliges Soll.

## Modul: Erstes Commitment (`ObCommit`, `CommitCard`)

- Kernsatz: „Deine Zukunft verändert sich nicht durch das, was du dir vornimmst, sondern durch das, was du wiederholt tust.“
- Der Vorschlag (`obCommitProposal`) nutzt in dieser Reihenfolge: den selbst gewählten Fokus, das Ziel, die Gegenüberstellung, Veränderungswünsche aus dem Audit, die Säulen. Gibt es keine eigenen Angaben, folgt eine universelle Mini-Auswahl.
- Standard und Schritt sind editierbar. „Eigenen Schritt formulieren“ ersetzt den Vorschlag, „Ohne ersten Schritt starten“ ist möglich.
- Darunter stehen die vier Loop-Schritte, bezogen auf diesen Schritt.
- „Zum ersten Schritt“ führt auf Heute: als Mission ganz oben, wenn eine Ziel-Handlung existiert, sonst als Karte „Dein erster Schritt“ mit „Erledigt“ und „Ausblenden“.

## Modul: Wer könntest du werden? (`FutureStory`)

Steht direkt nach dem Life Audit und dem Preis des Stillstands, am Anfang der Station „Potenzial“. Alles ist freiwillig.

0. **Einstieg:** „Wer könntest du werden? Nicht, wer du hättest sein sollen. Sondern wer du werden kannst.“
1. **Eigenes Erfolgsbild:** „Was bedeutet Erfolg für dich?“ Es gibt bis zu drei Anregungen (`LC.FUTURE_SUCCESS`, ohne Status- oder Geldziele als Vorgabe) und ein eigenes Feld. Dazu der Hinweis: „Kein Maßstab von außen. Geld, Status oder Titel zählen hier nur, wenn sie dir selbst wirklich wichtig sind.“
2. **Rückblick ohne Urteil:** Fragen 1–3 im Wortlaut, eingeleitet mit „Nicht, um zu bereuen. Sondern um zu sehen, was in dir steckt.“ Jede Antwort bekommt eine stärkende Rückmeldung, z. B. „Das zeigt, was in dir steckt. Es ist nicht verloren.“ Mit „Diese Fragen auslassen“ springt man direkt nach vorn.
3. **Vorblick:** Fragen 4 und 5 (Leben in drei Jahren, die Person dafür).
4. **Gegenüberstellung:** Bis zu drei Bereiche aus dem Life Audit, jeweils „Heute“ und „In drei Jahren“. „Heute“ wird aus dem Audit vorausgefüllt, falls dort etwas steht.
5. **Ansicht:** zwei Spalten, MEIN HEUTIGES ICH und MEIN MÖGLICHES ZUKÜNFTIGES ICH. Ein Regler blendet zwischen beiden. In der Mitte sind beide voll sichtbar. Unter dem möglichen Ich steht „Wer ich dafür bin“ (Frage 5).
6. **Sheer Indefatigability:** „Unermüdliche Beharrlichkeit. Nicht jeden Tag Höchstleistung. Sondern immer wieder anfangen.“ Zwölf Wochen „Alles oder nichts“ (21 Einheiten) stehen gegen „Beharrlich, mit Pausen“ (27). Ausdrücklich: Pausen, Krankheit und schwache Wochen gehören dazu. Die Verbindung zum Modell: Die App zählt Comebacks, also Resilienz im Success Loop.

**Weiterverwendung:**
- „Ein Jahr weiter“ übernimmt den Fokus aus dem ersten gewählten Bereich und das Warum aus dem Zukunftsbild (editierbar). Ein zweites Zukunftsbild wird dort nicht mehr abgefragt.
- Der Ziel-Screen zeigt „Dein Bild in drei Jahren“ und „Erfolg heißt für dich“ über dem Formular.
- Werte und Standards zeigen „Wer du werden willst“ (Frage 5).
- In der App zeigt die Karte unter „Mein Leben“ die Person und das Erfolgsbild. Das Sheet `future` bietet Gegenüberstellung und Bearbeiten.

**Datenschutz:** Für die Freitexte gilt dasselbe wie beim Life Audit. Sie bleiben lokal. `LC.futureForSync` liefert nur Struktur, keine Texte.

## Modul: Life Audit (`LifeAudit`, Logik in `life-core.js`)

Eine freiwillige Bestandsaufnahme in acht Bereichen (`LC.AUDIT_AREAS`). Jeder Bereich ist einem der vier Lebensbereiche zugeordnet:

| Bereich | Lebensbereich |
|---|---|
| Körper und Fitness, Mentale Verfassung und Energie | health |
| Beruf und Karriere, Finanzen | wealth |
| Familie, Freundschaften, Beziehungen | relationships |
| Disziplin und Gewohnheiten, Entwicklung und Lernen, Sinn, Werte, Zufriedenheit | growth |

- **Dialog statt Formular:** Pro Bereich stellt die App fünf Fragen nacheinander in Sprechblasen:
  1. Zufriedenheit 1–10
  2. „Wie sieht es gerade wirklich aus?“
  3. „Worauf bist du hier schon stolz? Auch Kleines zählt.“
  4. „Was würdest du gern verändern?“
  5. „Was steht dem im Moment im Weg?“ (Hindernis-Codes aus `OBSTACLES`, höchstens 3)
  
  Jede Frage hat „Überspringen“. Wer eine frühere Antwort antippt, kann sie ändern. Am Ende folgt ein Vorschlag für den nächsten offenen Bereich.
- **Zustände:** Offen, Später (bewusst übersprungen), Begonnen, Fertig (`LC.auditState`).
- **Wiederaufnahme:** Jede Eingabe wird sofort gespeichert. Ansicht, Bereich und Frage liegen in `auditCur`, im Onboarding in `war_within_auth_v1`, in der App in `S.life.auditCur`.
- **Ausgangslage:** Bewertete Bereiche erscheinen als Balken in der Farbe des Lebensbereichs. Offene Bereiche sind gestrichelt und als „offen“ beschriftet, nie als 0. Dazu kommen „Worauf du schon stolz bist“, „Was du verändern möchtest“ und „Was dich gerade bremst“ mit Häufigkeit.
- **Im Onboarding:** nach dem Spiegel, als Angebot „Ja, Bereich für Bereich“ oder „Jetzt nicht“. Ein Klick auf „Weiter im Onboarding“ beendet den Audit jederzeit. Das Modul ist nicht Teil der Kurzversion.
- **In der App:** Die Karte „Life Audit“ unter „Mein Leben“ zeigt eine Mini-Übersicht und öffnet das Sheet `audit` mit Ergänzen, Ausgangslage und „Alle Audit-Antworten löschen“ (zweimal tippen).

**Datenschutz (verbindlich):**
- Freitexte (`now`, `proud`, `change`) bleiben auf dem Gerät. Sie sind auf 280 Zeichen begrenzt, und leere Felder werden nicht gespeichert.
- Personalisierung nutzt nur `LC.auditSummary`: Durchschnitt je Lebensbereich (fehlend = `null`), Hindernis-Häufigkeit und Bereiche mit Veränderungswunsch.
- Eine Server-Synchronisation darf nur `LC.auditForSync` übertragen: Zahlen, Codes und `hasText`, keine Texte.
- Der Audit erscheint nicht in Liga, Teilen oder Nemesis.

Kurzversion (gewählt im Überblick auf Screen 4): Eröffnung, Name, Säulen, Ziel, erste Handlung, Tag 1.

Nach dem Onboarding: `life.onboard` hält Startplan, Hindernis und Startzeitpunkt. Auf „Heute“ steht die erste Handlung oben mit „Beim Start festgelegt“ und dem Wenn-dann-Plan (gleicher Mechanismus wie das Abendritual, `eveToday`). Bei „Morgen früh“ gilt das ab Tag 1.

Sprache: ruhig, erwachsen, kurze Sätze, keine Zitate, keine Superlative, keine Schuld. Name höchstens dreimal.

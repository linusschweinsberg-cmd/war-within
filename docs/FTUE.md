# First-Time-User-Experience: Zustandslogik und Datenstruktur

Dieses Dokument verbindet die acht Onboarding-Module zu einem System. Einzelheiten zu Texten und Screens stehen in `docs/ONBOARDING.md`.

## Produktprinzip

**Erst Selbsterkenntnis. Dann Eigenverantwortung. Dann persönliche Standards. Und schließlich konsequentes Handeln.**

Onboarding, Fundament und Einladungen folgen dieser Reihenfolge. Jede Stufe nutzt, was die vorige ergeben hat:
- Die Hindernisse aus dem Audit werden zu Karten in „Was liegt in deiner Hand?“.
- Der Veränderungswunsch aus dem Audit füllt den nächsten Schritt bei Ownership vor.
- Der Standard eines Bereichs füllt die Handlung des Ziels vor.

Die Kurzform darf Stufen überspringen. Sie holt diese dann im Fundament in derselben Reihenfolge nach.

## Grundregeln

1. **Nichts ist Pflicht, außer dem Weg in die App.** Jeder Screen lässt sich überspringen. Ohne Name heißt der Nutzer „Du“, ohne Ziel startet er mit einem universellen ersten Schritt.
2. **Speichern bei jeder Eingabe.** Vor dem App-Start liegen die Daten in `war_within_auth_v1.ob`, danach im Spielstand (`war_within_v5` bzw. `war_within_acc_v1_<id>`), beides in `localStorage`. Für das Onboarding selbst gibt es keinen Netzwerkaufruf, deshalb verlieren langsame Verbindungen oder Neustarts nichts.
3. **Fehlend heißt unbekannt, nicht schlecht.** Alle Auswertungen geben bei fehlenden Daten `null` oder `'nodata'` zurück, nie 0 und nie „verfehlt“.
4. **Personalisierung nur aus vorhandenen Angaben.** Jeder Vorschlag nennt seine Quelle. Fehlt sie, fällt der Vorschlag auf eine neutrale Vorlage zurück.
5. **Private Freitexte bleiben auf dem Gerät.** Eine Synchronisation darf nur `LC.auditForSync`, `LC.futureForSync` und `LC.standardsForSync` nutzen.

## Zustände eines Abschnitts (`LC.fundSections`)

| Zustand | Bedeutung | Quelle |
|---|---|---|
| `open` | noch nichts angegeben | abgeleitet aus den Daten |
| `partial` | begonnen | abgeleitet |
| `done` | Kern vollständig | abgeleitet |
| `skipped` | bewusst übersprungen, nicht mehr einladen | `life.fund.skip[id]` |

Der Zustand wird immer aus den echten Daten berechnet und nie separat gespeichert. Nur „bewusst übersprungen“ ist eine eigene Entscheidung des Nutzers. Wer wieder etwas einträgt, hebt das Überspringen automatisch auf.

Abschnitte von „Dein persönliches Fundament“:

| Stufe | id | Abschnitt | `done`, wenn … | Bearbeiten |
|---|---|---|---|---|
| 1 | `audit` | Bestandsaufnahme (Life Audit) | alle 8 Bereiche `done`/`skipped`, `partial` ab einem | Sheet `audit` |
| 1 | `future` | Zukunftsvision | Erfolgsbild **und** Bild in drei Jahren **oder** Person | Sheet `future` |
| 2 | `owner` | Radical Ownership | Szene gesehen oder eigener nächster Schritt | Sheet `ownerdemo` |
| 3 | `values` | Werte | mindestens ein Wert | Sheet `values` |
| 3 | `standards` | Persönliche Standards | Fokusbereich (oder ein Bereich) mit Standard **und** Minimum | Sheet `standards` |
| 4 | `model` | Success Loop | Szene einmal gesehen | Sheet `loopdemo` |
| 4 | `goal` | Ziel und erste Handlung | aktives Ziel mit Handlung | Sheet `goal` |

## Onboarding-Ablauf (`OB_SCREENS`)

| Station | Ausführlich | Kurz |
|---|---|---|
| Einstieg | still, what, resp, ready, name (Modul 1) | still, what, resp, ready, name |
| 1 · Selbsterkenntnis | pillars, mirror, audit, cost, future, persona, compound (Module 4, 5) | pillars, persona |
| 2 · Eigenverantwortung | ctrl, obst, owner (Modul 3) | – |
| 3 · Standards | values, standards, sign (Modul 6) | – |
| 4 · Handeln | loop, year, goal, first, commit (Module 2, 8) | goal, first, commit |

- `skipIf`: `first` entfällt ohne Ziel, `sign` entfällt ohne Standards und ohne Werte.
- **Überspringen:** Jeder Screen mit Pflichtangabe bekommt den Knopf „Überspringen“. Er setzt `ob.skip[id]`.
- **Pausieren** (Kopfzeile, ab Screen 5): „Später weitermachen“ führt mit den bisherigen Angaben in die App. Dabei wird `life.fund.ob.paused` gesetzt, und die restlichen Abschnitte stehen im Fundament.
- **Fortsetzen nach Neustart:** Wer das Onboarding mit gespeichertem Fortschritt neu öffnet (`ob.step > 0`), sieht drei Optionen: „Fortsetzen“, „Mit dem Nötigsten abschließen“ (Wechsel in die Kurzform ab dem nächsten Kern-Screen) und „Direkt in die App“.
- **Einmaligkeit:** Gäste haben `A.guestOb`, Konten `A.onboarded` und den Spielstand je Konto (wie bisher). Wiederkehrende Nutzer landen direkt in der App.

## Datenstruktur

```
war_within_auth_v1.ob   (nur bis zum App-Start, danach null)
  obv:2, story:1, short, step, dir, skip:{id:true}
  name, areas{4×1–5}, focus, why, cost[], ctrl[], obst[], own{can,cant,next}, ownDone, loopPick, loopDone
  audit{v,areas{8×{sat,now,proud,change,obst,skip}}}, auditOpen, auditCur
  future{success[],successOwn,past1..3,vision,identity,rows[]}, futureCur, futureDone
  values[], standards{area→Standard}, signed, goal(draft), firstWhen
  commit{kind:'goal'|'standard'|'universal'|'own', text, area, when}

S.life (Spielstand)
  audit, future, values, why{text,q{cost}}, goals/actions/log …   (bestehend)
  standards{ health|relationships|wealth|growth → {
     area, level:'new'|'back'|'exp', current:{sat:1–10|null, note}, desired,
     std:{text, perWeek, minutes}, min:{text, minutes}, aid?,
     base:{wk, sat}, hist:[{wk, std, min, why}], status:'active'|'paused', created, updated } }
  stdLog[{area, d, wk, kind:'std'|'min'}]          nur für Standards ohne verknüpfte Handlung
  onboard{for, mid, plan, own, loop, commit, …}    Startplan, erstes Commitment
  fund{ v:1, skip{id:t}, inv{last, seen{key:{n,t}}, never{key:true}}, ob{mode, paused, done, t} }
```

## Persönliche Standards: Logik (`life-core.js`)

- **Vorschlag** `suggestStandard(S, area, level)`: Er nutzt nur vorhandene Angaben, in dieser Reihenfolge:
  1. eine Ziel-Handlung im Bereich (Häufigkeit und Dauer, bei Einsteigern auf höchstens 3× gekappt),
  2. sonst die Vorlage für `level` (Einsteiger, Wiedereinsteiger, Erfahren),
  3. Zufriedenheit aus dem Audit oder den Säulen nur als Hinweis „anspruchsvoll“: ab 7/10 einen Schritt mehr.
  
  Rückgabe: `{std, min, why[]}`. `why` nennt die Quellen. Der Nutzer kann alles ändern.
- **Woche** `standardWeek(L, area, wk)`:
  - zählt die verknüpfte Handlung (`log`) plus `stdLog` vom Typ `std`, das Minimum getrennt,
  - liefert `state` als `met` (≥ Soll), `partial`, `min` (nur Minimum) oder `nodata` (keine Einträge, neutral),
  - gibt für Wochen vor der Anlage `null` zurück.
- **Rückmeldung** `standardFeedback(L, area)` nutzt die Schritte des Success Loops:
  - **Execution:** diese Woche x/y.
  - **Feedback:** Ein gehaltenes Minimum zählt als „drangeblieben“.
  - **Adaptation:** Liegt die Umsetzung in 2 der letzten 3 abgeschlossenen Wochen unter 50 % und gab es Aktivität, kommt der Vorschlag „Standard anpassen“ (eine Einheit weniger, kürzer, oder nur das Minimum für zwei Wochen). Wurde der Standard 3 Wochen in Folge gehalten, kommt der Vorschlag „anspruchsvoller“. Wochen ohne Einträge führen nur zur Frage, ob der Standard ruhen soll, nie zu „undiszipliniert“.
  - **Comeback:** eine gehaltene Woche nach einer Woche ohne Einträge.
- **Fortschritt relativ zur Ausgangslage** `standardProgress(L, area)`:
  - gehaltene Wochen von abgeschlossenen Wochen seit Anlage,
  - Konstanz der ersten vier gegenüber den letzten vier Wochen,
  - Zufriedenheit damals und heute (nur wenn beide vorliegen).
- **Ändern** `setStandard` speichert jede Änderung in `hist` mit Begründung. `setStandard` mit `status:'paused'` lässt den Standard ruhen, ohne Daten zu löschen.

## Einladungen zum Ergänzen (`nextInvite`)

- Es gibt höchstens eine sichtbare Einladung, nur auf „Heute“, frühestens ab Tag 1 nach dem Onboarding und höchstens alle 3 Tage.
- Reihenfolge nach Stufen, jeweils nur bei `open` und nicht `skipped`:
  1. Life Audit ab Tag 1
  2. Zukunftsvision ab Tag 4
  3. Ownership ab Tag 6
  4. Werte ab Tag 8
  5. Standards im Fokusbereich ab Tag 10
  6. Success Loop ab Tag 12
- **Stufenregel:** Eine Einladung zu Stufe n kommt erst, wenn in jeder Stufe davor mindestens ein Abschnitt begonnen, fertig oder bewusst übersprungen ist. Wer noch nichts zur Selbsterkenntnis hat, wird also nicht nach Standards gefragt.
- „Nicht jetzt“ pausiert diese Einladung für 14 Tage. Nach zwei Mal „Nicht jetzt“ oder einmal „Nicht mehr fragen“ kommt sie nie wieder.
- Der Text nennt immer konkret, was fehlt, z. B. „Du hast deine persönlichen Standards für Gesundheit noch nicht definiert. Möchtest du das jetzt tun?“

## Erstes Commitment (`commit`)

- Grundlage ist, in dieser Reihenfolge:
  1. ein Standard im Fokusbereich,
  2. das Ziel mit erster Handlung,
  3. der Fokusbereich aus Säulen, Audit oder Gegenüberstellung,
  4. eine universelle Mini-Auswahl.
- Satz 1 („Du hast erkannt …“) erscheint nur, wenn der Bereich aus eigenen Angaben stammt.
- Standard und erster Schritt sind editierbar. „Eigenen Schritt formulieren“ ersetzt den Vorschlag.
- „Zum ersten Schritt“ führt auf „Heute“. Dort steht der Schritt ganz oben: als Mission, wenn er mit einer Handlung verknüpft ist, sonst als Karte „Dein erster Schritt“ mit „Erledigt“.

## Kreislauf nach dem Onboarding

- **Erste Woche ruhig:** Sieben Tage lang sind Punkte, Liga, Nemesis und Duell ausgeblendet. Eine Karte auf „Heute“ erklärt das, „Jetzt alles zeigen“ hebt es auf.
- **Abendritual:** Auch Standards ohne verknüpfte Handlung lassen sich für morgen festlegen. Am nächsten Tag stehen sie mit „Gestern Abend festgelegt“ in der Standards-Karte.
- **Erinnerung:** Bei eingeschalteten Erinnerungen kommt zur selbst gewählten Zeit (morgens 8:00, mittags 12:30, abends 18:00) ein Hinweis auf den festgelegten Schritt.
- **Wochenrückblick:** Er zeigt die Standards mit Wochenstand, Comeback und Anpassungsvorschlag. Ohne Ziel gibt es einen eigenen Rückblick „Deine Woche“ nur mit Standards.
- **Monats-Check:** Er gilt auch für Standards ohne Ziel. „Wo stehst du heute?“ (1–10) aktualisiert die eigene Einschätzung (`rerateStandard`). Die Ausgangslage bleibt für den Vergleich erhalten.
- **Rückgängig und Sicherung:** siehe AGENTS.md.

## Löschen und Ändern

- Jeder Abschnitt lässt sich einzeln bearbeiten.
- Das Fundament hat „Alle persönlichen Angaben löschen“. Das entfernt `audit`, `future`, `standards`, `stdLog`, `why.q`, `onboard.own` und `onboard.commit` sowie die Werte-Standards. Ziele und erledigte Handlungen bleiben erhalten.

- **Zukunftscharakter** (`persona`, ab `ww-v98`): bis zu zwei Leitbilder (`persona-core.js`), überspringbar. Gewählt → `S.life.persona`; übersprungen → `status:later` (keine erneute Einladung); nicht erreicht → Einladung unter „Mein Leben“. Werte-Bildschirm bietet passende Werte nur zum Ergänzen an. Standards-Bildschirm (und Standards-Sheet in der App) zeigt bis zu drei Routinenvorschläge mit kleiner Variante; übernommen wird nur per Tipp, nie für Bereiche mit vorhandenem Standard.

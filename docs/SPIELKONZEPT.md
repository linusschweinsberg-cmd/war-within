# Spielkonzept: Vom Heute zum Zukunfts-Ich

Stand: 25.11.2026 · Status: Konzept; Schritt 1 (Begriffe) in `ww-v93`, Schritt 2 (Saisonrang, Tageslimit, Nebenplätze; `rank-core.js`) in `ww-v94`, Schritt 3 (Zukunftscharakter-Auswahl unter „Mein Leben“ mit Einladung für bestehende Spielstände; `persona-core.js`) in `ww-v96`, Schritt 4 (Fähigkeiten unter „Mein Leben“ mit Vorschlägen aus erreichten Zielen und bewährten Experimenten) in `ww-v97`, Schritt 5 (Zukunftscharakter im Einstieg nach „future“, auch in der Kurzform; Wertvorschlag; Routinenvorschläge mit kleiner Variante im Standards-Bildschirm und Standards-Sheet) in `ww-v98`, Schritt 6 (Aussehen: Figur, Farbe, Emblem; Gold/Oliv ab Lochagos, Gravur ab Strategos, dauerhaft; Avatar in der Kopfzeile von Heute) in `ww-v99`; die Verknüpfung mit der Zukunfts-Ich-Figur später. Weitere Freischaltungen aus der Rangtabelle (Tagesplan, Optik, Saisonkarte) folgen; die kleine Variante bringt noch keine halben Punkte · Gilt für THE WAR WITHIN ab Release nach `ww-v92`.

Prüffrage für jede Entscheidung: **Versteht ein neuer Nutzer sofort, was er heute tun kann, und hat er Lust darauf?**

---

## 1. Kernkonzept

> Du baust deinen Charakter, indem du ihn im Alltag spielst.

- **Ein Charakter, zwei Zeitachsen.**
  - **Erfahrung** (dauerhaft): Fähigkeiten, Werte, Erkenntnisse, Tempel-Galerie, Lebensrang. Sie geht nie verloren.
  - **Saison** (4 Wochen): Saisonpunkte starten bei 0, der Saisonrang steigt durch ausgeführte Handlungen. Jede Saison ist ein frischer, fairer Lauf.
- **Ein Ziel-Charakter als Kompass.** Der Nutzer wählt ein Zukunftsbild („Wer willst du werden?“). Daraus entstehen Werte, Ziele und wenige Routinen.
- **Eine Hauptschlacht pro Tag.** Heute zeigt genau eine Handlung, die am meisten zählt. Alles andere ist optional.
- **Mehr Plätze sind Angebot, kein Soll.** Höhere Ränge schalten Plätze und Funktionen frei. Punkte gibt es pro Tag aber nur für wenige Handlungen. Viele Aufgaben bringen also nicht mehr.

**Begründete Grundentscheidungen**

| Entscheidung | Warum |
|---|---|
| Nur **eine** sichtbare „Saison“ (4 Wochen). Die 12-wöchige Tempelsaison heißt künftig **„Kapitel“** (ein Kapitel = drei Saisons). | Der UX-Durchgang hat gezeigt: „Saison 1“ und „Saison 4“ gleichzeitig verwirren. Ein Wort, eine Bedeutung. |
| Zukunftscharakter und Stärken/Herausforderungen sind **zwei getrennte Schritte**. | Der Zukunftscharakter beschreibt das Ziel (wohin), die Eigenschaften die Ausgangslage (woher). Beides zusammen ergibt passende Vorschläge. |
| Punkte nur für **Hauptschlacht + bis zu 2 Nebenplätze pro Tag**. | Das verhindert Aufgaben-Inflation und hält den Plan klein. |
| Ruhetage zählen als **geplante Pause**, verpasste Tage als **neutral**. Es gibt keine Abzüge. | Das Produktprinzip und Codex' Wiedereinstieg schließen Scham und Strafe aus. |
| Optik: **3 Entscheidungen** im Einstieg (Figur, Farbe, Emblem). Mehr später. | Der erste Charakter ist in unter 30 Sekunden fertig. |

---

## 2. Einstieg: Bildschirme mit Beispieltexten

Regeln: eine Hauptaktion pro Bildschirm, jeder Schritt überspringbar, „Später weitermachen“ ab Schritt 3. Der Einstieg dauert etwa 3 Minuten. Die Reihenfolge folgt dem Produktprinzip: erst erkennen (1–3), dann Verantwortung übernehmen (4–6), dann Standards (7) und schließlich Handeln (8–9).

| # | Bildschirm | Beispieltext | Hauptaktion |
|---|---|---|---|
| 1 | **Willkommen** | „Werde, wer du sein kannst. In 3 Minuten steht dein Charakter, heute machst du den ersten Schritt.“ | **Los geht's** |
| 2 | **Ausgangslage** · 4 Regler 1–10 (Gesundheit, Persönliche Entwicklung, Beziehungen, Finanzen) | „Wo stehst du gerade? Es gibt kein richtig oder falsch. Nur deine ehrliche Einschätzung.“ | **Weiter** |
| 3 | **Was du mitbringst** · Fähigkeiten als Chips (z. B. Laufen, Kochen, Sprachen, Organisieren, Zuhören) + eigene | „Was kannst du schon? Das bleibt dir. Auch wenn eine neue Saison beginnt.“ | **Weiter** |
| 4 | **Zukunftscharakter** · 6 kleine Icons | „Wer willst du werden? Wähl, was dich anspricht. Du kannst es jederzeit ändern.“ | **Diesen Weg wählen** |
| 5 | **Werte & Ziel** · 3 vorgeschlagene Werte (aus dem Charakter), 1 Ziel | „Was willst du können, erreichen und im Alltag verkörpern? Ein Ziel reicht für den Anfang.“ | **Übernehmen** |
| 6 | **Stärken & Herausforderungen** · 4 Charakterpunkte (vorhandene Auswahl, `character-core.js`) | „Stärken kosten Punkte, Herausforderungen geben welche zurück. Sie bestimmen, welche Vorschläge du bekommst. Niemand wird bestraft.“ | **Weiter** |
| 7 | **Routinen vorschlagen** · 3 Vorschläge mit kleiner Variante | „Das schlagen wir dir vor. Du entscheidest, was gilt.“ Je Routine: an/aus, Häufigkeit, kleine Variante. | **Diese Routinen übernehmen** |
| 8 | **Schwerpunkt** · Lebensbereich wählen, vorbelegt mit dem niedrigsten Wert aus 2 | „Ein Bereich zuerst. Die anderen laufen ruhig mit.“ | **Schwerpunkt setzen** |
| 9 | **Dein Charakter** · Figur, Farbe, Emblem (je 3–4 Optionen) + Zusammenfassung | „Das bist du heute. Und das ist dein erster Schritt: *10 Min. Spaziergang nach dem Mittag*.“ | **Ersten Schritt jetzt machen** |

Beim Überspringen werden Vorbelegungen genutzt: Zukunftscharakter „Freie Wahl“, keine Eigenschaften, ein Standardvorschlag je Schwerpunkt. Übersprungenes wird später im **Fundament** in Prinzip-Reihenfolge angeboten (wie heute in `docs/FTUE.md`).

---

## 3. Heute-Ansicht

```
MITTWOCH, 25. NOVEMBER                     ⋯  (Avatar)
HEUTE                         Saison 2 · Hoplit 🛡 38/60
─────────────────────────────────────────────────────
HAUPTSCHLACHT · Gesundheit (Schwerpunkt)
  10 Min. Spaziergang nach dem Mittag
  [        Erledigt        ]   Kleine Variante: 3 Min. ums Haus
─────────────────────────────────────────────────────
NEBENPLÄTZE (optional)                          1 / 2
  ○ 5 Seiten lesen                          ☐
  + Platz frei: Routine wählen
─────────────────────────────────────────────────────
Im Blick:  [Tagesplan]  [ab 18:00 Tagesrückblick]
Fortschritt und Zukunfts-Ich ▾     Standards ▾
```

- **Oben:** Saison und Saisonrang mit Balken. Im Fokusmodus und in der ruhigen ersten Woche ist der Balken ausgeblendet.
- **Hauptschlacht:** eine Handlung aus dem Schwerpunkt. Ein Tipp erledigt sie. Die **kleine Variante** zählt voll für Konstanz und Tempel und bringt die halben Saisonpunkte. Sie ist ausdrücklich kein Versagen.
- **Nebenplätze:** zu Beginn 1, später bis 3. Leere Plätze bleiben leer, ohne Mahnung.
- **Ruhetag:** Die Karte zeigt „Ruhetag. Erholung gehört zum Plan.“ und keinen Balken.
- **Nach Lücke:** Codex' Wiedereinstieg („Ein Schritt für heute“) ersetzt die Hauptschlacht-Auswahl.
- **Erfolg:** Kurze Sieg-Rückmeldung auf der Karte (vorhanden), dazu ein Punkte-Hinweis „+8 Saisonpunkte“ und 5 s Rückgängig.

---

## 4. Beispiele

### Zukunftscharakter (6 Icons, Antik-Stil)

| Icon | Name | Werte | Entwicklungsrichtung | Erste Routinen-Idee |
|---|---|---|---|---|
| 🛡 Schild | **Die Hüterin / Der Hüter** | Verlässlichkeit, Fürsorge, Ruhe | Für sich und andere da sein | Täglich 1 Nachricht an einen Menschen |
| 🏃 Läufer | **Die Athletin / Der Athlet** | Ausdauer, Disziplin, Energie | Körperlich stark und belastbar | 3× pro Woche 20 Min. Bewegung |
| 📜 Schriftrolle | **Die Gelehrte / Der Gelehrte** | Neugier, Tiefe, Klarheit | Lernen und verstehen | 15 Min. lesen oder lernen |
| ⚒ Hammer | **Die Baumeisterin / Der Baumeister** | Ausdauer, Handwerk, Verantwortung | Etwas Eigenes aufbauen | 25 Min. fokussiert am Projekt |
| 🦉 Eule | **Die Strategin / Der Stratege** | Weitsicht, Ordnung, Freiheit | Finanzen und Zeit im Griff | Wöchentlicher 10-Min.-Geldcheck |
| ✦ Stern | **Freie Wahl** | selbst gewählt | eigenes Bild | aus dem eigenen Ziel |

Mehrfachauswahl ist erlaubt (max. 2). Werte werden nur vorgeschlagen und lassen sich ersetzen. Der Zukunftscharakter wird auch zur Figur im **Zukunfts-Ich** (bestehendes `future-self-core.js`), es gibt keine zweite Figur.

### Stärken und Herausforderungen

Die vorhandene Auswahl aus PR #38 bleibt die Grundlage (4 Charakterpunkte, 4 Stärken, 4 Herausforderungen). Ergänzt wird nur ein Satz, **wie** die Auswahl die Vorschläge beeinflusst. Er erscheint direkt auf der Karte:

| Eigenschaft | Formulierung | Wirkung auf Vorschläge |
|---|---|---|
| Gut organisiert (Stärke) | „Klare Abläufe liegen dir.“ | Routinen kommen mit festem Auslöser („nach dem Frühstück“). |
| Ausdauernd (Stärke) | „Du bleibst gern lange dran.“ | Laufende Routinen werden beibehalten statt erweitert. |
| Leicht ablenkbar (Herausforderung) | „Dein Fokus springt manchmal weiter.“ | Routinen bekommen einen kurzen Zeitraum ohne Handy. |
| Alles oder nichts (Herausforderung) | „Kleine Schritte fühlen sich manchmal zu wenig an.“ | Die kleine Variante wird vorab festgelegt und hervorgehoben. |

### Routinen mit kleiner Variante

| Routine | Häufigkeit | Kleine Variante (schwierige Tage) |
|---|---|---|
| 20 Min. laufen | 3× pro Woche | Schuhe an, 5 Min. gehen |
| 15 Min. lesen | 5× pro Woche | 1 Seite |
| 10 Min. Spanisch | täglich | 1 Vokabel-Runde (2 Min.) |
| Wöchentlicher Geldcheck | 1× pro Woche | Kontostand ansehen |
| Nachricht an einen Freund | 3× pro Woche | Ein Emoji schicken |

---

## 5. Saison, Ränge und Freischaltungen

### Saison (4 Wochen)

- Saisonpunkte starten bei 0. Punkte gibt es nur für **ausgeführte Handlungen**, die bestehende Formel und die Wochenlimits bleiben.
- **Tageslimit für Punkte:** Hauptschlacht + 2 Nebenplätze. Weitere Erledigungen zählen für Ziele, Tempel und Konstanz, aber nicht mehr für Saisonpunkte. Hinweis: „Heute ist dein Punkte-Soll voll. Alles Weitere zählt für dich, nicht für die Wertung.“
- Ergebnisse eines Ziels (Messwerte) stehen getrennt unter „Ergebnisse“ und bringen keine Saisonpunkte. Das gilt schon heute.

### Saisonränge (setzen pro Saison zurück)

| Rang | Saisonpunkte | Freischaltung (Angebot) |
|---|---|---|
| **Rekrut** | 0 | Hauptschlacht + 1 Nebenplatz |
| **Hoplit** | 60 | 2. Nebenplatz |
| **Veteran** | 160 | Tagesplan mit festen Uhrzeiten · Wochenrückblick mit Experimenten |
| **Lochagos** | 300 | 3. Nebenplatz · Charakter-Optik: zweite Farbpalette |
| **Strategos** | 480 | Saisonkarte zum Teilen · Emblem-Gravur |

Ein realistischer kleiner Plan reicht für Hoplit in Woche 1 und für Veteran bis Saisonmitte. Beispiel: Hauptschlacht täglich (Ø 7 Pkt.) + 1 Nebenplatz an 4 Tagen ergibt etwa 75 Punkte pro Woche.

**Freigeschaltet bleibt freigeschaltet.** Eine Funktion, die man einmal erreicht hat, bleibt auch in der nächsten Saison verfügbar. Das ist dauerhafte Erfahrung. Zurückgesetzt werden nur Punkte und Saisonrang. Nebenplätze sind also eine Saison-Belohnung beim ersten Erreichen und danach dauerhaft nutzbar, aber nie Pflicht.

### Erfahrung (dauerhaft)

- **Lebensrang** = vorhandenes `rankOf` (Rekrut … Strategos aus Einheiten, Rückblicken und erreichten Zielen). Er wird umbenannt in **„Erfahrung“** mit eigenen Stufen (Lehrling → Geselle → Meister → Weiser), damit er nicht mit dem Saisonrang verwechselt wird.
- **Fähigkeiten:** Chips aus dem Einstieg. Neue entstehen, wenn ein Ziel erreicht oder ein Experiment bewährt ist („Neue Fähigkeit: Morgens laufen“).
- **Kapitel** (12 Wochen = 3 Saisons): Tempel mit Galerie, unverändert nach `TEMPLE_RULES`.

---

## 6. Beispieldurchlauf: Lena, erster Start bis erste Freischaltung

| Tag | Was passiert | Bildschirm/Text |
|---|---|---|
| **Tag 1, 12:40** | Lena installiert die App, wählt Ausgangslage (Gesundheit 3, Finanzen 6), Fähigkeiten „Kochen, Organisieren“, Zukunftscharakter **Athletin**, Werte *Energie, Disziplin*, Ziel „5 km am Stück laufen“. Stärke *Gut organisiert*, Herausforderung *Alles oder nichts*. | „Das bist du heute. Dein erster Schritt: 10 Min. Spaziergang nach dem Mittag.“ |
| Tag 1, 12:45 | Sie übernimmt 2 Routinen: *20 Min. laufen 3×/Woche* (klein: „Schuhe an, 5 Min. gehen“), *Abends 10 Min. dehnen*. Schwerpunkt Gesundheit. Ersten Schritt sofort erledigt. | Sieg-Rückmeldung · „+7 Saisonpunkte · Rekrut 7/60“ |
| Tag 2–3 | Hauptschlacht „Laufen“ erledigt, Dehnen einmal als kleine Variante. | „Kleine Variante zählt. Konstanz 3/3 Tage.“ |
| Tag 4 | Verpasst. | Nichts Negatives. Tag 5 zeigt normal die Hauptschlacht. |
| Tag 5 | Laufen erledigt, Nebenplatz „Dehnen“ erledigt. | |
| **Tag 6** | 61 Punkte. | **„Hoplit erreicht. Neu verfügbar: ein zweiter Nebenplatz. Du kannst ihn nutzen oder freilassen.“** · Buttons: *Platz füllen* / *Später* |
| Tag 7 | Wochenrückblick (60 Sek.): 3 von 3 Läufen, Vorschlag aus *Alles oder nichts*: „Lege für Dehnen eine kleine Variante fest.“ | Optional. |

---

## 7. Einführung in die bestehende App (Spielstände bleiben erhalten)

**Datenmodell (additiv, versioniert):**

- `S.life.persona = {v:1, ids:['athlete'], values:[...], skills:[...], look:{fig,col,emb}}`. Fehlt es, wird nichts angezeigt außer einer Einladung im Fundament.
- `S.life.character` (vorhanden) bleibt unverändert.
- `S.unlocks = {slots:1, dayplan:false, …, v:1}`. **Migration:** Bestehende Spielstände bekommen alle Funktionen, die sie heute schon nutzen. Niemand verliert etwas. `slots` wird aus der bisherigen Nutzung abgeleitet, mindestens 2.
- Saisonrang wird aus vorhandenen `seasonPts` berechnet, ohne neue Speicherung. Das Tageslimit für Punkte gilt erst ab der nächsten Saison, damit eine laufende Saison fair bleibt.
- Tempel heißt in der Oberfläche „Kapitel“. Daten und `TEMPLE_RULES` bleiben unverändert.

**Bestehende Nutzer** sehen beim nächsten Öffnen einmalig: „Neu: Wähle deinen Zukunftscharakter. 1 Minute, jederzeit änderbar.“ mit den Knöpfen *Jetzt* und *Später*. Es gibt keinen erneuten Einstieg.

**Was wiederverwendet wird:** Onboarding-Gerüst (`OB_SCREENS`, Überspringen/Pausieren), Charakterauswahl (`character-core.js`), Routinen mit kleiner Variante (`changeRoutine`, `smallFor`), Hauptschlacht, Wiedereinstieg, Zukunfts-Ich-Figur, Tempel.

**Neu zu bauen (in dieser Reihenfolge, je ein kleiner PR):**

1. Begriffe: „Kapitel“ statt Tempelsaison, „Erfahrung“ für den Lebensrang.
2. Saisonrang + Tageslimit für Punkte + Nebenplätze nach Rang.
3. Zukunftscharakter-Auswahl (Bildschirm 4–5) inklusive Einladung für bestehende Nutzer.
4. Fähigkeiten-Chips (Bildschirm 3) und „Neue Fähigkeit“-Ereignis.
5. Routinenvorschläge im Einstieg (Bildschirm 7) aus Zukunftscharakter + Eigenschaften.
6. Optik-Auswahl (Bildschirm 9) mit späteren Freischaltungen.

**Grenzen:** keine Strafen, keine Punktabzüge, keine Pflicht-Freischaltungen. Arena-Wertung bleibt unabhängig. Private Freitexte bleiben auf dem Gerät.

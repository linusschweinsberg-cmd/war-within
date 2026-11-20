# THE WAR WITHIN – Life OS

Stand: Branch `claude/life-os`. Die App bleibt eine statische Seite (GitHub Pages). Neu ist ein eigenständig testbarer Logik-Kern.

## Architektur

| Datei | Aufgabe |
|---|---|
| `life-core.js` | Reine Logik ohne UI: Lebensbereiche, Zielvorlagen, Diagnose-Regeln, Vorschläge, Experimente, Migration. Hängt sich als `window.LC` an. |
| `index.html` | UI (React + htm). Abschnitt „LIFE OS“ enthält Heute, Mein Leben, Reflexion, Ziel-Formular, Wochenrückblick und die neuen Onboarding-Schritte. |
| `tests/life-core.cjs` | Szenarien: neuer Nutzer, Migration, verpasste Woche, Experiment erfolgreich/erfolglos, Stagnation trotz Aktivität, Zieländerung, Ziel erreicht, Reload. |
| `tests/release-smoke.cjs` | Gesamtes Skript, neues Onboarding, Briefing-Reihenfolge, keine Demo-Missionen in echten Konten. |

## Datenmodell (`S.life`, Version 1)

Getrennt nach Zweck, alles im bestehenden Spielstand unter `S.life`:

- `values` und `S.principles`: Kompass (bestehende Werte-Struktur wird weiterverwendet)
- `why`: `{text, q:{matters,time,meaning,fulfil,people}}`, optional
- `areas`: `{health|relationships|wealth|growth: {sat:1–5}}`, `focus`: Bereich mit Priorität
- `goals[]`: Ziel mit **Ergebnis-Messgröße** `metric {name, unit, fmt, dir:'up'|'down', start, target, src:'measured'|'self'}`, `weeks`, `status`, `changes[]` (Änderungsverlauf), `method` (Vorschlag bei Stagnation)
- `actions[]`: **Prozess**, verknüpft über `missionId` mit einer Mission. `perWeek`, `hist[]` (Planänderungen pro Woche, damit Vergangenheit unverändert bleibt), optional `when`, `minutes`, `anchor`, `rule`
- `meas[]`: Messwerte `{goalId, v, d}`
- `log[]`: erledigte Handlungen `{aid, d, wk}` (aus `complete()`)
- `daily[]`: Hindernisse aus dem Tages-Check-in
- `reviews[]`: Wochenrückblicke mit Umsetzungsquote, Erkenntnissen, Hindernis und gestartetem Experiment
- `exps[]`: Experimente `{hypothesis, change, criterion:{min, outcome}, startWk, endWk, status, prev}`
- `d`: absoluter Tageszähler (läuft über Saisons hinweg), Woche = `floor(d/7)`

Punkte, Liga und Nemesis bleiben unverändert im bisherigen Spielstand. Messwerte bringen keine Punkte.

## Migration bestehender Daten

`LC.ensureLife(S)` läuft beim Laden (idempotent):
- Zufriedenheit und Priorität aus `profile.sat` / `profile.priorities` werden zu den vier Bereichen.
- Alte Ziele (`S.goals`) werden zu Zielen mit **Ergebnisgröße** umgedeutet: Sparen → Rücklage (€, Startwert = bisher gespart), 5-km-Ziel → 5-km-Zeit (weniger ist besser) statt „Anzahl Läufe“, Halbmarathon → längster Lauf (km), Lernziel → Einstufungstest (%).
- Passende bestehende Missionen werden als Handlung verknüpft; in der laufenden Woche bereits Erledigtes wird übernommen.
- Alte Daten werden nicht gelöscht (`S.goals` bleibt erhalten).

## Adaptive Verbesserung (transparente Regeln, keine KI)

Diagnose pro Ziel und Woche (`LC.diagnose`):

| Code | Regel | Folge |
|---|---|---|
| `missed` | 0 Einheiten | Neustart mit halbem Pensum |
| `low` / `partial` | < 50 % / < 80 % umgesetzt | Hindernis abfragen |
| `stalled` | ≥ 80 % umgesetzt, Ergebnis flach oder schlechter | Methode ändern, nicht die Menge |
| `measure` | ≥ 80 %, aber keine Messwerte | Messwert eintragen |
| `working` | ≥ 80 % und Ergebnis besser | beibehalten |
| `achieved` | Zielwert erreicht | Ziel abschließen |

Vorschläge (`LC.suggest`) berechnen sich aus Hindernis, geplanten und erledigten Einheiten der Handlung (z. B. Energie → „2 kürzere Einheiten morgens“). Ein Experiment ändert die Handlung ab der Folgewoche, speichert den alten Stand und wird im nächsten Rückblick geprüft: übernehmen, zurücknehmen oder verlängern. Pro Ziel läuft höchstens ein Experiment.

## Bewusst nicht umgesetzt / kritische Punkte

- **Simulierte Zeit:** Tage wechseln weiter nur über „Zum nächsten Tag vorspulen“ (Prototyp). Für echten Alltagseinsatz muss der Tageswechsel an das Kalenderdatum gekoppelt werden; das betrifft Saison-, Liga- und Nemesis-Logik und ist der wichtigste nächste Schritt.
- **Keine Cloud-Synchronisierung:** Spielstand bleibt im `localStorage` des Geräts, auch bei E-Mail-Konto.
- **Liga, Mitspieler, Health-Sync** bleiben simuliert und sind unter „Arena“ als optional gekennzeichnet; im Fokusmodus ausgeblendet.
- Saisonpfad, Lebensmatrix und Rechner existieren weiter im erweiterten Modus; sie sollten mittelfristig auf Ergebnisdaten umgestellt oder entfernt werden.

## Modularer Migrationsplan

1. (erledigt) Reine Logik in `life-core.js` herauslösen, mit Node testen.
2. Weitere Logikblöcke nach demselben Muster herauslösen: `nemesis-core.js` (Tagesplan), `season-core.js` (Punkte, Saison, Liga).
3. Umstieg auf Vite + React mit ES-Modulen; `life-core.js` wird unverändert als Modul importiert. Build-Ausgabe nach `dist/`, GitHub Action deployt `dist/` auf Pages, Service Worker mit generierter Asset-Liste.
4. UI-Komponenten pro Ansicht in eigene Dateien (`Today`, `MyLife`, `Progress`, `Reflect`, `Onboarding`, `Arena`).
5. Echter Tageswechsel nach Kalenderdatum, danach optional Sync über Supabase-Tabellen pro Nutzer.

## The Life Temple

Visualisierung des Lebenskonzepts als Tempel: Fundament = Werte, Warum und Rückblicke; vier Säulen = Health, Relationships, Wealth, Growth; Dach = wächst mit der Phase des ganzen Tempels. Umsetzung als SVG (`TempleSVG`, `TempleColumn`), keine Bilddateien.

**Drei getrennte Ebenen:** Handlung (`life.log`), Ergebnis (`life.meas`), Tempel (`life.temple.cur.ms`). Tempelpunkte sind symbolisch und werden nie mit Ergebnissen verrechnet.

**Datenmodell** (`S.life.temple`): `cur {n, startWk, d0, logFrom, len (12), ms[], wx{}}`, `hist[]` (Schnappschüsse früherer Saisons), `weather`, `anim`. Gespeichert werden nur freigeschaltete Bausteine; Stufen, Phase und Fundament werden berechnet (`templeState`). Bausteine bleiben dauerhaft.

**Bauregeln** (`TEMPLE_RULES`, je Säule und Saison gedeckelt):

| Baustein | Punkte | max. | Bedingung |
|---|---|---|---|
| Grundstein | 1 | 1 | erste erledigte Ziel-Handlung im Bereich |
| Konstante Woche | 1 | 12 | abgeschlossene Woche mit ≥ 80 % der geplanten Ziel-Handlungen |
| Wiederaufgenommen | 1 | 2 | konstante Woche nach einer Woche ohne Umsetzung |
| Ergebnis-Meilenstein | 2 | 4 | Messwert erreicht 25/50/75 % des Ergebniswegs (nach der Startwoche des Ziels) |
| Ziel erreicht | 3 | 2 | Zielwert erreicht (nicht in der Anlagewoche), Gravur |
| Bewährte Anpassung | 2 | 3 | Experiment bestätigt, Emblem |
| Restauriert | 1 | 2 | nach dokumentierter Verschlechterung wieder verbessert |

Stufen: Ruine 0 · Wiederaufbau 2 · Stabil 6 · Stark 11 · Meisterschaft 17 Punkte. Phase = abgerundeter Durchschnitt der Säulenstufen (max. 4); Mastery nur, wenn alle Säulen Stufe 5 erreichen.

**Rückschritte:** Verwitterung erscheint nur bei gemessener Verschlechterung eines aktiven Ziels, nie bei fehlenden Daten oder verpassten Tagen; abschaltbar. Punkte werden nie abgezogen.

**Saison:** Standard 12 Wochen (8/12/16 wählbar), getrennt von der 4-Wochen-Liga-Saison der Arena. Abschluss speichert den Tempel in der Galerie; Ziele, Messwerte und Erkenntnisse bleiben. Ein Abschluss mitten in der Woche zählt nichts doppelt.

**Bekannte Grenze:** `life.log` wird auf 2000 Einträge gekürzt; danach stimmt `logFrom` für den Grundstein nicht mehr exakt.

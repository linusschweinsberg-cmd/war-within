# Gewohnheiten (ww-v113)

Bewährte Prinzipien der Gewohnheitsbildung, in eigenen Worten, ohne Zitate. Die Tabelle zeigt, was die App schon hatte und was ww-v113 ergänzt.

| Prinzip | In der App | Stand |
|---|---|---|
| Sichtbar machen: fester Auslöser | Auslöser je Standard, Tagesplan, „Zur geplanten Zeit starte ich mit …“ | vorhanden |
| Leicht machen: kleinste Version | Minimum je Standard, kleine Variante, Wiedereinstieg | vorhanden |
| An Bestehendes koppeln | Auslöser „nach …“ | vorhanden |
| Identität statt Ergebnis | Zukunftsbild, Leitbild; **neu:** jede Ausführung zeigt „Ein Beleg für: <dein Satz>“ | ergänzt |
| Befriedigend machen: sofort sehen | Sieg-Rückmeldung, Wochenzähler; **neu:** 7-Tage-Spur je Standard | ergänzt |
| Nicht zweimal in Folge auslassen | **neu:** ruhiger Hinweis, wenn die Lücke länger ist als üblich | ergänzt |
| Anpassen statt aufgeben | Wochenrückblick, Experimente, Pause ohne Nachholpensum | vorhanden |

## Regeln

- **Spur** (`LC.standardTrace`): die letzten sieben Spieltage, heute zuletzt. `std` = volle Ausführung, `min` = Minimum. Verknüpfte Standards zählen über ihre Zielhandlung (`life.log`).
- **Lücke** (`LC.standardGap`): Tage seit der letzten Ausführung, heute nicht mitgezählt.
- **Nie zweimal auslassen** (`LC.standardSlipping`): Hinweis, wenn die Lücke mindestens `ceil(7 / pro Woche) + 1` Tage beträgt. Täglich: ab 2 Tagen, 3×/Woche: ab 4 Tagen, 1×/Woche: ab 8 Tagen. Kein Hinweis, wenn heute schon ausgeführt, pausiert, Ruhetag oder noch nie ausgeführt.
- **Identitätsstimme** (`identityVote`): nutzt den eigenen Satz aus „Wer könntest du werden?“ (`life.future.identity`). Nur Anzeige, keine Speicherung oder Übertragung.

Keine neuen Punkte, Schwellen, Benachrichtigungen oder Daten. Alles wird aus vorhandenen Logs berechnet und verändert den Spielstand nicht.

Prüfung: `node tests/habit-loop.cjs`.

# Integritätsprüfung – Kandidat ww-v137

## Bestätigter Fehler

Die Plus-/Minus-Schaltflächen am Ziel, die freiwillige Wochenplanreduktion beim Wiedereinstieg und Anpassungen aus dem Wirkungsmodell nutzen `setActPerWeek`. Dieser Ablauf änderte bisher Zielhandlung und Mission direkt. Ein verknüpfter Standard behielt dabei seine bisherige Wochenhäufigkeit, anders als bei der Routinenbearbeitung.

Beispiel: Zielhandlung und verknüpfter Standard haben drei Einheiten pro Woche. Nach Reduktion über die Schaltfläche auf zwei zeigte die Zielhandlung zwei, der Standard weiterhin drei als Soll.

## Korrektur

`setActPerWeek` nutzt jetzt den bestehenden gemeinsamen Ablauf `LC.changeRoutine`. Dieser aktualisiert Zielhandlung, Mission und verknüpfte Standards zusammen. Titel, Auslöser, kleine Variante, Dauer und Pausenzustand der Handlung bleiben erhalten. Bestehende Erledigungen und verdiente Punkte werden nicht umgeschrieben.

## Nachweis

Die neue Regression in `tests/personal-scoring.cjs` scheiterte vor der Korrektur mit `3 !== 2`. Sie verwendet den tatsächlichen App-Callback und prüft beide Wochenpläne, frühere Wochen, wiederholte Änderungen innerhalb einer Woche, unveränderte Punkte und Logs sowie JSON-Neuladen. Der bestehende Wiedereinstiegstest prüft weiter den Rückgängig-Aufruf der Planreduktion.

Keine neue Oberfläche. Release-URLs und Service-Worker-Cache tragen ww-v137. Lokal, nicht gemergt oder veröffentlicht. Keine manuelle Browser- oder echte Kontoprüfung in diesem Durchlauf.

Bestanden: `personal-scoring`, `reentry`, `routine-loop`, `routine-safety`, `temple-standards`, `progress-charts`, `life-core`, `rank-core`, `calendar`, `today-battle`, `habit-loop`, `projection-core`, `release-smoke`, `auth-contract` und `service-worker` (jeweils `node tests/<Name>.cjs`). `git diff --check` ohne Befund.

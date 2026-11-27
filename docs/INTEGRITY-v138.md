# Integritätsprüfung – Kandidat ww-v138

## Bestätigte Fehler

Die Listen blendeten pausierte Zielhandlungen aus, der zentrale `complete`-Callback prüfte den Pausenzustand jedoch nicht. Ein Aufruf aus einer noch vorhandenen Detailansicht konnte deshalb Punkte, Erfahrung und einen Tempelgrundstein erzeugen. Der Regressionstest mit dem tatsächlichen App-Callback zeigte diese unerwarteten Spielstandsänderungen.

`start` prüfte außerdem den Erledigungszustand, bevor es die Existenz der Mission geprüft hatte. Eine inzwischen entfernte Mission konnte dadurch einen Fehler beim Zugriff auf ihre ID auslösen.

## Korrektur und Nachweis

`missionBlocked` prüft die Existenz der Mission sowie bei zugehörigen Zielhandlungen deren Entfernung, Pause und den aktiven Zielstatus. `start` und `complete` verwenden dieselbe Prüfung. Der funktionale State-Update prüft zusätzlich die aktuell vorhandene Mission, bevor Einträge oder Punkte entstehen.

`personal-scoring` prüft tatsächliche App-Callbacks für pausierte Handlungen, entfernte Missionen, ausgeschaltete Handlungen sowie archivierte, erreichte und fehlende Ziele. Diese Fälle verändern den Spielstand nicht. Nach Wiederaufnahme funktioniert die reguläre Wertung einschließlich Erfahrung und Tempelgrundstein. Der bestehende Quelltext-Check in `today-battle` wurde an die Prüfung der aktuellen Mission angepasst.

17 Suiten bestanden: `personal-scoring`, `reentry`, `routine-loop`, `routine-safety`, `temple-standards`, `progress-charts`, `life-core`, `rank-core`, `calendar`, `today-battle`, `today-focus`, `today-dayflow`, `habit-loop`, `action-feedback`, `release-smoke`, `auth-contract`, `service-worker` (jeweils `node tests/<Name>.cjs`). `git diff --check` ohne Befund. Keine manuelle Browser- oder echte Kontoprüfung in diesem Durchlauf.

Keine neue Oberfläche oder Punkteformel. Eigene Skript-URLs und Service-Worker-Cache tragen ww-v138. Lokal, kein Merge und kein Deployment.

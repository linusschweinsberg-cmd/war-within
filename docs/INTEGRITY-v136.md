# Integritätsprüfung – Kandidat ww-v136

## Bestätigter Fehler und Korrektur

Die dauerhafte Erfahrung zählte Zielhandlungen über `life.log.length`. `onComplete` begrenzt dieses Protokoll auf 2.000 Einträge. Ab der nächsten Handlung stieg die Erfahrung deshalb nicht weiter, obwohl die Handlung erfasst wurde. Eigenständige Standards besaßen bereits einen dauerhaften Zähler.

`life.actionSessions` bewahrt nun auch die Zahl der Zielhandlungen unabhängig vom Detailprotokoll. Ohne Zähler gilt für alte Spielstände die vorhandene Protokolllänge. Der erste neue Abschluss übernimmt diesen Stand. Bereits verlorene frühere Einträge werden nicht geschätzt.

## Regression

`tests/personal-scoring.cjs` reproduzierte vor der Korrektur den Fehler `2000 !== 2001`. Der Test verwendet den tatsächlichen App-Abschluss mit gefülltem Altprotokoll, prüft vollständiges Rückgängig sowie weitere Abschlüsse, Entfernen der Handlung, JSON-Neuladen und die gemeinsame Summe mit eigenständigen Standards.

Punkteberechnung, Wochenstände, Minimum und Tempel bleiben nach ihren jeweiligen Regeln getrennt. Kein neues Fortschrittssystem und keine neue Oberfläche. Eigene Skript-URLs und Service-Worker-Cache tragen ww-v136. Kandidat lokal; kein Merge oder Deployment.

Bestanden: `personal-scoring`, `routine-safety`, `temple-standards`, `progress-charts`, `life-core`, `rank-core`, `calendar`, `today-battle`, `habit-loop`, `release-smoke`, `auth-contract` und `service-worker` (jeweils `node tests/<Name>.cjs`). `git diff --check` ohne Befund. Keine neue manuelle Browserprüfung; kein echter Konto-/Mehrgeräte-Test.

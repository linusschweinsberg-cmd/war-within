# Vom Versuch zur Routine (ww-v92)

Stufen: Ein Versuch und die freiwillige Rückmeldung dienen der Selbsterkenntnis. Die bewusste Übernahme ist Eigenverantwortung; die Routine verwendet persönliche Standards oder bestehende Zielhandlungen. Ihre Ausführung und Anpassung nutzen den bisherigen Success Loop.

## Ablauf

1. Eine eigene Handlung gilt einmalig heute. „Neugierig“ verlangt zusätzlich die ausdrückliche Wahl heute/morgen und zeigt vor der Übernahme: einmalig, kein Wochen-Soll. Am Ruhetag ist heute gesperrt. Eine verpasste Gelegenheit wird nicht nachgeholt.
2. Nach der Erledigung bleiben Rückmeldung, einmalige Wiederholung und „Regelmäßig machen“ erreichbar. Der Versuch bleibt auch neben Zielen auf Heute sichtbar; abgeschlossene ältere Versuche stehen im Wochenrückblick.
3. Die Routine verlangt nur Handlung, Bereich und 1–7 Ausführungen pro Woche. Auslöser, Dauer und kleine Variante sind optional. Erst die zweite Ansicht bestätigt die Folgen. Ohne Ergebnisziel entsteht ein persönlicher Standard; optional kann eine vorhandene Zielhandlung unverändert verknüpft werden. Keine zweite Routinenliste, kein zusätzliches Ziel und keine neue Fortschrittsberechnung.
4. Besteht bereits ein Standard, kann er bewusst bearbeitet werden; alternativ bleibt der Versuch einmalig oder wird einem anderen Bereich zugeordnet. Wiederholtes Bestätigen legt nichts doppelt an. Verknüpfte Handlungen zählen weiterhin nur über ihre Zielhandlung.
5. Auf Heute stehen Wochenhäufigkeit, Auslöser und gespeicherte kleine Variante. Die volle Handlung und die kleine Variante haben getrennte Bestätigungen. Minimum eines Standards und einmaliger kleiner Wiedereinstieg behalten ihre bisherige Bedeutung. Kein voller Ziel-Handlungslog, keine vollen Punkte oder Ergebniswerte durch eine kleine Zielvariante.
6. Bearbeiten/Pausieren ist auf Heute, in den Aufgabendetails, den Zielkarten und im Rückblick erreichbar. Die Vorschau nennt alte/neue Häufigkeit, Auslöser und Gültigkeit ab der laufenden Woche. Pausen laufen bis zur eigenen Wiederaufnahme, ohne Nachholpensum. Änderungen nutzen vorhandene Planhistorien; abgeschlossene Wochen und Logs bleiben erhalten.
7. Der Wochenrückblick verwendet vorhandene Versuchsrückmeldungen, Standardstände und Handlungslogs. Beibehalten, kleiner planen, Auslöser ändern und pausieren sind ausdrückliche Entscheidungen. Die bestehenden Diagnose-/Experimentvorschläge bleiben; die Experimentvorschau zeigt Änderung, Startwoche und Kriterium. Wenige Einträge belegen keine Ursache. „Ausdauernd“ bietet Beibehalten oder einen Auslöser an, keine pauschale Steigerung.

Alle neuen Bestätigungen verwenden das gemeinsame Fünf-Sekunden-Rückgängig. Bestehende Schwellen, Obergrenzen, Punkte und Arena-Regeln werden nicht geändert. Wochenhäufigkeiten erzeugen keine festen Wochentage oder Uhrzeiten.

## Daten und Abwärtskompatibilität

Alle Ergänzungen liegen optional in `S.life` und bleiben lokal. Der JSON-Export enthält sie wie bisher. Kein neuer Netzwerkaufruf, keine Benachrichtigung oder produktive Migration.

- `trial` / `trialNext`: bisher `{d,text,done,helped}`, zusätzlich optional `area`, `goalId`, `src`, `routine:{area,aid,wk}`. `routine` sperrt doppelte Übernahmen. `trialHist` bewahrt maximal 30 abgeschlossene Versuche, wenn ein Slot wiederverwendet wird. Kein verpasstes Soll und kein Handlungslog entstehen daraus.
- `standards[area].std.anchor`: optionaler Auslöser. `aid` verknüpft eine bestehende Zielhandlung; diese wird nicht kopiert. Ein vorhandener Standard wird bei der Übernahme nie ersetzt. Bewusst bestätigte Entscheidungen stehen zusätzlich in `standard.decisions`.
- `smallLog`: maximal 500 lokale Bestätigungen kleiner Zielvarianten `{d,wk,key,aid,text,t}`. Sie werden weder in `life.log` noch in Messungen oder Punkte umgerechnet. `LC.smallFor` vereinheitlicht Anzeige/Bestätigung mit `reentry.small`, ohne die Daten zusammenzuführen. Am neuen Tag ist die Variante wieder offen.
- Standardhistorien speichern vor Änderungen auch Status und Verknüpfung. `standardAt` liest die für eine Woche gültige Fassung. Alte Historieneinträge bleiben nutzbar; fehlender früherer Status gilt als aktiv. Die alte Begrenzung auf 30 Änderungen entfällt, damit frühere Wochen nicht durch Abschneiden umgeschrieben werden. Historische Logs werden nicht bereinigt oder neu datiert. Neue Mehrfachtipps desselben Standards und Typs am selben Tag erzeugen keinen zweiten Eintrag.
- Zielhandlungen nutzen `hist` für Häufigkeit, `pauseHist` für Pausen und `changes` für sichtbare Vorher/Nachher-Fassungen. Pausierte Handlungen bleiben für historische Wochen auswertbar, werden im aktuellen Aufgaben-/Zeitplan ausgeblendet. Änderungen an verknüpften Standards folgen derselben ausdrücklich bearbeiteten Handlung.
- Neue Tempelbausteine speichern optionale `evidence` mit Handlungscode/Spieltag, Wochenzähler oder Experiment-ID. Eine Namenskopie beim Grundstein bleibt lokal. `milestoneEvidence` zeigt die gespeicherte Herkunft beziehungsweise die gespeicherten Experimentkriterien; ohne Herkunft nur die allgemeine Regel. Keine neuen Tempelpunkte oder Schwellen, keine rückwirkend erfundenen Belege.

Bereits vor ww-v92 angelegte Charakter-Handlungen tragen keinen zuverlässigen Eigenschaftscode: „Neugierig“ und „Gemeinsam stark“ hatten beide `src:'character'`. Sie werden deshalb nicht automatisch gelöscht oder umgeplant. Betroffene alte Handlungen können ausdrücklich pausiert oder bearbeitet werden. Fehlende neue Felder benötigen keine Pflichtmigration. Bereits vorhandene Bausteine bleiben bestehen.

## Prüfung

`tests/routine-loop.cjs` prüft die sieben Abnahmewege, insbesondere Einmaligkeit über mehrere Wochen, idempotente Übernahme, normale kleine Ausführung mit Rückgängig/Reload, unveränderte Punkte/Messwerte, historische Wochen und einmalige Wertung verknüpfter Handlungen. Bestehende Kalender-, Ruhetags-, Wiedereinstiegs-, Konto- und Tempeltests bleiben Teil der Gesamtprüfung.

Browser-Testserver: `node tests/routine-preview-server.cjs`, dann `http://localhost:5192/?fixture=fresh` beziehungsweise `?fixture=goal`. Er verwendet getrennte lokale Testschlüssel, keine echten Konten und keinen Service Worker. `PORT` ist optional. Server-Helfer separat starten/beenden, nicht als endende Testsuite behandeln; `arena-seed.cjs` ist ein beendbares Bibliotheksmodul.

Geprüft: 28 Testsuiten plus beendbares Seed-Modul; Arena-Preview separat gestartet, Testdaten und Bereitschaft bestätigt. Browser 375×812 und 390×844: frischer Versuch, Rückmeldung, Standardübernahme mit Auslöser/Minimum, volle Ausführung, kleine Charaktervariante auf Heute und in Aufgabendetails, Anpassen/Pause, Rückgängig und Reload. Keine Konsolenfehler im geprüften Ablauf. E-Mail-Konten und produktive Arena wurden nicht verwendet. Unabhängiges Codex-Gegenreview vor Merge erforderlich; kein Merge/Deployment.

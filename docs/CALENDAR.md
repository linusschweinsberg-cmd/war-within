# Kalender und persönliche Einschätzungen

## Tageswechsel

Der Spielstand speichert calendar mit Version, lokalem ISO-Datum, IANA-Zeitzone und einem Versatz für die Saisonwoche. Die Profil-Zeitzone hat Vorrang; fehlt sie, gilt die Browser-Zeitzone. Ungültige Zonen fallen auf UTC zurück. Header, Tagesplan-Uhrzeit und Tageswechsel verwenden dieselbe Zone.

Ein alter Spielstand wird beim ersten Öffnen am heutigen Datum verankert. Vorhandene Ziele, Zähler, Punkte und Historien bleiben dabei unverändert. Es wird keine unbekannte Vergangenheit nachgerechnet.

Beim Öffnen, bei Datumssprung während laufender App, beim Fensterfokus und nach visibilitychange werden vergangene lokale Kalendertage geschlossen. Auch vor einer Änderung wird der Kalender abgeglichen. Sommer-/Winterzeit zählt nach Datum, nicht nach 24-Stunden-Intervallen. Erneutes Öffnen am selben Tag führt keinen zweiten Abschluss aus. Eine rückwärts gestellte Uhr öffnet abgeschlossene Tage nicht erneut. Ein Zonenwechsel schließt zuerst die vergangenen Tage in der bisherigen Zone ab und verankert dann neu, ohne einen Tag zu gewinnen oder zu verlieren. Vorspulen, Saisonsprung und Demo-Zurücksetzen gibt es nur im Demo-Spielstand ohne Profil. Frühere Wochenzuordnungen bleiben über Kalendersegmente erhalten. Abstände über zehn Jahren gelten als unplausibler Uhr-/Importstand und werden ohne Nachberechnung neu verankert.

Der Tagesabschluss ist zwischen automatischem Wechsel und Demo-Vorspulen geteilt. Automatisches Nachholen erzeugt keine Gegnerpunkte, keine Aktivitätslogs für unbekannte Tage, keine Beschämungsnachrichten und keine wettbewerblichen Bericht-Popups. Ohne dokumentierte Aktivität entstehen keine Champion-Auszeichnungen oder Rangaufstiege. Die bisherige Serien-/Schonungsregel bleibt erhalten; eine Serie kann bei Tagen ohne Aktivität enden.

Tagesdaten werden vor dem Fortschalten gesichert. Tägliche Erledigungen werden zurückgesetzt, Wochenzähler erst nach Sonntag. Eine gestern festgelegte Priorität bleibt am Folgetag erhalten. Übersprungene Tage erhalten keinen nachträglich erfundenen Debrief.

## Wochen und Saison

Wochentage richten sich nach Montag bis Sonntag. Bei alten Spielständen wird die aktuelle Woche an den echten Wochentag angehängt, ohne frühere Historien umzuschreiben. Wochenrückblicke werden sonntags angeboten; ein noch offener vorheriger Rückblick bleibt erreichbar. Nach dem Speichern wird am selben Sonntag kein weiterer Rückblick für diese Woche angeboten.

Die erste Woche einer neu verankerten Saison kann eine Rumpfwoche sein. Saisonwochen und verbleibende Kalendertage berücksichtigen das. Der Lebenstempel behält seine eigene Saison und seine bisherigen Bausteine. Wochenpläne werden in diesem PR nicht anteilig gekürzt; ob Ziele in der ersten Rumpfwoche anteilig vorgeschlagen werden sollen, ist eine offene Produktentscheidung.

## Kompass

Zufriedenheit ist nur bekannt, wenn ein Bereich ausdrücklich bewertet wurde (known), oder wenn bei älteren FTUE-Daten areasSet die Eingaben belegt. Technische Standardwerte zählen nicht als eigene Antwort. Das Eingabefeld zeigt bei unbekannten Werten keine vorausgewählte Bewertung. Einzelne Bewertungen nennen die Anzahl der bewerteten Bereiche; Gleichstände erhalten keine willkürliche Nadelrichtung. Der Kompass bezeichnet die niedrigste eigene Einschätzung, keinen objektiven Bedarf.

## Validierung

node tests/calendar.cjs prüft tatsächlichen App-Code: verlustfreie Migration, Mitternacht, Reload-Idempotenz, Sonntag/Montag, Wochenquoten, Abendpriorität, lange Abwesenheit über Saisonwechsel, Sommer-/Winterzeit, Zeitzonen, Rückwärts-Uhr und Kompasszustände. Zusätzlich bestehen die sieben bisherigen Tests.

Browser: frischer lokaler Gaststand, Sonntag wird als Sonntag erkannt und Rückblick angeboten; unbekannter Kompass, bewusst bewerteter Einzelbereich und Reload in 375 px geprüft, keine Konsolenfehler. Echte Mitternacht wird über deterministische Zeitpunkte im Code getestet, nicht durch Änderung der Rechneruhr. Vor Merge ist Claudes Review vorgesehen. Keine Änderungen am echten Supabase-Projekt.

# Arena mit Freunden

## Umfang und Freischaltung

Release `ww-v62`: private Ligen für 2–8 Personen, Standardgröße 3, vier Spielwochen, gemeinsames Wochen-Soll (seit ww-v65 für alle gleich), gemeinsame Wertung, Einladungslink/-code, Ereignisse und drei feste Reaktionen. Jeder spielt jede Woche mit. Die Arena ist direkt über die fünfte Navigationsschaltfläche erreichbar; der bisherige persönliche Planvergleich liegt darunter. Fokusmodus blendet beide aus. Kein Freilos, keine simulierte Annahme oder Aktivität in der gemeinsamen Arena.

Diese Änderung enthält Frontend und eine **noch nicht eingespielte** Migration. Ohne sie meldet die App „Die gemeinsame Arena ist noch nicht freigeschaltet“. Gastkonten sehen eine ausdrücklich beschriftete Vorschau. Kein stiller Wechsel zu lokalen oder erfundenen Ergebnissen. Migration und Veröffentlichung nach Claude-Review separat entscheiden. Keine Einstellungen des echten Supabase-Projekts wurden geändert.

Die Datenbankdatei `supabase/migrations/202611230001_arena.sql` ist eigenständig. Sie benutzt ausschließlich Tabellen mit `arena_`-Präfix und eigene Funktionen; das noch nicht gemergte Grundmodell aus PR #14 wird nicht vorausgesetzt. Keine bestehende Tabelle wird verändert. Die Zukunfts-Ich-Animation aus PR #23 ist in diesem Branch enthalten.

## Spielregeln

- Der Gründer wählt Name und Größe. Mitglieder treten vor Saisonstart mit einem zufälligen 16-stelligen Einladungscode bei und wählen bewusst einen öffentlichen Arenanamen. Codes/Links werden nie automatisch versendet.
- Vier feste Plätze: MIND (10 Minuten reflektieren), Körper (20 Minuten bewegen), Entwicklung (20 Minuten lernen), Beziehungen (10 Minuten bewusst Kontakt pflegen). Je Platz 1–7 Tage pro Woche; Standard 3. Die erste Version verwendet diese vergleichbaren Einheiten, keine privaten Freitexte oder frei erfundenen Aufgabenwerte.
- Der Gründer legt vor dem Start ein gemeinsames Soll je Bereich fest (1–7 Tage pro Woche, Standard 3). Es gilt für alle gleich und steht ab dem Start für die ganze Saison fest; Mitglieder sehen es nur zum Lesen. Sobald mindestens zwei Personen dabei sind, kann der Gründer die Saison für den nächsten Montag vormerken. Danach keine neuen Mitglieder dieser Saison.
- Gemeinsame Kalenderzeit Europe/Berlin, Montag 00:00 bis Sonntag 24:00. Keine individuellen Geräteuhren zur Ermittlung der Spielwoche. Faire Wertung: Es gibt keine persönliche Aufstellung mehr. Wer gleich viel erfüllt, hat gleich viele Punkte; ein niedriges eigenes Soll für volle Punktzahl ist nicht möglich. Pro Bereich zählt höchstens ein Tageseintrag, gedeckelt auf das gemeinsame Soll.
- Erfüllungen werden ausdrücklich und getrennt vom persönlichen Spielstand selbst gemeldet. Es wird nichts aus privaten Reflexionen abgeleitet. Pro Person/Bereich/Kalendertag ein Eintrag, insgesamt höchstens das Wochensoll. Keine Bonuspunkte für zusätzliche Meldungen, späte Einträge oder neue Aufgaben. Der heutige Eintrag ist zurücknehmbar; seine Reaktionen werden dabei ebenfalls entfernt.
- Jeder Platz zählt maximal 25 Arenapunkte. Erfüllung/Soll × 25 wird pro Platz auf eine Nachkommastelle gerundet; Summe maximal 100. Die Tabelle und Rangfolge verwenden dieselbe Genauigkeit.
- Wochenplatz 1/2/3 erhält 3/2/1 Tabellenpunkte, weitere Plätze 0. Geteilte Plätze bekommen die gleiche Punktzahl, der nächste Rang wird übersprungen (1,1,3). Ohne jede Erfüllung keine Tabellenpunkte. Bei zwei Personen erhalten die Plätze 3 und 2 Punkte. Die laufende Woche ist vorläufig; die Saisontabelle zählt nur abgeschlossene Wochen.
- Nach vier Wochen werden Saisonsieger einschließlich Gleichstand und alle Wochenberichte sichtbar. Für die nächste Runde wird eine neue Arena erstellt und bewusst beigetreten. Kein automatischer Neustart, kein Verlust persönlicher Fortschritte.

## Daten und Sicherheit

`arena_leagues` (Gründer, Name, Einladung, Größe, Start), `arena_members` (öffentlicher Arenaname), `arena_leagues.targets` (gemeinsames Soll, vier Zielzahlen), `arena_completions` (Bereich/Tag), `arena_reactions` (Respekt/Stark/Revanche). Spielstände und private Audit-/Zukunfts-/Zieltexte werden nicht hochgeladen. Keine E-Mail-Adressen, Tokens oder Passwörter in diesen Tabellen oder Antworten. Arenapunkte verändern nie persönliche Punkte, Tempel, Liga-Demostände oder Missionen.

Alle Tabellen haben RLS und ausschließlich lesende Mitgliedspolicies. Direkte Schreibrechte fehlen. Drei explizit freigegebene RPCs (`arena_list`, `arena_snapshot`, `arena_command`) prüfen Identität/Mitgliedschaft; `arena_command` leitet die Person aus `auth.uid()` ab. Die Serverzeit bestimmt Tag, Woche, Soll-Sperre ab Start und Saisonende. Ligazeilensperren serialisieren Beitritt, Start und Meldungen. Wiederholte Meldungen sind idempotent. Eine Reaktion pro Person/Ereignis; keine freien Nachrichten.

Funktionen mit erweiterten Rechten setzen einen leeren `search_path`, verwenden qualifizierte Namen und entziehen PUBLIC/anon die Ausführung. Der Browser verwendet den bestehenden Supabase-Client, keine zweite Sitzung und keinen geheimen Schlüssel. Grundlage: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Bei geöffneter Arena werden gemeinsame Ergebnisse alle 15 Sekunden sowie beim Zurückkehren aktualisiert. Keine Hintergrundbenachrichtigungen; versteckte Seiten pausieren. Fehlgeschlagene Schreibvorgänge zeigen einen Fehler und ersetzen keinen bestätigten Stand. Keine Offline-Warteschlange, keine doppelte Nachsendung. Das gemeinsame Soll liegt nach Bestätigung im Backend und sind nach Neuladen verfügbar; noch ungespeicherte Formulare nur im aktuellen Dialog.

## Prüfung

`npm ci` installiert ausschließlich die lokale Test-Abhängigkeit PGlite (kein Produktions-Bundle). `npm run test:arena` prüft reine Wertung, den Netzwerkvertrag und die echte SQL-Migration in einer wegwerfbaren PostgreSQL/WASM-Datenbank mit drei Konten plus einem ausgeschlossenen vierten Konto. Kein Test kontaktiert das echte Supabase-Projekt.

Zusätzlich alle bisherigen zehn Tests und `git diff --check`. Der Release-Smoke prüft auch die Syntax aller lokalen Skripte, der Service-Worker-Test alle acht versionsgebundenen Skripte offline und beim Upgrade.

Browser-Review ohne echte Konten: `node tests/arena-preview-server.cjs`, dann `http://localhost:5215/?arena=&player=0` sowie `player=1` und `player=2`. Es ist eine lokale Testumgebung mit echter Migration und unterschiedlichen Datenbankidentitäten; kein echter E-Mail-/Supabase-/Netzwerk-End-to-End-Test. Nur in dieser wegwerfbaren Umgebung kann ein POST auf `/__test/start-now` den vorgemerkten Saisonstart für den Review vorziehen. Dieser Server wird nie veröffentlicht und seine Endpunkte existieren nicht im Produktionsserver.

## Vor Veröffentlichung und offene Entscheidungen

1. Claude prüft Regeln, Datenbankrechte und die gesamte neue Arena. Nutzer entscheidet danach über die Migration; keine automatische Anwendung.
2. Danach manuell mit drei tatsächlichen Supabase-Konten auf verschiedenen Geräten: erstellen/einladen/beitreten, vierte Person ablehnen, gemeinsames Soll festlegen, Start, Wochenwechsel, Reload und Verbindungsausfall prüfen.
3. Fairness: Unterschiedliche Zielhäufigkeiten bedeuten unterschiedlichen Aufwand bei gleichem Höchstscore. Es ist bewusst ein Vergleich vorheriger Zusagen. Nach erster Freundes-Saison Zielkorridore bzw. einheitliche Liga-Sollzahlen gemeinsam entscheiden. Keine Aussage über objektiv bessere Lebensführung.
4. Selbstauskunft bleibt manipulierbar; keine Geräteverifikation und kein Zugriff auf Gesundheitsdaten. Serverseitige Grenzen verhindern nachträgliche Soll-Änderungen, Datum-/Personen-Spoofing und Punktespam, beweisen aber keine reale Handlung.
5. Noch nicht enthalten: Transfermarkt, handelbare Kosmetik, freie Chats, automatische Saisonwiederholung, individuelle Zeitzonen, Verlassen/Gründerwechsel/Moderation über die Oberfläche. Beim Löschen des Gründerkontos wird dessen Arena aufgrund der Fremdschlüssel entfernt; vor echtem Kontolöschen Eigentumsübertragung gesondert klären.

## Durchgeführter lokaler Browser-Review

Drei getrennte Datenbankidentitäten: Erstellen, Beitritt per Link, drei gespeicherte Aufstellungen, gesperrter Start bei fehlender Aufstellung und Startbestätigung geprüft. Die Testumgebung zog danach ausschließlich ihre wegwerfbare Saison auf die aktuelle Woche vor. Meldungen zweier Personen erschienen in beiden Ansichten; Gleichstand, Führungswechsel, Reaktion eines anderen Mitglieds und Rücknahme einschließlich entfernter Reaktion geprüft. Eine auf vier MIND-Tage angepasste Folgewochenaufstellung blieb nach Neuladen und erneutem Öffnen erhalten.

375 × 812: Antik und Violett jeweils dunkel/hell visuell geprüft. Gast sieht eine Vorschau und gelangt zur Registrierung/Anmeldung. Fokusmodus entfernt Arena aus der Navigation. Keine Fehler in der Browserkonsole. Privatsphäre- und Sicherungstexte unterscheiden jetzt persönlichen lokalen Spielstand und gemeinsame Arena-Einträge. Ein echtes gemeinsames Spiel auf dem gehosteten Supabase-Projekt wurde nicht ausgeführt, weil die Migration noch zur Freigabe aussteht.

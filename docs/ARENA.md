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
3. Fairness: Das gemeinsame Soll gilt für alle. Die Basiswertung ist bei gleicher Erfüllung gleich; vorher angekündigte Orakel-Boni und Wochenprämien kommen hinzu. Es ist keine Bewertung des Menschen.
4. Selbstauskunft bleibt manipulierbar; keine Geräteverifikation und kein Zugriff auf Gesundheitsdaten. Serverseitige Grenzen verhindern nachträgliche Soll-Änderungen, Datum-/Personen-Spoofing und Punktespam, beweisen aber keine reale Handlung.
5. Noch nicht enthalten: Transfermarkt, handelbare Kosmetik, freie Chats, automatische Saisonwiederholung, individuelle Zeitzonen, Verlassen/Gründerwechsel/Moderation über die Oberfläche. Beim Löschen des Gründerkontos wird dessen Arena aufgrund der Fremdschlüssel entfernt; vor echtem Kontolöschen Eigentumsübertragung gesondert klären.

## Durchgeführter lokaler Browser-Review

Drei getrennte Datenbankidentitäten: Erstellen, Beitritt per Link, drei gespeicherte Aufstellungen, gesperrter Start bei fehlender Aufstellung und Startbestätigung geprüft. Die Testumgebung zog danach ausschließlich ihre wegwerfbare Saison auf die aktuelle Woche vor. Meldungen zweier Personen erschienen in beiden Ansichten; Gleichstand, Führungswechsel, Reaktion eines anderen Mitglieds und Rücknahme einschließlich entfernter Reaktion geprüft. Eine auf vier MIND-Tage angepasste Folgewochenaufstellung blieb nach Neuladen und erneutem Öffnen erhalten.

375 × 812: Antik und Violett jeweils dunkel/hell visuell geprüft. Gast sieht eine Vorschau und gelangt zur Registrierung/Anmeldung. Fokusmodus entfernt Arena aus der Navigation. Keine Fehler in der Browserkonsole. Privatsphäre- und Sicherungstexte unterscheiden jetzt persönlichen lokalen Spielstand und gemeinsame Arena-Einträge. Ein echtes gemeinsames Spiel auf dem gehosteten Supabase-Projekt wurde nicht ausgeführt, weil die Migration noch zur Freigabe aussteht.

## Spannung: Orakel und Wochenprämie (seit ww-v66)

Angelehnt an das Prinzip täglich wechselnder Chancen aus Fantasy-Sport-Apps, aber fair: beides ist für alle gleich, wird vorher angezeigt und aus Arena-ID und Datum berechnet (`ArenaCore.oracle`, `ArenaCore.bounty`). Keine Datenbankänderung, nicht manipulierbar.

- **Orakel des Tages:** Ein Bereich zählt an diesem Tag ×1,5 (Zusatz von einem halben Tag auf den Bereichswert). Ab Mitternacht (Berlin) sichtbar.
- **Wochenprämie:** Ein ausgeloster Bereich je Woche; wer dort als Erste:r das gemeinsame Soll erfüllt (Server-Zeitstempel), erhält +5 Arenapunkte.
- Score = Basis (max. 100) + Orakel-Bonus + Prämie. Tabellenpunkte unverändert 3/2/1.

## Automatische Übernahme aus den Aufgaben (seit ww-v66)

Nach ausdrücklichem Einschalten meldet eine abgeschlossene passende Aufgabe mit bekannter ausreichender Dauer den Bereich in laufenden Arenen. Unbekannte oder zu kurze Dauer, simulierte Werte und der kurze Daily Debrief zählen nicht automatisch. MIND wird für die tatsächliche zehnminütige Reflexion manuell gemeldet. Finanzen haben keinen Arenaplatz. Rückgängig nimmt nur eigene automatische Meldungen zurück; Details unten bei den Integrationskorrekturen.

## Gestaltung (seit ww-v66)

Amphitheater-Kopf (Bogenreihen, Sandstreifen), Siegerpodest der Woche (2 · 1 · 3, Lorbeer), „Schicksal der Woche“ mit Orakel und Prämie, Meldungen als Kacheln mit Wochenfortschritt und Orakel-Markierung, Kampfbericht statt Ereignisliste.

## Testdaten (lokaler Prüfserver)

`node tests/arena-preview-server.cjs` startet eine Wegwerf-Datenbank (PGlite) mit drei Testkonten (`?player=0` Linus, `1` Jonas, `2` Mira) und legt über `tests/arena-seed.cjs` automatisch an:

- **„Die Dreihundert“**: laufende Saison in Woche 3, Wochen 1–2 abgeschlossen, gemeinsames Soll MIND 3 · Körper 4 · Entwicklung 3 · Beziehungen 2, gut 60 Meldungen und Reaktionen. Verläufe: Linus konstant, Jonas stark gestartet und eingebrochen, Mira mit Comeback – dadurch unterschiedliche Wochensieger und ein knapper Saisonstand.
- **„Morgenlauf-Trio“**: wartet in der Lobby, Jonas ist Gründer; Linus sieht die Sicht eines Mitglieds (Soll nur lesend, kein Start-Knopf).

`ARENA_SEED=0` startet ohne Testdaten. `tests/arena-seed-data.cjs` prüft die Testdaten gegen das echte SQL und die Spielregeln. Nie gegen Supabase verwenden.


## Integrationskorrekturen ww-v67

Die automatische Übernahme ist ab Werk aus und erfordert ausdrückliches Einschalten. Sie zählt nur abgeschlossene Handlungen mit bekannter ausreichender Dauer (Körper/Lernen 20 Minuten, Kontakt 10 Minuten). Bei einer Zeiterfassung gilt die tatsächlich eingetragene Dauer. Simulierte Health-Einträge, bloße Erholung und der kurze Daily Debrief lösen keine Arena-Meldung aus. MIND bleibt manuell für die echte zehnminütige Reflexion.

Automatische Meldungen haben einen zufälligen Herkunftscode ohne Aufgabenname oder privaten Text. Rückgängig arbeitet die Netzaufrufe in Reihenfolge ab, berücksichtigt alle beitragenden Aufgaben und nimmt nur selbst erzeugte automatische Meldungen zurück. Manuell bestätigte Meldungen sind geschützt. Ein Kontowechsel wird zusätzlich auf dem Server abgefangen. Fehler werden angezeigt; bei unklarer Verbindung muss der Arenastand geprüft werden. Die neue Spalte gehört zum weiterhin nicht angewendeten SQL-Entwurf.

Lokaler Integrations-Review: Heute, Mein Leben und Arena bei 375 × 812 geprüft; Antik hell/dunkel sowie Fokusmodus (kein Er/Du-Vergleich und keine Arena-Navigation) bestätigt. Automatische Übernahme startet ausgeschaltet. Ein alter Lernauftrag ohne bekannte Dauer wurde nicht automatisch gemeldet. Race-/Ownership-Fälle sind zusätzlich mit verzögerten Promises und dem echten SQL geprüft. Keine Browserfehler. Keine Prüfung mit echten Supabase-Konten.

## Comeback und Wochenzeremonie (ww-v68)

Stufe Handeln: Auszeichnungen würdigen die Umsetzung gemeinsamer Standards. Comeback: nach einem bereits aktiven Saisontag mindestens zwei freie Kalendertage und dann drei aktive Tage in Folge. Ein Bereich pro Tag reicht. Lorbeer am dritten Tag, auch über Wochengrenzen, höchstens einmal je Person/Woche. Rücknahmen aktualisieren die Ableitung. Keine Zusatzpunkte. Konstanz würdigt die meisten unterschiedlichen aktiven Tage, auch bei Gleichstand. Keine Aktivität bedeutet keine Auszeichnung.

Abgeschlossene Wochen erscheinen in der Wochenzeremonie, neueste zuerst: Podest, Wochensieg, Konstanz und Comebacks. Wertung nachvollziehen zeigt je Mitglied Tage/Soll, gerundete Basis und Orakel je Bereich, Prämie, Gesamtsumme, Rang und Tabellenpunkte; laufende Woche vorläufig. Alle Zahlen stammen aus derselben Wertungsfunktion. Nur bestehende öffentliche Meldungen; keine privaten Texte, neue Serverdaten oder Migration.

## Nächster Zug, Kampfbericht und neue Zeremonie (ww-v69)

Stufe Handeln: Die Arena zeigt, was heute zählt.

- **Dein nächster Zug** (Kampfplatz): `ArenaCore.gains(snapshot)` rechnet für jeden offenen Bereich mit derselben Wertungsfunktion vor, wie viele Arenapunkte eine Meldung heute bringt (Orakel und Wochenprämie eingeschlossen) und an wem du damit vorbeiziehst. Der beste Bereich lässt sich direkt melden; die Kacheln unter „Heute melden“ zeigen den Wert je Bereich. Bereits heute gemeldete oder volle Bereiche erscheinen nicht. Rein lesend, keine neuen Serverdaten.
- **Kampfbericht:** nach Tagen gruppiert (Heute, Gestern, Datum), Herkunft sichtbar („selbst gemeldet“ bzw. „aus Aufgaben übernommen“), zunächst sechs Einträge, ältere auf Wunsch. Eigene Meldungen zeigen erhaltene Reaktionen statt Reaktionsknöpfen; der SQL-Entwurf lehnt Reaktionen auf eigene Meldungen ab.
- **Neu gewertet:** Ist eine Woche abgeschlossen, erscheint ihre Zeremonie einmal oben, bis „Gesehen“ getippt wird. Gemerkt wird nur die Wochennummer je Arena (`S.arenaSeen`), lokal im Spielstand.
- Texte zur automatischen Übernahme (Opt-in) und zur Sichtbarkeit beim Beitritt an den aktuellen Stand angepasst.

## Wochenverlauf und Sonntagsfinale (ww-v70)

- **Wochenverlauf:** Raster mit einer Zeile je Mitglied (nach Wochenrang) und sieben Tagen Mo–So. Die Füllung zeigt, wie viele der vier Bereiche an dem Tag gemeldet wurden; heute ist umrandet, künftige Tage sind blass. Quelle: `ArenaCore.activity(snapshot, week)`, nur bestehende öffentliche Meldungen. Ruhetage sind ausdrücklich erlaubt.
- **Sonntagsfinale:** Am letzten Tag einer Spielwoche erscheint oben „Finale · heute bis 24 Uhr“ mit eigenem Platz, Abstand zum nächsten Platz darüber und dem, was alle heute noch offenen Bereiche zusammen bringen (`ArenaCore.finale`, dieselbe Wertungsfunktion). Keine Benachrichtigung, keine Zusatzpunkte.
- Keine neuen Serverdaten, keine Migration.

### Übersicht in drei Reitern (ww-v70)

Eine laufende Arena ist in **Heute**, **Tabelle** und **Bericht** gegliedert (flache Reiterleiste mit Unterstrich):

- **Heute:** Hinweis auf eine neu gewertete Woche (eine Zeile: Sieg, eigener Platz, „Ansehen“ öffnet die Zeremonie unter Tabelle), Sonntagsfinale, eigener Platz mit Abstand und nächstem Zug, Orakel und Wochenprämie in einer Zeile, „Heute melden“ mit dem Schalter für die automatische Übernahme.
- **Tabelle:** Kampfplatz mit Podest (laufende Woche vorläufig), Wochenverlauf, Saisontabelle, Wochenzeremonien, Wertung nachvollziehen.
- **Bericht:** Comeback-Hinweise und Kampfbericht.

Eine beendete Saison öffnet direkt die Tabelle. Lobby und vorgemerkte Saison bleiben unverändert.

## Arena-Bühne nach dem Vorbild des Duells (ww-v71)

Der Reiter **Heute** übernimmt die Bildsprache des persönlichen Duells, ersetzt die frühere Karte „Platz X von N“ und zeigt nur bestätigte Wochenpunkte:

- **Szene:** Jedes Mitglied steht als Hoplit auf einer Stufe, deren Höhe den Wochenpunkten folgt (höchstens sechs Figuren, du immer dabei; Spitze in der Mitte). Eigene Figur mit Terrakotta-Umhang, Lorbeer in Gold über Platz 1, alle anderen neutral – keine Nemesis-Farbe für Freunde.
- **Kopf-an-Kopf:** du gegen den Platz direkt über dir (wenn du führst: gegen deinen Verfolger) in großen Ziffern, darunter der Abstand als Balken.
- **Sieben Runden:** deine Woche Mo–So; Zahl = gemeldete Bereiche an diesem Tag, 4 von 4 in Gold, heute umrandet.
- **Stimme:** eine Zeile in Cinzel aus den bestätigten Zahlen (Reichweite, Abstand, Führung) – ermutigend, nie spöttisch. Danach folgen „Dein nächster Zug“, Orakel/Wochenprämie und „Heute melden“.
- Keine neuen Serverdaten, keine Migration.

## Arena 3.0 · Regel 3 (ww-v72, Entwurf, Migration nicht angewendet)

Stufe Handeln: Strategie über vorher vereinbarte Standards, nicht über mehr Aufgaben. Grundlage ist Codex' `codex/arena-v3` (`e25db1d`), von Claude übernommen, geprüft und um Phase 2 erweitert. Neue Ligen erhalten `rule_version=3`; bestehende Ligen bleiben bei Regel 1 und rechnen unverändert.

### Wertung (zentral in `private.arena_v3_score`, gespiegelt in `ArenaCore.scoreV3`)

- Einheit Zehntel; sichtbar = /10. Basis je Bereich Tage/Soll × 25, höchstens 100.
- Bonus höchstens 15, in fester Reihenfolge angerechnet, bis 15 erreicht sind: Formation +6 → Vier Säulen +5 → Kampfgeist +4 → Wochenprämie +5 → Orakel. Wochenhöchstwert 115. Wer alle drei Strategieboni holt, bekommt keine zusätzlichen Punkte für Orakel und Prämie. Die Reihenfolge ist bewusst fest und dokumentiert.
- Der Server ist maßgeblich. Die App rechnet mit derselben Funktion nur Vorschau („Nächster Zug“, Sonntagsfinale, Fortschritt). `tests/arena-tactics.cjs` vergleicht SQL und JS in 180 Zufallsfällen, auch mit Kriegsrat.

### Formationen und Wochenplan

- Vor Montag (Berliner Datum) wählt jede Person eine Formation und legt je Bereich genau das gemeinsame Soll auf Wochentage. Ab Montag ist die Formation gesperrt. Fremde Formationen sind erst ab Wochenbeginn sichtbar (RLS und Snapshot), damit niemand die Aufstellung anderer vorher sieht.
- **Schildwall:** jeder Bereich ≥ 60 % (aufgerundet) seines Solls. **Speerspitze:** gewählter Bereich 100 %. **Wächter:** an min(4, geplante Tage) geplanten Tagen alles für diesen Tag Geplante erfüllt. Ungeplante Tage sind Ruhetage.
- Die **Doktrin** (Saison-Draft) wird vor dem Saisonstart gewählt. Sie wählt nur die Formation vor und erscheint als Zeichen, ohne Punkte. So gibt es keinen statistischen Vorteil.

### Kampfgeist (Momentum) und Vier Säulen

- **Kampfgeist +4:** drei geplante Tage in Folge vollständig erfüllt. Ungeplante Tage unterbrechen nicht, ein verpasster Plantag schon. Einmal je Woche. Eine spätere Unterbrechung nimmt nichts weg. Ohne Wochenplan (also ohne Formation) gibt es keinen Kampfgeist. Meldungen sind nur für heute (Serverdatum) möglich, rückwirkendes Sammeln ist ausgeschlossen.
- **Vier Säulen +5:** in mindestens drei Bereichen das volle Soll. Einmal je Woche. Die Oberfläche zeigt vier Säulen, die bei vollem Soll golden werden.

### Kriegsrat (Taktikwechsel)

- Einmal je Woche, Montag bis Donnerstag, nur wenn die gesperrte Formation noch nicht gemeistert ist (keine doppelten Boni).
- Die neue Formation gilt ab dem Folgetag (`switch_day`). Der neue Plan legt genau das noch offene Soll je Bereich auf Tage ab morgen. Die alten Plantage davor bleiben für den Kampfgeist erhalten.
- Gewertet wird die neue Formation nur mit Meldungen ab `switch_day`, gemessen am offenen Soll. Bereits gewertete Meldungen ändern sich nicht. Jeder Wechsel steht dauerhaft in `arena_formation_log`.

### Ereignisse

`arena_score_events` speichert nach `report` und `switch` die Differenz je Wertungsart (`base`, `formation`, `combo`, `momentum`, `bounty`, `oracle`) für alle Mitglieder. Felder: ID, Spieler, Arena, Woche, Art, Änderung, Bereich, Regelversion, auslösende Meldung (`source`), Zeit. Wiederholte Aufrufe ergeben keine Differenz und damit kein Ereignis. Rücknahmen erscheinen als negative Einträge. Die Ligazeilensperre serialisiert gleichzeitige Aufrufe. Der Bericht zeigt „Bestätigte Punkte“ (seitenweise, 30 je Seite) getrennt von den Meldungen und von Kriegsrat-Hinweisen.

### Oberfläche

Reiter **Heute** zeigt nach „Heute melden“ die Karte **Taktik der Woche**: Bonusbalken x/15, gesperrte Formation mit Fortschritt, Kampfgeist (drei Flammen, sanftes Glühen nur ohne reduzierte Bewegung), Vier Säulen und den Kriegsrat mit verbleibenden Wechseln. Darunter folgt **Formation · Woche n+1** mit drei Formationskarten und Wochenplan-Raster. Lobby und vorgemerkte Saison zeigen die **Saisonvorbereitung** (Doktrin), vor dem Start zusätzlich die Formation für Woche 1. Reiter **Bericht** zeigt die bestätigten Punkte.

### Geprüft

- `tests/arena-tactics.cjs` (echtes SQL in PGlite): Momentum (Ruhetage, Bruch, kein Abzug, ohne Plan), Vier Säulen, alle drei Formationen samt Grenzen, Deckel 115 und Reihenfolge, Kriegsrat (offenes Soll, ab morgen, einmalig, Mo–Do, nicht nach Erfolg, ohne Formation), Ereignisse mit Rücknahme, Wiederholung ohne Doppelungen, geheime Aufstellung, Schreibverbote, Fremdzugriff, Regel 1 unverändert, Parität SQL/JS.
- Browser (lokaler Prüfserver, 375 × 812, Antik dunkel): Taktik-Karte, Kriegsrat-Wechsel, Formation Woche 4, Meldung mit bestätigtem Ereignis im Bericht, Doktrin in der Lobby. Keine Konsolenfehler.
- Korrekturen an v3 bei der Übernahme: `arena_events` fehlte in der RPC-Freigabe von `auth.js` („Ältere Ereignisse laden“ wäre produktiv gescheitert). „Nächster Zug“ und Sonntagsfinale zeigten bei Regel 3 immer 0, weil sie feste Serverwerte nutzten; jetzt rechnen sie lokal mit derselben Wertung. Gleichstand bei der Wochenprämie wird wie im SQL nach Nutzer-ID entschieden.

### Nicht geprüft und offen

- Keine Prüfung gegen das echte Supabase-Projekt. Echte Nebenläufigkeit (zwei Verbindungen) wurde nicht getestet, PGlite hat nur eine Verbindung. Die Absicherung beruht auf `select … for update` der Liga.
- Sommerzeit: Tag und Woche kommen aus `now() at time zone 'Europe/Berlin'` als Kalenderdatum. Ein eigener Test über den Zeitumstellungstag fehlt.
- Phase 3/4 noch nicht umgesetzt: Live-Aktualisierung über Supabase Realtime (bisher Abfrage alle 15 s, bei Fokus und beim Wiederverbinden), Prognose, Gegner-Pokal mit Freilos, Scouting, Ruhmeshalle und saisonübergreifende Statistik.
- Veröffentlichung: Migration `202611230002` nach Review im Supabase-SQL-Editor bzw. per `supabase db push` nach `202611230001` anwenden. Danach drei echte Konten prüfen, dann GitHub Pages über den Merge nach `main`.

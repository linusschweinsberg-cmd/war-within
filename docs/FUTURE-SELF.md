# Dein Zukunfts-Ich

## Vorhandene Architektur und Migrationsvorschlag

React/htm in index.html trägt die Oberflächen; life-core.js liefert Werte/Warum, vier Lebensbereiche, Ziele, goalWeek, standardWeek, tägliche Logs, Debrief, Abendplanung und Success Loop. todayPriorities priorisiert bereits offene Handlungen einschließlich Standards und Commitment. Die Zukunftsvision liegt privat in life.future (FutureStory/FutureSheet), nicht in einem getrennten Profil. Wisdom bleibt ein unabhängiges Impulsarchiv ohne Fortschrittseffekte.

Nemesis ist bisher bereits ein Modell des eigenen Tagesplans: nemTasks/buildNemesisPlan/nemDefault steuern Plan und Animation, duelNow den optionalen Vergleich. nem, duel, ctime, Punkte und Saisonhistorien sind bestehende Daten. Der bisherige Rivalenton enthält Zuschreibungen und Sticheleien; er passt nicht zur neuen Figur.

Vorschlag vor Implementierung: Die sichtbare Figur wird als Zukunfts-Ich vereinheitlicht, bestehende technische Nemesis-Schlüssel und Duellberechnungen bleiben erhalten. Der optionale Vergleich wird ausdrücklich als Plan-Simulation bezeichnet. Seine Modellstände sind keine tatsächlichen Handlungen einer realen Person. Neue Antworten werden nur aus Nutzereinträgen und vorhandenen Core-Funktionen abgeleitet; die simulierte Gegenseite ist keine Beweisquelle. Alte gespeicherte Rivalenmeldungen bleiben Daten, werden aber nicht als Stimme des Zukunfts-Ichs angezeigt.

Technisch ergänzt ein eigenes reines Regelmodul future-self-core.js die vorhandenen Module. React-Komponenten stellen eine reservierte, nicht überlagernde Zugangsleiste über der Navigation und ein freiwillig geöffnetes Sheet bereit. Keine neue Fortschrittsberechnung, keine externe KI und keine neue Onboarding-Pflicht. Ein kurzer Hinweis im bestehenden Onboarding erklärt den späteren Zugang. Einstellungen und Interaktionsmetadaten liegen lokal im bestehenden Spielstand; Antworten und private Textkopien werden nicht als zusätzlicher Verlauf gespeichert.

Vor Merge ist Claudes Review vorgesehen. Basis-Reihenfolge: Kalender #20, Heute #21, danach dieser Feature-Branch. Kein automatisches Merge oder Deployment.

## Umgesetztes MVP

- future-self-core.js exportiert FS: lokale, nachvollziehbare Regeln, getrennte Textvorlagen, Präferenzen, Interaktionscodes und opt-in Tageshinweis. Es gibt keine Netzaufrufe oder externe KI.
- index.html verbindet dieselbe Hopliten-Figur mit dem bisherigen Planmodell und ergänzt FutureSelfDock/FutureSelfPanel. Der Zugang ist auf allen Haupt- und Unterseiten innerhalb der App über der Navigation erreichbar. Bei Login und im noch nicht abgeschlossenen Onboarding gibt es noch keinen Spielstand; dort wird keine zweite Sitzung erzeugt. Das vorhandene Onboarding erklärt den späteren freiwilligen Zugang, ohne neue Pflichtschritte.
- Konfrontiere mich benennt ein vergangenes Zeitfenster oder eine Lücke zwischen eingetragenem Wochensoll und erfassten Einheiten. Fehlende Einträge werden nicht mit bewusster Vermeidung gleichgesetzt. Ein Vorschlag verwendet die vorhandenen Prioritäten; falls die betroffene Handlung heute bereits erfasst ist, wird die nächste Einheit vorbereitet, statt eine zusätzliche zu erzwingen.
- Was würde mein Zukunfts-Ich tun verwendet die bestehende nächste Handlung einschließlich Standards oder Commitment. Die Schaltfläche Erledigung erfassen nutzt die vorhandene Erfassungs-/Undo-Logik und behauptet nicht, einen Timer zu starten. Der Tagesplan bleibt separat erreichbar.
- Mein Tagesurteil trennt heutige Einträge, offene ausdrücklich bestätigte Tageszusagen, weitere Handlungsvorschläge, Wissenslücken und eine konkrete Verbesserung für morgen. Heutige Standards, Minimum und erste Schritte werden berücksichtigt. Alte Wochenmarkierungen und Migrationseinträge ohne bekannten Tag werden nicht als heutige Erledigung ausgegeben. Es gibt keine neue Note oder Wertung des Menschen.

## Grenzen der Aussagen

Eine eingetragene Ruheentscheidung hat Vorrang. Notierte Energieknappheit und ein als schwierig beschriebener Tag führen zu passender Anpassung, ohne Krankheit, Motive oder Gefühle zu erfinden. Private Freitexte werden nicht nach Krankheiten oder Ausreden durchsucht. Ein Minimum ist ein Minimum, keine volle Einheit. Ergebnisse stammen aus LC.goalNow; Wochenzahlen aus LC.goalWeek und LC.standardWeek. Simulierte Gegnerpunkte sind niemals Belege. Der Gast-Beispielstand wird ausdrücklich als Beispiel markiert.

Vorhandene Werte, Warum und Zukunftsvision werden nur aus ihren bestehenden Feldern angezeigt. Die Antworten sind regelbasiert, kein freier Chat und keine psychologische Diagnose. Unbekannte oder nicht erfasste Tätigkeiten außerhalb der App bleiben unbekannt. Gleichbleibende Daten können dieselbe Regel auslösen; keine künstliche Gesprächsgeschichte wird behauptet.

## Migration und Persistenz

Die technischen Schlüssel nem, duel, nemMsg, ctime sowie Ziele, Saison- und Punkthistorien bleiben erhalten. Sichtbare Benennung und Reaktionen verwenden dieselbe Zukunfts-Ich-Identität. Der optionale Duellbereich bezeichnet den Vergleich als Plan-Simulation; er bleibt unabhängig vom persönlichen Tagesurteil. Alte Rivalenmeldungen werden nicht mehr als Stimme der Figur angezeigt, neu erzeugte Kompatibilitätsmeldungen sind sachlich. Keine Daten werden automatisch gelöscht oder zurückgesetzt.

Neu: S.life.futureSelf mit v, enabled, minimized, hints, lastMode, hintDay und höchstens 30 history-Einträgen aus Tag/Modus/Regelcode. Keine Antworttexte, Warum- oder Visionskopien im Verlauf. Die bestehende Speicherung je Gast/Konto speichert diese Einstellungen mit; die Antworten werden beim Öffnen aus dem aktuellen Stand neu berechnet. Der vorhandene lokale Sicherungsexport bleibt nutzbar. Cloud-Sync und Supabase werden nicht geändert; sensible Bereiche bleiben von den bestehenden Sync-Projektionen abhängig.

Default: Präsenz an, Hinweise aus. Minimieren und Abschalten bleiben nach Reload bestehen. Wiederaktivierung ist über Optionen möglich. Nach Opt-in höchstens ein Inline-Hinweis pro Spieltag; Ausblenden bleibt für diesen Tag wirksam. Kein Dialog öffnet sich von selbst. Die alte automatische Aufgabenrückfrage respektiert jetzt ebenfalls den bestehenden Erinnerungen-Schalter.

## Bedienung und Prüfung

Die Leiste hat eigenen Platz über der Navigation. Inhalt und bestehende Undo-/Rückfrage-Elemente halten Abstand; eine Bildschirm-Sicherheitszone wird berücksichtigt. Der Dialog hat Namen, sichtbare Fokusringe, Tab-Begrenzung und Escape; beim Schließen kehrt Fokus zurück. Beim Wechsel in vorhandene Formulare wird das neue Dialogfenster fokussiert. Bedienelemente sind mindestens 44 px erreichbar; lange Antworten umbrechen.

Automatisch: zehn Testskripte (future-self, today-focus, calendar, life-core, release-smoke, auth-contract, wisdom-core, ftue-flows, auth-resume, service-worker). Die neuen Tests decken leere/vollständige Profile, offene/erledigte Vorhaben, unbekannte Erledigungstage, Rückschläge, Erholung, schwierigen Tag ohne unterstellte Energieknappheit, Standards/Minimum/Commitment, echte Ergebniswerte, unveränderte Bestandsdaten, reine Leselogik ohne Punkte und datensparsame Persistenz ab. Offline-Test umfasst das neue Skript und den Upgradepfad über versionsgebundene URLs; Release ww-v59.

Browser: frischer lokaler Gast, alle drei Modi, Zugang aus Heute/Aufgaben/Mein Leben/Fortschritt/Duell, aktuelle Rückmeldung nach tatsächlicher Erledigung, Modus/Minimieren/Deaktivieren nach Reload, Wiederaktivierung über Optionen, einmaliger Tageshinweis und Ausblenden mit anschließendem Reload geprüft. Escape/Fokusrückkehr und Tab-Schleife bestätigt. Mobile 375 px, Desktop sowie hell/dunkel und antik/violet geprüft. Leere und vollständige persönliche Profile sind deterministisch im Test abgedeckt; kein echter E-Mail-Postfach-Test. Veröffentlichung erst nach Review; keine Supabase-Einstellung oder Migration geändert.

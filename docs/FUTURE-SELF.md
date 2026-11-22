# Dein Zukunfts-Ich

## Vorhandene Architektur und Migrationsvorschlag

React/htm in index.html trägt die Oberflächen; life-core.js liefert Werte/Warum, vier Lebensbereiche, Ziele, goalWeek, standardWeek, tägliche Logs, Debrief, Abendplanung und Success Loop. todayPriorities priorisiert bereits offene Handlungen einschließlich Standards und Commitment. Die Zukunftsvision liegt privat in life.future (FutureStory/FutureSheet), nicht in einem getrennten Profil. Wisdom bleibt ein unabhängiges Impulsarchiv ohne Fortschrittseffekte.

Nemesis ist bisher bereits ein Modell des eigenen Tagesplans: nemTasks/buildNemesisPlan/nemDefault steuern Plan und Animation, duelNow den optionalen Vergleich. nem, duel, ctime, Punkte und Saisonhistorien sind bestehende Daten. Der bisherige Rivalenton enthält Zuschreibungen und Sticheleien; er passt nicht zur neuen Figur.

Vorschlag vor Implementierung: Die sichtbare Figur wird als Zukunfts-Ich vereinheitlicht, bestehende technische Nemesis-Schlüssel und Duellberechnungen bleiben erhalten. Der optionale Vergleich wird ausdrücklich als Plan-Simulation bezeichnet. Seine Modellstände sind keine tatsächlichen Handlungen einer realen Person. Neue Antworten werden nur aus Nutzereinträgen und vorhandenen Core-Funktionen abgeleitet; die simulierte Gegenseite ist keine Beweisquelle. Alte gespeicherte Rivalenmeldungen bleiben Daten, werden aber nicht als Stimme des Zukunfts-Ichs angezeigt.

Technisch ergänzt ein eigenes reines Regelmodul future-self-core.js die vorhandenen Module. React-Komponenten stellen eine reservierte, nicht überlagernde Zugangsleiste über der Navigation und ein freiwillig geöffnetes Sheet bereit. Keine neue Fortschrittsberechnung, keine externe KI und keine neue Onboarding-Pflicht. Ein kurzer Hinweis im bestehenden Onboarding erklärt den späteren Zugang. Einstellungen und Interaktionsmetadaten liegen lokal im bestehenden Spielstand; Antworten und private Textkopien werden nicht als zusätzlicher Verlauf gespeichert.

Vor Merge ist Claudes Review vorgesehen. Basis-Reihenfolge: Kalender #20, Heute #21, danach dieser Feature-Branch. Kein automatisches Merge oder Deployment.

# Zwei Wochen Selbsttest

Stand: 27.11.2026. Beschlossener Rahmen: zwei Wochen Alltagstest mit Funktionsstopp. Nur bestätigte Fehler beheben; Oberfläche, Punkteformel und Fortschrittssysteme währenddessen stabil halten.

## Zeitraum und Ausgangsstand

- Tatsächlicher Beginn: noch einzutragen.
- Ende: nach 14 Kalendertagen; bei Beginn am 27.11.2026 Auswertung am 11.12.2026.
- Gerät, Browser und tatsächlich angezeigte Release-Version beim Beginn notieren. Der lokale Kandidat ww-v135 ist dadurch nicht als veröffentlicht bestätigt.
- Möglichst denselben Browser auf demselben Gerät verwenden. Persönliche Spielstände werden derzeit nicht zwischen Geräten synchronisiert.

## Täglich kurz beobachten

Die App normal nutzen, keine zusätzlichen Aufgaben nur für den Test anlegen. Eine kurze Notiz reicht; keine neue Checkliste innerhalb der App einbauen.

| Frage | Was notieren? |
| --- | --- |
| Finde ich sofort, was ich heute tun will? | Direkt gefunden oder gesucht? Falls gesucht: an welcher Stelle? |
| Kann ich an schwierigen Tagen sinnvoll reduzieren oder pausieren? | War Minimum, Pause oder Ruhetag passend und auffindbar? Nur bei tatsächlichem Bedarf beantworten. |
| Bleiben meine Einträge und Fortschritte korrekt? | Auffälligkeiten nach Erledigen, Rückgängig, Neuladen oder dem nächsten echten Tageswechsel. |
| Hilft der Rückblick bei einer konkreten Änderung? | Beim Wochenrückblick: Was will ich anders machen? Beim nächsten Rückblick: Hat es geholfen? |

Notizvorlage, nur bei Bedarf:

> Datum / Version / Gerät und Browser:
> Situation und gewünschte Handlung:
> Erwartet / tatsächlich passiert:
> Auswirkung: blockiert / erschwert / unklar:
> Wiederholt aufgetreten?:

Notizen lokal behalten. Keine privaten Reflexionstexte, Passwörter oder Bestätigungslinks in Fehlerberichte übernehmen.

## Technische Prüfpunkte bei Auffälligkeiten

Diese Punkte sind Prüfhypothesen, keine festgestellten Fehler. Reproduktionsversuche mit Löschen, Import oder geändertem Datum in einem getrennten Testspielstand durchführen; den echten Alltagsspielstand und die Geräteuhr dafür nicht verändern.

- Mehrfaches Tippen darf dieselbe Erledigung nicht mehrfach werten.
- Rückgängig muss die betroffene Erledigung und ihre unmittelbaren Auswirkungen korrekt zurücknehmen.
- Minimum und anschließende volle Ausführung dürfen dieselbe Sitzung nicht doppelt zählen; die jeweilige Bedeutung von Minimum und voller Ausführung bleibt erhalten.
- Neuladen und echte Tageswechsel dürfen keine Einträge verlieren oder doppelt werten. Pausen und Ruhetage gemäß den bestehenden Regeln berücksichtigen.
- Verknüpfte Standards und Zielhandlungen dürfen dieselbe Ausführung nicht doppelt belohnen.
- Das Entfernen einer Gewohnheit ist von der Korrektur einer irrtümlichen Erledigung zu unterscheiden. Verdiente Erfahrung nicht pauschal rückwirkend löschen.
- Zielmesswerte, Wochenregelmäßigkeit, Saisonpunkte und Tempelentwicklung anhand ihrer jeweiligen Regeln prüfen; sie müssen keinen identischen Fortschrittswert anzeigen.

Bei einem bestätigten Fehler: Reproduktion, betroffene Regel und kleinste passende Korrektur dokumentieren; gezielte bestehende Tests ausführen und bei Bedarf eine Regression ergänzen. Fehlerkorrekturen mit Datum und Version im Testverlauf notieren.

## Auswertung nach Woche 1 und Woche 2

1. Die vier Beobachtungsfragen mit konkreten Alltagssituationen beantworten. Fehlende Gelegenheiten als „nicht beobachtet“ markieren.
2. Unter Optionen → Daten sichern die Nutzungsübersicht ansehen und bei Bedarf „Als Text kopieren“ verwenden. Anfangs- und Endstand getrennt lokal aufheben, damit ältere Nutzung nicht dem Test zugeschrieben wird. Die Zählung nicht für den Test zurücksetzen.
3. Häufige Aufrufe zeigen Nutzung, keinen nachgewiesenen Nutzen. Selten geöffnete Funktionen sind nicht automatisch überflüssig. Die Zähler enthalten keine vollständigen Abläufe, Zeitmessungen oder Gründe für Abbrüche.
4. Offene echte Konto-/Einladungstests separat nach [FRIENDS-TEST.md](FRIENDS-TEST.md) behandeln. Der Alltagstest ersetzt keinen Mail- oder Mehrgeräte-Test.

Die Nutzungszählung bleibt lokal im separaten Speicher `war_within_usage_v1` und ist nicht Bestandteil der Spielstandsicherung. Private Texte werden für die Auswertung nicht benötigt.

## Entscheidung nach dem Test

Höchstens ein bis zwei Verbesserungen auswählen. Jede braucht eine konkrete Beobachtung, eine erwartete Verhaltensverbesserung und ein überprüfbares Abnahmekriterium.

| Beobachtung | Entscheidung |
| --- | --- |
| Reproduzierbar falsche Wertung, verlorene Daten oder blockierter Ablauf | Fehler priorisieren; während des Funktionsstopps korrigierbar. |
| Wiederkehrende Suche oder vermeidbarer Bedienaufwand | Nach dem Test die kleinste passende Vereinfachung prüfen. |
| Rückblicke führen trotz ausreichender Einträge zu keiner brauchbaren nächsten Handlung | Bestehende Vorschläge und Experimente gezielt prüfen. |
| Funktion selten genutzt oder neue Idee ohne konkretes Problem | Vorerst zurückstellen. |

Vorlage für eine ausgewählte Verbesserung:

- Beobachtung mit Datum und Häufigkeit:
- Betroffener bestehender Ablauf:
- Kleinste Änderung:
- Erwarteter Nutzen im Alltag:
- Abnahmekriterium:
- Ergebnis nach erneuter Nutzung:

Vorerst zurückgestellt: neue Momentum-Kennzahl, zusätzliche Charakterattribute, neue XP-Multiplikatoren, Bonuspunkte proportional zu Trainingsdauer und große Habit-Engine-Neuentwicklung. Automatische Backups und Cloud-Sync benötigen eine eigene Entscheidung einschließlich Schutz privater Texte und überprüfbarer Wiederherstellung.

## Ergebnisse

Noch keine Alltagsergebnisse erfasst. Eine angelegte Prüfliste bedeutet keinen bestandenen Test.

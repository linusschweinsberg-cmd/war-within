# THE WAR WITHIN – Wisdom of the Warrior

*Small lessons. Stronger mind. Better decisions.*

Kurze Impulse zur Selbstreflexion, keine Befehle und kein Motivationsspruch-Generator. Eine Weisheit erscheint nur dort, wo sie zur dokumentierten Situation passt, und beansprucht wenige Sekunden.

## Architektur

| Datei | Aufgabe |
|---|---|
| `wisdom-core.js` | Reine Logik ohne UI: Kategorien, Bibliothek (72 Einträge), Kontext-Erkennung, Auswahlregeln, Favoriten, Anzeigehistorie, Migration. Hängt sich als `window.WC` an. |
| `index.html` | Abschnitt „WISDOM OF THE WARRIOR“: `WisdomCard` (Steintafel nach Designkonzept: doppelter Rahmen, Mäander, Inschrift in Cinzel), `WisdomSlot` (eine Stelle in der App), `WisdomCodex` (Archiv-Sheet `codex` mit Lorbeer-Header, Kategorie-Kacheln und Tafel-Zeilen in griechischen Zahlzeichen); Einstellungen im Sheet `settings`. |
| `tests/wisdom-core.cjs` | Abnahmekriterien als Szenarien (siehe unten). |

## Datenmodell

Jede Weisheit: `{id, category, text, explanation, triggers[], priority 1–3, icon, language:'de'}`, z. B. `wisdom_resilience_001`.

Kategorien: Ownership, Discipline, Resilience, Feedback Loop, Competence, Self-Efficacy, Compounding, Reflection, Recovery (je 8 Einträge).

Auslöser: `daily_briefing`, `missed_task`, `daily_reflection`, `milestone`, `new_season`, `recovery`, `neutral`.

Spielstand `S.wisdom` (Version 1, im bestehenden localStorage-Spielstand):

- `on`: Funktion an/aus
- `fav[]`: gespeicherte Weisheiten (Inschriften)
- `seen[]`: Anzeigehistorie `{id, d, place}` (max. 300), `d` = absoluter Life-OS-Tag `S.life.d`
- `slots{place}`: Impuls des Tages je Stelle `{d, id, key, reason}`
- `hid{place}`: Tag, an dem der Nutzer den Impuls ausgeblendet hat
- `used{place}`: bereits gewürdigte Meilensteine/Saisons

`WC.ensure(S)` läuft beim Start (idempotent), ergänzt fehlende Felder und verwirft unbekannte IDs. Alte Spielstände ohne `S.wisdom` funktionieren ohne Datenverlust.

## Stellen in der App

| Stelle | Ansicht | Anlass |
|---|---|---|
| `today` | Heute, unter „Danach“ (verdrängt Hauptziel und Aufgaben nicht) | Tagesimpuls (Eigenverantwortung, Disziplin, Fokus); nach einem Tag mit ausgelassenen Aufgaben Wiedereinstieg; bei dokumentierter Erschöpfung Erholung |
| `debrief` | Unten im Daily Debrief, danach in Reflexion | Passend zum ausgewerteten Tag: alles erledigt → Können/Selbstwirksamkeit; Auslassungen → Feedback/Reflexion/Resilienz; nichts geplant → Reflexion |
| `milestone` | Fortschritt, oben | Neuer bedeutender Tempel-Baustein (Grundstein, Ergebnis-Meilenstein, Ziel erreicht, bewährtes Experiment, Wiederaufnahme, Restaurierung) aus dieser oder der letzten Woche |
| `season` | Mein Leben, unter dem Tempel | Erste Woche einer neuen Tempel-Saison |

Dazu in „Mein Leben“ eine schlichte Zeile zum Wisdom Codex („N Inschriften gespeichert“) und in den Optionen Ein/Aus sowie „Wisdom Codex öffnen“.

## Auswahlregeln (`WC.resolve`, `WC.choose`)

1. Inhaltlich passend: Kandidaten mit passendem Auslöser; bevorzugte Kategorien des Anlasses +3, dazu Priorität.
2. Keine Wiederholung innerhalb von 7 Tagen, solange passende Alternativen da sind; sonst die am längsten nicht gezeigte.
3. Höchstens ein Impuls pro Stelle und Tag; der Impuls bleibt den Tag über gleich. Der reguläre Tagesimpuls ist `today`; Debrief, Meilenstein und Saison sind an eine konkrete Nutzeraktion gebunden.
4. Nicht während der Aufgabenbearbeitung: keine Impulse in Aufgaben, Tagesplan, Erfassungs- oder Bewertungs-Sheets.
5. Keine automatischen Dialoge: Karten stehen im Seitenfluss, jede ist mit einem Tipp ausblendbar (für heute).
6. Ohne Kontext: neutraler Tagesimpuls ohne Begründungszeile; Debrief, Meilenstein und Saison zeigen dann nichts.
7. Erledigen allein belohnt nicht: wöchentliche Routine-Bausteine lösen keinen Meilenstein-Impuls aus, jeder Meilenstein höchstens einmal, höchstens einer pro Tag.

Abwechslung: Kategorien der letzten zwei Tage −1, häufig gezeigte Einträge leicht abgewertet. Die Wahl innerhalb der besten Gruppe ist deterministisch (Tag + Anlass), damit sie bei jedem Rendern gleich bleibt.

**Erholung** wird nur angenommen, wenn der Nutzer selbst „Keine Energie“ im Debrief notiert (gestern oder zweimal in fünf Tagen) oder einen bewussten Ruhetag gesetzt hat. Verpasste Aufgaben allein führen nie dazu. Keine Diagnosen.

**Begründungszeile** nennt nur dokumentierte Fakten („Du hast zuletzt wenig Energie notiert“, „Zu deinem Baustein: Ziel erreicht“), nie eine erfundene Analyse.

## Inhaltliche Leitlinien

- Eigene Formulierungen, keine Zitate, keine Zuschreibungen an Philosophen.
- Kein Schmerz, keine Selbstüberforderung, keine Schuld als Voraussetzung für Erfolg; Impulse nach verpassten Aufgaben ohne Vorwurf. Der Test prüft verbotene Formulierungen.
- Kurz (≤ 120 Zeichen Haupttext), optional ein konkreter Anwendungshinweis („Wie anwenden?“).

## Verbindung zum Life Temple

Bei neuen Bausteinen erscheint auf „Fortschritt“ ein passender Impuls; zu Beginn einer neuen Tempel-Saison einer in „Mein Leben“. Gespeicherte Weisheiten gelten als persönliche Inschriften. Lesen, Speichern und Ausblenden verändern weder `S.life` noch Tempelpunkte oder Punkte; die Säulen bleiben an Handlungen und Meilensteine gebunden (Test „Tempel: Lesen und Favoriten erzeugen keinen Fortschritt“).

## Tests

`node tests/wisdom-core.cjs` deckt ab: Bibliothek vollständig, verantwortbare Inhalte, Briefing, Schließen, ein Impuls pro Tag, 7-Tage-Regel, verpasste Aufgabe ohne Scham, Erholung nur bei dokumentierter Erschöpfung, Debrief, Meilenstein, neue Saison, Favoriten nach Neuladen, vollständige Deaktivierung, keine erfundene Analyse ohne Daten, kein Tempel-Fortschritt, Migration, Einbindung in `index.html` und `sw.js`.

## Grenzen

- Der Tag folgt dem Life-OS-Tageszähler (`S.life.d`), der im Prototyp weiter über „Zum nächsten Tag vorspulen“ wechselt.
- Nur Deutsch; das Feld `language` ist für weitere Sprachen vorbereitet.
- Keine KI-Auswahl, bewusst einfache transparente Regeln.
- Favoriten liegen wie der übrige Spielstand nur auf dem Gerät.

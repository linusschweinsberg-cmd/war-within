# Heute: wichtigste Handlung und nächster Zeitblock

## Aktueller Aufbau (ww-v79)

Dieser Abschnitt ersetzt die unten beschriebenen früheren Reihenfolgen. Standardmäßig sichtbar: Datum und Heute-Titel, Hauptschlacht (oder bewusste Wahl/Ruhetag/Leerzustand), höchstens zwei Nebenmissionen und einmal „Im Blick“ mit Tagesplan und Reflexion. Saison- und Konstanzzahlen stehen nicht mehr im Kopf.

Drei geschlossene Zusatzbereiche: „Bereiche heute“ mit den bestehenden Schildfiltern und Zugang zu allen Aufgaben; „Fortschritt und Zukunfts-Ich“ mit den vier Fortschrittsebenen, Zielprojektion und Begleitung; „Standards und Impulse“ mit den bisherigen Zusatzinhalten. Die Schilde filtern weiterhin Vorschläge, ohne die gewählte Hauptschlacht zu ersetzen. Die Auswahl und Rückgängig-Logik bleiben gleich.

Ein genanntes Hindernis wird als „Von dir eingeplant“ bzw. „Zuletzt genannt“ beschriftet. Aus einer erledigten Handlung wird nicht behauptet, das Hindernis sei überwunden.

Prüfung: mobile Ansichten 390 × 844 und 375 × 812, Wahl, Erledigen, Rückgängig und Reload; optionale Inhalte aufklappbar, „Im Blick“ erscheint einmal, keine Konsolenfehler. Neun passende Testsuiten bestanden. Release-Skripte und Cache verwenden ww-v79.

Schritt 2 des Nutzungsplans, auf dem Kalender-PR #20 aufgebaut. Branch codex/today-focus; Claude reviewt vor der Übernahme.

## Startseite

Aufbau (seit ww-v63, Variante B „Bereichs-Ringe“ im Antik-Stil wie die übrigen Seiten: großes blasses Emblem (Aspis, bei allen geschlossenen Schilden Lorbeer), Datum, „HEUTE“, Mäander-Band, flache Karten ohne Verläufe; Ringe als Hoplitenschilde mit Bronzerand, Knopf „Schild schließen“): **Kopfkarte** mit Datum, Menü/Konto, „X von N Ringen“ (führt zu Aufgaben) und vier Ringen je Lebensbereich. Ein Ring zeigt erledigt/geplant aus „Fokus heute“ (`focusMs`, wie im Aufgaben-Tab) plus eigenständigen Standards; ohne Plan bleibt er blass und führt zu Mein Leben, geschlossen zeigt er einen Haken. Tippen auf einen Ring holt die nächste Handlung dieses Bereichs in die Jetzt-Karte (`areaItem`), erneutes Tippen hebt die Auswahl auf. **Jetzt-Karte** einfarbig in gedämpftem Rost (Fläche 18 %, Symbol 32 %, Knopf 72 % Rost auf die Karte gemischt): „<Bereich> fehlt noch“, Titel, großer Knopf „Ring schließen“, wenn diese Handlung den Ring schließt, sonst „Erledigt“/„Erfassen“. **Zukunfts-Ich-Kachel** (Er/Du, ersetzt auf Heute die untere Leiste). **Im Blick:** Zeitblock und Reflexion als zwei kleine Kacheln. Darunter eingeklappt „Mehr“. Eine im Titel schon genannte Dauer wird nicht wiederholt.

Heute zeigt eine Hauptaufgabe, höchstens zwei weitere Vorschläge, den nächsten fest eingeplanten Zeitblock und den Zugang zum Rückblick. Alle Aufgaben bleiben über einen eigenen Knopf und den Aufgaben-Tab erreichbar. Standards, Impulse, Wirkungsmodell und Wettbewerb stehen im eingeklappten Zusatzbereich. Im Fokusmodus bleiben Nemesis und Duell auch nach dem Aufklappen verborgen. Die Wissensauswahl wird erst beim tatsächlichen Aufklappen gerendert und als gesehen vermerkt.

Prioritäten werden ohne zusätzliche gespeicherte Liste aus vorhandenen Angaben gewählt: offene Abendentscheidung, unverknüpfter erster Schritt, explizite Tagespriorität, nächste Handlung des Hauptziels, bestehendes Briefing, eigenständige Standards und weitere vorhandene Aufgaben. Duplikate anhand ihrer Mission-/Standard-ID entfallen; maximal drei Elemente bleiben sichtbar. Die weiteren Handlungen sind ausdrücklich Vorschläge, keine neu angelegten Pflichtaufgaben. Nach dem Erledigen rückt die nächste offene Handlung nach.

Erfüllte Wochenquoten und erledigte Missionen werden übersprungen. Eigenständige Standards erscheinen nach einem vollen oder Minimum-Eintrag heute nicht erneut. Am bewussten Ruhetag zeigt die Prioritätenkarte einen Erholungshinweis; die Aufgaben werden nicht gelöscht. Bei einem leeren Tag gibt es direkte Wege zum Rückblick oder zum Ziel.

Missionen verwenden die vorhandene Erledigungs-/Erfassungslogik. Unverknüpfte Commitments und Standards verwenden die bisherigen Daten und Rückgängig-Snapshots. Die Auswahl erzeugt keine Punkte oder Spielstandänderungen. Beschriftungen über Langdruck werden an den neuen normalen Schaltflächen nicht angezeigt; die Aufgabenansicht behält ihren bisherigen Langdruck.

## Hauptschlacht (ww-v76, Branch claude/hauptschlacht)

Ersetzt die Jetzt-Karte. Aufbau Heute von oben: Kopf mit Datum, kompakt **Saison N · Tag X von Y · Konstanz a/b Tage**, Bereichs-Schilde · **Hauptschlacht-Karte** · bis zu drei **Nebenmissionen** · **Fortschritt** (Dauerhaft/Saison) · Zukunfts-Ich · Im Blick · Mehr. Ein Schild antippen holt die nächste Handlung dieses Bereichs an den Anfang der Nebenmissionen bzw. der Auswahl; die Hauptschlacht bleibt.

- **Nie automatisch.** Hauptschlacht ist nur, was der Nutzer heute angetippt hat (`S.battle={k:dayKey,key}`) oder vorher ausdrücklich festgelegt hat: Abendentscheidung, Start im Onboarding, erster Schritt, Debrief/Tagesrückblick (`nextPrio`). Sonst fragt die Karte „Welche Handlung zählt heute am meisten?“ mit bis zu drei Kandidaten aus `todayPriorities`; der erste ist nur als „Vorschlag“ markiert. „Ändern“ öffnet die Auswahl wieder. Die Wahl vergibt keine Punkte.
- **Ein Tipp erledigt** über die bestehende Logik (`completePriority` → `c.start`/`complete`, Standards, erster Schritt). Missionen mit Erfassung öffnen weiter ihr Erfassen-Sheet.
- **Erledigt/offen wird abgeleitet**, nicht gespeichert (`todayBattle`, `battleItem`): Mission mit Erledigung heute (`ctime` des Tages bzw. tägliches `done`), Standard mit Eintrag heute (nur Minimum → „Minimum gehalten“), erster Schritt. Eine Wochenmission von einem früheren Tag gilt nicht als heutiger Sieg.
- **Sieg-Rückmeldung:** Der Wechsel offen → gewonnen zeigt 700 ms Bronze-Schein und Schild (`.battle-fx`), „Schlacht gewonnen“ als Statuszeile. Kein Overlay, nichts wird blockiert, bei `prefers-reduced-motion` keine Animation. Die gewonnene Karte ist so hoch wie die offene, damit ein zweiter Tipp nichts Nachgerücktes trifft.
- **Mehrfachtippen und Rückgängig:** Missionen sperrt `complete()` (Sperre plus `isDone` im Update). Standards und erster Schritt zählen höchstens einmal pro Tag (`priorityDoneToday`, 700-ms-Sperre). Rückgängig stellt den kompletten Snapshot wieder her, die Karte wird wieder offen.
- **Fortschritt aus echten Daten** (`compoundNow`, `momentumOf`): *Dauerhaft* = erledigte Missionen (`tally`) + Standard-Einträge + erster Schritt; bleibt bei verpassten Tagen. *Saison* = dasselbe seit Saisonstart, dazu „→ N möglich“ = Saisonstand + Tempo × Resttage / 7. Tempo ab Saisontag 8 = Erledigungen der letzten 7 Tage, vorher der eigene Wochenplan; die Annahme steht immer dabei. *Konstanz* = Tage mit Handlung in den letzten 7 Saisontagen; Ruhetage zählen nicht dagegen, heute erst mit einer Handlung. Keine erfundenen Wirkungen, keine Kurven; Tempel und Fortschritt-Tab bleiben unverändert.
- **Fortschritt in vier Ebenen** (ww-v76): Heute (Hauptschlacht, erledigt), Woche (Planerfüllung der Ziel-Handlungen und Standards), Saison (Handlungen, Potenzial, Annahme), Dauerhaft (Handlungen, Rekord-Serie, Tempel-Phase). Darunter für das Hauptziel der Link „Wohin führt das?“ zur Folgen-Ansicht (`docs/IMPACT.md`).
- **Morgen-Briefing** (vor 12 Uhr, keine eigene Karte): Die Hauptschlacht-Karte heißt „Morgen-Briefing · Hauptschlacht“ und nennt ein Hindernis (`battleObstacle`: abends genannt, sonst das häufigste aus den Debriefs der letzten 7 Tage; Erholungstage zählen nicht). Höchstens zwei Nebenmissionen. Die Hindernis-Zeile steht auch auf der gewonnenen Karte, damit die Höhe gleich bleibt.
- **Abendrückblick** im bestehenden Daily Debrief: oben das Ergebnis der Hauptschlacht, dann „Was du erreicht hast“, „Was hat Widerstand erzeugt?“, „Nächste Anpassung?“ und im Abendschritt „Deine Hauptschlacht für morgen“. Neu ist „Ging es heute um Erholung?“ (Bewusste Ruhe/Krank): keine Hindernisfrage, nichts gilt als ausgelassen, der Tag wird als bewusste Pause vermerkt (`S.rest`, Serie bleibt) und `daily[].recover` gespeichert. Muster ignorieren solche Tage.
- Tagesablauf-Test: `node tests/today-dayflow.cjs` (wählen, erledigen, rückgängig, neu laden, Tageswechsel, verpasster Tag, Verschieben über Debrief, Abendplan mit Hindernis, Erholung, Export/Import).
- Spielstand bleibt `v:5`; `battle` ist ein optionales Feld, alte Stände und Export/Import funktionieren unverändert.
- Tests: `node tests/today-battle.cjs` (keine Automatik, Wahl/Ändern, frühere Festlegung, Mehrfachtippen, Rückgängig, Minimum, Wochenmission, Compound-Zahlen, Konstanz mit Ruhetag, Laden alter Stände, Animationsdauer und reduzierte Bewegung). Browser 375×812: Wahl, Doppeltipp (Punkte einmal, kein Fehltreffer), Rückgängig, hell/dunkel.

## Zeitblock

Ein Zeitblock braucht eine tatsächlich gespeicherte numerische Startzeit und Dauer im bestehenden Tagesplan. Reine Tageszeitwünsche (morgens/abends) und der automatisch verteilte Nemesis-Plan gelten nicht als feste Buchung. Erledigte Aufgaben, Schlaf und ungültige Intervalle werden nicht als nächster Handlungsblock gezeigt.

Aktuell laufendes Zeitfenster hat Vorrang, danach das früheste künftige. Wenn nur vergangene offene Blöcke übrig sind, nennt die Karte das vergangene Zeitfenster und bietet eine Anpassung an. Ohne konkrete Uhrzeit lädt sie zum Planen ein. Keine Aufgabe wird automatisch erledigt, verschoben oder gestartet. Der Knopf öffnet den vorhandenen Tagesplan direkt in einem Sheet.

Der zugrunde liegende Tagesplan gilt weiterhin täglich. Individuelle Wochentage, verfügbare Kapazität, Termine und Puffer gehören zu Schritt 3; Timer und Umplanung bei Unterbrechung zu Schritt 4. Diese Funktionen werden hier nicht vorgetäuscht.

## Prüfung

Alle neun Skripte bestehen: today-focus, calendar, life-core, release-smoke, auth-contract, wisdom-core, ftue-flows, auth-resume und service-worker. today-focus prüft Maximalzahl und Eindeutigkeit der Prioritäten, Abendvorrang, Nachrücken, Wochenquoten, Standards/Minimum, Erstschritt, Ruhetag, leeren Tag, Undo, unveränderte Punkte sowie aktuelle, künftige, vergangene und ungültige Zeitfenster.

Browser: frischer lokaler Gast, Erledigen und Rückgängig mit wiederhergestellter Reihenfolge, Tagesplan direkt öffnen, Plan ändern und nächsten Block auf Heute anzeigen, Reload, Zusatzbereich und Fokusmodus geprüft. 375 px, hell/dunkel und antik/violet geprüft, keine Konsolenfehler. Bestehende Spielstände werden nicht zurückgesetzt. Release-URLs und Service Worker: ww-v58. Kein Merge oder Live-Deployment, keine Supabase-Änderung.

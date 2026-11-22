# Heute: wichtigste Handlung und nächster Zeitblock

Schritt 2 des Nutzungsplans, auf dem Kalender-PR #20 aufgebaut. Branch codex/today-focus; Claude reviewt vor der Übernahme.

## Startseite

Heute zeigt eine Hauptaufgabe, höchstens zwei weitere Vorschläge, den nächsten fest eingeplanten Zeitblock und den Zugang zum Rückblick. Alle Aufgaben bleiben über einen eigenen Knopf und den Aufgaben-Tab erreichbar. Standards, Impulse, Wirkungsmodell und Wettbewerb stehen im eingeklappten Zusatzbereich. Im Fokusmodus bleiben Nemesis und Duell auch nach dem Aufklappen verborgen. Die Wissensauswahl wird erst beim tatsächlichen Aufklappen gerendert und als gesehen vermerkt.

Prioritäten werden ohne zusätzliche gespeicherte Liste aus vorhandenen Angaben gewählt: offene Abendentscheidung, unverknüpfter erster Schritt, explizite Tagespriorität, nächste Handlung des Hauptziels, bestehendes Briefing, eigenständige Standards und weitere vorhandene Aufgaben. Duplikate anhand ihrer Mission-/Standard-ID entfallen; maximal drei Elemente bleiben sichtbar. Die weiteren Handlungen sind ausdrücklich Vorschläge, keine neu angelegten Pflichtaufgaben. Nach dem Erledigen rückt die nächste offene Handlung nach.

Erfüllte Wochenquoten und erledigte Missionen werden übersprungen. Eigenständige Standards erscheinen nach einem vollen oder Minimum-Eintrag heute nicht erneut. Am bewussten Ruhetag zeigt die Prioritätenkarte einen Erholungshinweis; die Aufgaben werden nicht gelöscht. Bei einem leeren Tag gibt es direkte Wege zum Rückblick oder zum Ziel.

Missionen verwenden die vorhandene Erledigungs-/Erfassungslogik. Unverknüpfte Commitments und Standards verwenden die bisherigen Daten und Rückgängig-Snapshots. Die Auswahl erzeugt keine Punkte oder Spielstandänderungen. Beschriftungen über Langdruck werden an den neuen normalen Schaltflächen nicht angezeigt; die Aufgabenansicht behält ihren bisherigen Langdruck.

## Zeitblock

Ein Zeitblock braucht eine tatsächlich gespeicherte numerische Startzeit und Dauer im bestehenden Tagesplan. Reine Tageszeitwünsche (morgens/abends) und der automatisch verteilte Nemesis-Plan gelten nicht als feste Buchung. Erledigte Aufgaben, Schlaf und ungültige Intervalle werden nicht als nächster Handlungsblock gezeigt.

Aktuell laufendes Zeitfenster hat Vorrang, danach das früheste künftige. Wenn nur vergangene offene Blöcke übrig sind, nennt die Karte das vergangene Zeitfenster und bietet eine Anpassung an. Ohne konkrete Uhrzeit lädt sie zum Planen ein. Keine Aufgabe wird automatisch erledigt, verschoben oder gestartet. Der Knopf öffnet den vorhandenen Tagesplan direkt in einem Sheet.

Der zugrunde liegende Tagesplan gilt weiterhin täglich. Individuelle Wochentage, verfügbare Kapazität, Termine und Puffer gehören zu Schritt 3; Timer und Umplanung bei Unterbrechung zu Schritt 4. Diese Funktionen werden hier nicht vorgetäuscht.

## Prüfung

Alle neun Skripte bestehen: today-focus, calendar, life-core, release-smoke, auth-contract, wisdom-core, ftue-flows, auth-resume und service-worker. today-focus prüft Maximalzahl und Eindeutigkeit der Prioritäten, Abendvorrang, Nachrücken, Wochenquoten, Standards/Minimum, Erstschritt, Ruhetag, leeren Tag, Undo, unveränderte Punkte sowie aktuelle, künftige, vergangene und ungültige Zeitfenster.

Browser: frischer lokaler Gast, Erledigen und Rückgängig mit wiederhergestellter Reihenfolge, Tagesplan direkt öffnen, Plan ändern und nächsten Block auf Heute anzeigen, Reload, Zusatzbereich und Fokusmodus geprüft. 375 px, hell/dunkel und antik/violet geprüft, keine Konsolenfehler. Bestehende Spielstände werden nicht zurückgesetzt. Release-URLs und Service Worker: ww-v58. Kein Merge oder Live-Deployment, keine Supabase-Änderung.

# Charakter zum Saisonbeginn

Freiwillige Selbsteinschätzung der Ausgangslage für eine Saison. Der Nutzer kombiniert frei Stärken und Herausforderungen, angelehnt an Eigenschaftenauswahlen in Survival-Spielen. Es gibt keine festen Klassen, keine Ausrüstung, keine Talentbäume und keine Erfahrungspunkte.

Stufe im Produktprinzip: **Selbsterkenntnis** (Einschätzung), die konkreten Vorschläge setzen bei **Handeln** an. Kein Pflichtschritt im Onboarding.

## Regeln (`character-core.js`, `window.CH`)

- 4 Startpunkte. Stärken kosten, Herausforderungen geben Punkte zurück.
  - Stärken: Ausdauernd 4, Gut organisiert 2, Neugierig 2, Gemeinsam stark 3.
  - Herausforderungen: Leicht ablenkbar 2, Alles oder nichts 3, Überplaner 2, Zu viel auf einmal 3.
- An-/Abwählen aktualisiert das Budget sofort. Bestätigen nur bei Budget ≥ 0; übrige Punkte dürfen ungenutzt bleiben. Leere Auswahl ist erlaubt.
- Vor der Bestätigung zeigt ein zweiter Schritt die Folgen jeder gewählten Eigenschaft und die Grenzen.
- Charakterpunkte sind **nur** das Budget der Zusammenstellung. Handlungspunkte, Arena-Wertung, Tempel-Bauregeln und Messwerte bleiben unverändert. Keine Strafen, keine Abzüge, keine erschwerten Aufgaben.
- Keine Diagnosen, keine abwertenden Zuschreibungen; Beschreibungen sind als „manchmal“/„gern“ formuliert.

## Welche Saison?

Entscheidung: **Tempelsaison** (`S.life.temple.cur.n`, Standard 12 Wochen, wählbar 8/12/16).

- Die Tempelsaison ist die persönliche Saison des Nutzers (Mein Leben, Ziele, Rückblicke). Die Charakterauswahl beschreibt die persönliche Ausgangslage und gehört dorthin.
- Die Arena-Saison (4 Wochen, Gruppe) ist eine gemeinsame, faire Wertung. Sie darf von persönlichen Eigenschaften nicht berührt werden.
- Die alte Punkte-Saison (`S.season`, `sLen`) treibt Punkte und Pfad; auch sie bleibt unberührt.

## Ablauf

- **Einladung:** Karte unter dem Tempel in „Mein Leben“, solange für die laufende Tempelsaison nichts entschieden ist. Nach „Neue Saison beginnen“ (Saisonbilanz) öffnet sich die Auswahl direkt als Einladung. „Überspringen“ bzw. „Bisherige Auswahl behalten“ schließt sie für diese Saison.
- **Später:** Kachel „Charakter“ in „Mein Leben“ öffnet die Auswahl jederzeit zum Ändern.
- **Saisonwechsel:** Eigenschaften bleiben bestehen (nie automatisch „geheilt“ oder entfernt). Die neue Saison lädt nur zum Prüfen ein. Vorschläge sind je Eigenschaft und Saison einmal verfügbar.

## Vorschläge (höchstens einer zur Zeit)

`CH.suggestion(S,{place,d,battleSet})` liefert höchstens einen Vorschlag: die erste gewählte Eigenschaft (feste Reihenfolge), für die es passende Daten gibt und die in dieser Saison noch nicht übernommen oder abgelehnt wurde. Nach Übernehmen oder „Nicht jetzt“ erscheint am selben Tag kein weiterer Hinweis. Anzeigen ändert nichts; erst `CH.apply` nach ausdrücklicher Auswahl. Übernehmen ist 5 Sekunden rückgängig machbar.

| Eigenschaft | Ort | Wirkung nach Auswahl |
|---|---|---|
| Gut organisiert | Mein Leben | Fester Auslöser (`action.anchor`) für eine Handlung ohne Auslöser |
| Ausdauernd | Mein Leben | Bestehende Handlung beibehalten oder passenden Auslöser festlegen; Häufigkeit bleibt gleich |
| Neugierig | Reflexion | Einmaliger Tagesversuch, ausdrücklich heute oder morgen, ohne zusätzliches Wochen-Soll |
| Gemeinsam stark | Mein Leben | Optionale gemeinsame Handlung 1×/Woche zum Hauptziel |
| Leicht ablenkbar | Mein Leben | Zeitraum ohne Ablenkung (`action.calm = {min}`) für eine Handlung |
| Alles oder nichts | Mein Leben | Kleine Variante (`action.mini`), auf Heute und in Aufgabendetails separat bestätigbar, ohne volle Erledigung/Punkte |
| Überplaner | Mein Leben | Heute einen kleinen Versuch mit bestehender Handlung (Hauptschlacht `S.battle`), nur wenn heute noch nichts gewählt ist |
| Zu viel auf einmal | Mein Leben | Schwerpunkt (`life.focus`) wählen; andere Ziele bleiben unverändert |

Vorhandene Werte werden nie überschrieben (Handlungen mit Auslöser, Variante oder Ablenkungsfrei-Zeitraum werden nicht angeboten). Ohne Ziele/Handlungen gibt es keine handlungsbezogenen Vorschläge. Es entstehen keine automatischen Missionen oder Verpflichtungen.

Ab ww-v92 darf „Neugierig“ auch ohne Ergebnisziel einen eigenen Tagesversuch anbieten. Zeitpunkt und einmaliger Umfang werden vor der Übernahme gewählt. Eine Routine entsteht erst über „Regelmäßig machen“ und die Bestätigung eines Standards oder der Verknüpfung einer bestehenden Zielhandlung. Daten, Migration alter Charakter-Handlungen, kleine Ausführung, Rückblick und Tempelbelege: [ROUTINES.md](ROUTINES.md). Die beiden Befunde aus dem Gegenreview von PR #38 sind umgesetzt; erneutes unabhängiges Codex-Gegenreview bleibt erforderlich.

## Daten

```
S.life.character = {
  v: 1, traits: ['steady', ...], status: 'none'|'set'|'skipped',
  season: <Tempelsaison der letzten Entscheidung>, t,
  hist: [{season, traits, status, t}],   // frühere Auswahlen, max. 12
  used: {'<saison>:<trait>': 'applied'|'later'}, quiet: <Kalendertag des letzten Hinweises>
}
```

Abwärtskompatibel: fehlt das Objekt, wird es leer angelegt; unbekannte IDs fallen weg, unbekannte Felder bleiben. Für einen späteren Sync nur `CH.forSync` (Codes und Saisonnummer, keine Freitexte).

## Tests

`node tests/character-core.cjs`: Budget, keine Doppelten, Bestätigung nur bei gültigem Budget, leere/übersprungene Auswahl, alte Spielstände, Persistenz und Änderung, Saisonwechsel, Vorschläge ohne automatische Planänderung, keine Überschreibung, unveränderte Arena-Wertung, Tempellogik und Punktevergabe.

> Oberfläche ab `ww-v93`: Die Tempelsaison heißt „Kapitel“. Daten (`S.life.temple.cur.n`) und Regeln bleiben gleich.

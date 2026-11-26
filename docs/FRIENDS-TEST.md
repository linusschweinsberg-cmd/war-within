# Freundestest – 26. November 2026

Ziel: drei echte Konten, bestätigte E-Mail-Anmeldung und eine gemeinsame private Arena. Persönliche Spielstände bleiben pro Browser/Konto lokal; es gibt noch keinen Geräte-Sync.

## Geprüfter Ausgangsstand

- Live-App: https://linusschweinsberg-cmd.github.io/war-within/ (`ww-v108`, Merge `071ca96`).
- Supabase-Projekt `ozfmjmxzbymlicngecda`: Dashboard erreichbar, Status Healthy.
- Site URL ist die Live-Adresse; localhost:5173 ist als Test-Redirect erlaubt.
- Vor der Freischaltung keine öffentlichen `arena_`-Tabellen vorhanden (SQL-Abfrage am 26.11.).
- Eigener SMTP-Versand ist ausgeschaltet. Der Supabase-Standardversand erreicht nur Projekt-Teammitglieder und ist auf zwei E-Mails pro Stunde begrenzt (Stand der offiziellen Dokumentation am Prüftag). Freunde nicht als Projektadministratoren hinzufügen.
- Quelle: https://supabase.com/docs/guides/auth/auth-smtp

## Reihenfolge und Abnahmekriterien

1. Eigenen SMTP-Anbieter und bestätigte Absenderadresse einrichten. Geheimnisse ausschließlich in den Anbieter-/Supabase-Einstellungen eingeben, nie im Repository. E-Mail-Bestätigung bleibt eingeschaltet.
2. Datenbank-Vorprüfung: bestehende private Objekte und Arena-Tabellen prüfen. Die Basismigration ist nicht wiederholbar. Keine bestehende Datenbank mit Testdaten füllen.
3. Geprüfte Migration `202611230001_arena.sql`, dann `202611230002_arena_v3.sql` einspielen. Die zweite Migration enthält die Review-Korrektur: Punkteantworten dürfen fremde zukünftige Aufstellungen nicht verraten. Tabellenrechte, RLS, RPCs und Realtime-Publikation anschließend nachprüfen.
4. Drei Teilnehmer registrieren ihre eigenen Konten in getrennten Browsern/Geräten und bestätigen ihre E-Mail selbst. Anmeldung, Neuladen, Abmelden, Wiederanmelden und Passwort-Reset prüfen. Private Passwörter werden vom Teilnehmer selbst eingegeben.
5. Ein Teilnehmer erstellt die Arena mit drei Plätzen und teilt den Einladungslink selbst. Beide Freunde treten bei. Mitglieder, gemeinsames Soll und Startdatum müssen überall übereinstimmen. Ein fremdes viertes Konto darf die Arena nicht lesen und keinen vollen Platz belegen.
6. Saisonstart ist nach bestehenden Regeln der nächste Montag (30.11.2026). Heute werden Registrierung und Lobby live geprüft; laufende Meldungen/Rücknahmen und Wertung zunächst nur in der lokalen Wegwerf-Datenbank. Keine Produktionsuhr und keine bestehenden Saisondaten zum Testen ändern.
7. Nach Saisonstart: Meldung, Rücknahme, Reaktion, Neuladen und Wiederverbinden mit drei echten Konten prüfen. Live-Aktualisierung darf auf regelmäßiges Nachladen zurückfallen.

## Kurze Anleitung für Teilnehmer

Öffne die Live-App, registriere dich und bestätige deine E-Mail. Nutze für deinen Fortschritt zunächst immer denselben Browser auf demselben Gerät. Beende oder überspringe das Onboarding bewusst. Die Arena ist im Fokusmodus bzw. in der ruhigen Startwoche ausgeblendet; wenn du mitspielen möchtest, kannst du den Fokusmodus in den Optionen ausschalten bzw. „Jetzt alles zeigen“ wählen. Öffne danach den Einladungslink und wähle deinen Arenanamen.

In der Arena sehen die Mitglieder deinen Arenanamen, gemeldete Erfüllungen und Reaktionen. Persönliche Ziele, Messwerte und private Reflexionstexte werden nicht geteilt. Handlungen werden selbst gemeldet; es gibt keinen echten Health-Sync.

Bitte melden: Gerät/Browser, letzter Schritt, erwartetes und tatsächliches Verhalten. Keine Passwörter, Bestätigungslinks oder privaten Reflexionstexte in Fehlermeldungen senden.

## Offen

- SMTP-Anbieter/Absender und Zustellung an echte externe Adressen.
- Produktionsmigration und Nachprüfung.
- Vollständiger Auth-Durchlauf mit Teilnehmern.
- Drei echte Konten / Geräte und anschließend laufende Saison.

Erst nach diesen Prüfungen als für Freunde einsatzbereit bezeichnen.

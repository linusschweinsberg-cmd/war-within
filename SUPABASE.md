# Supabase einrichten

1. Ein separates Supabase-Projekt verwenden oder ein ausdrücklich freigegebenes vorhandenes Projekt wählen.
2. In `supabase-config.js` die Projekt-URL und den öffentlichen Publishable-Key eintragen (alternativ Legacy anon-Key). Niemals einen Secret- oder service_role-Key verwenden.
3. Unter Authentication → Providers E-Mail/Passwort und die E-Mail-Bestätigung aktivieren. Passwort-Mindestlänge mindestens 8 Zeichen.
4. Unter Authentication → URL Configuration die öffentliche App-Adresse als Site URL eintragen. Die genaue App-URL und `http://localhost:5173/` als erlaubte Redirect URLs hinzufügen. Bei GitHub Pages den Projektpfad einschließlich abschließendem Slash verwenden.
5. Registrierung mit eigener E-Mail testen: Bestätigungsmail öffnen, anmelden, abmelden, Seite neu laden und Passwort zurücksetzen. Für zuverlässigen produktiven Mailversand eigenen SMTP-Dienst konfigurieren.

Die SDK-Sitzung wird von Supabase verwaltet. Alte Demo-Sitzungen gelten nicht als echte Anmeldung. Spielstände liegen weiterhin lokal, getrennt nach Supabase-Nutzer-ID; sie werden nicht zwischen Geräten synchronisiert. Es werden keine Tabellen oder RLS-Regeln für den Spielstand angelegt. Lokales Löschen entfernt kein Supabase-Konto.

Aktiviertes Projekt: `war-within / ozfmjmxzbymlicngecda`, separate Organisation `War within`, kostenlos, West EU (Ireland). Öffentlicher Publishable-Key ist eingetragen. Site URL: `http://localhost:5173/`. E-Mail-Provider, Neuregistrierung und E-Mail-Bestätigung sind aktiviert. Die öffentliche Hosting-Adresse muss vor Veröffentlichung ergänzt werden. Der vollständige Durchlauf mit Bestätigungsmail und einem App-Nutzerkonto steht noch aus.

Referenzen: https://supabase.com/docs/guides/auth/passwords und https://supabase.com/docs/reference/javascript/auth-onauthstatechange

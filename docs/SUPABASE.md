# Supabase: Auth-Absicherung und Schemaentwurf

Status: **Review-Entwurf, nicht eingespielt.** Keine Dashboard-Einstellungen geändert, keine Migration oder Nutzeraktion im echten Projekt ausgeführt. `index.html`, `life-core.js` und `sw.js` bleiben unverändert. Claude reviewt den PR; Codex mergt ihn nicht.

## Auth und Speichergrenze

`auth.js` überlässt Passwortprüfung, Redirect-Verarbeitung, Token-Persistenz und Erneuerung dem Supabase-SDK. Die App erhält ausschließlich `{id,email,name,mode}`. Weder vollständige Session-Objekte noch Passwörter, Access-/Refresh-Tokens oder Redirect-Codes werden an App-Listener oder Rückgabewerte weitergegeben. `war_within_auth_v1` und der kontoabhängige Spielstand speichern diese reduzierte Ansicht. SDK-eigene Sitzungsspeicherung bleibt separat und darf nicht mit dem Spielstand synchronisiert werden. Browser-Speicher ist keine verschlüsselte Datenbank; XSS könnte auch SDK-Sitzungen lesen. Öffentliches Publishable-/anon-Key-Material ist kein privates Servergeheimnis.

Behobene Fälle:
- `restore()` verwendet das aktuelle `getSession()`-Ergebnis; ein alter Listener-Stand kann keine abgemeldete Sitzung wiederherstellen. Ein während des Requests eintreffendes Auth-Ereignis hat Vorrang.
- Recovery wird nutzergebunden statt mit einem globalen Boolean gespeichert. Wechsel und Abmeldung räumen den Zustand auf. Gesperrter Session-Speicher verhindert die Anmeldung nicht; ein laufender Recovery-Vorgang bleibt im Arbeitsspeicher nutzbar.
- Erfolgreiches Abmelden leert die Adapteransicht auch ohne SDK-Callback. Fehlgeschlagene Abmeldung oder Passwortänderung werden nicht als Erfolg behandelt.
- Ein fehlerhafter UI-Listener unterbricht keine anderen Listener. Unbekannte Schlüssel sowie Secret-/service_role-Keys werden abgewiesen.

Die Tests verwenden ausschließlich einen gemockten Client. Sie prüfen auch den **unveränderten** App-Serializer mit Adapter-Daten und einen repräsentativen gespeicherten Spielstand. Das ist kein universeller Filter für beliebige Objekte: `saveAuth` in `index.html` serialisiert seine Eingabe weiterhin direkt. Der bestehende Aufrufpfad ist tokenfrei; zukünftiger Code darf keine rohen SDK-Sessions hineingeben. Eine zusätzliche zentrale Speicher-Allowlist und bereinigter Export vor dem Cloud-Sync wären Änderungen in Claudes UI-Datei und werden hier **nur vorgeschlagen**. Vorhandene beliebige manuell manipulierte Speicherinhalte werden nicht automatisch gelöscht.

## Tabellen und Beziehungen

Migration: `supabase/migrations/202611220001_initial_private_model.sql`, eine Transaktion, bewusst einmalig und ohne `IF NOT EXISTS` für Tabellen. Kollisionen sollen abbrechen, statt ein unbekanntes Schema stillschweigend zu übernehmen.

| Tabelle | Schlüssel / Beziehungen | Inhalt und Sichtbarkeit |
|---|---|---|
| `profiles` | `user_id` PK → `auth.users`, cascade | Anzeigename, optionales HTTPS-Avatar, private Preferences; vollständige Zeile nur für Eigentümer |
| `game_states` | `user_id` PK → `auth.users`, cascade | vollständiges `S` einschließlich `S.life` in `state` JSONB, `schema_version`, serverseitige `version`, `updated_at`; ausschließlich Eigentümer |
| `leagues` | UUID PK, `owner_id` → `auth.users`, cascade | Name, Eigentümer-ID, Erstellzeit; Eigentümer und Mitglieder sehen diese Gruppenmetadaten |
| `league_members` | (`league_id`,`user_id`) PK, FKs mit cascade | ausschließlich gruppenöffentliche Nutzer-ID, Anzeigename, Avatar, Beitrittszeit |
| `squads` | wie `leagues` | gleiche Regeln für Freundesgruppen |
| `squad_members` | wie `league_members` | gleiche ausdrücklich öffentliche Mitgliedsfelder |

Es gibt **keinen** Join von fremden Mitgliedern auf private `profiles`, Preferences oder Spielstände. Öffentliche Namen/Avatare sind bewusst separate, vom jeweiligen Nutzer gepflegte Gruppenkopien. Keine E-Mail, Gesundheitswerte, Finanzen, privaten Notizen, Ergebnisse oder Spielstände in Mitgliedstabellen aufnehmen. RLS filtert Zeilen, keine Spalten. Falls künftig private Mitgliedsfelder nötig sind, separate Tabelle oder eine geprüfte RPC statt Erweiterung dieser öffentlichen Zeilen verwenden. Nutzer-UUIDs sind innerhalb der Gruppe sichtbar; ob pseudonyme Gruppenkennungen gewünscht sind, ist offen.

## Rechte und Policies

Alle sechs Tabellen haben RLS. `anon` und `PUBLIC` erhalten keine Tabellenrechte; `authenticated` nur ausdrücklich benannte Rechte. Tabellenbesitzer und vertrauenswürdige Serverrollen können RLS umgehen und dürfen niemals als Browser-Schlüssel verwendet werden.

- Profil/Spielstand: SELECT, INSERT, UPDATE und DELETE ausschließlich bei `user_id=auth.uid()`. Primärschlüssel und Serverfelder haben keine Client-UPDATE-Rechte. Client-INSERT erlaubt weder Versions- noch Zeitstempelvorgaben.
- Gruppe: Erstellung nur mit eigener `owner_id`; Umbenennen und Löschen nur durch Eigentümer. `owner_id` ist nicht änderbar. Lesen für Eigentümer oder tatsächliche Mitglieder; Fremde sehen keine Gruppe.
- Mitgliedschaft: Lesen der eigenen Zeile oder des öffentlichen Rosters einer eigenen Gruppe. Nutzer ändern nur ihren Anzeigenamen/Avatar; keine Verschiebung von Nutzer- oder Gruppen-ID. Eigentümer dürfen die eigene Mitgliedschaft anlegen. Ein fremder Nutzer kann sich **nicht** selbst einschreiben. Mitglieder können austreten; Eigentümer müssen ihre Gruppe löschen, solange keine geprüfte Eigentumsübertragung existiert.
- Einladungen, Akzeptieren, Entfernen anderer Mitglieder und Eigentumsübertragung werden **nicht** implementiert. Zunächst verweigern die Policies diese Abläufe. Später nur über geprüfte transaktionale Server-/RPC-Flows mit Einladung, Frist und Autorisierung. Eine Service-Rolle darf nicht ungeprüft Client-Nutzer-IDs übernehmen.
- Private SECURITY-DEFINER-Helfer vermeiden rekursive Membership-Policies. Leerer `search_path`, qualifizierte Tabellen, keine dynamischen SQL-Strings, kein fremder `user_id`-Parameter. EXECUTE nur auf benötigten Helfern für `authenticated`. Schema `private` nicht in der Data API exponieren; SQL-Triggerfunktion ist nicht direkt ausführbar. Migration durch eine vertrauenswürdige Tabellenbesitzer-/postgres-Rolle ausführen; keine `FORCE ROW LEVEL SECURITY`-Änderung ohne erneute Prüfung dieser Helfer.

## Geplanter Sync (hier noch nicht implementiert)

1. Bestehenden lokalen Schlüssel pro Supabase-Nutzer weiterverwenden. Gastspielstände bleiben separat und werden nur nach ausdrücklicher Übernahme synchronisiert. Vor Upload validierte App-Daten exportieren; SDK-Session, Tokens und Auth-Speicherschlüssel niemals als Teil von `state` exportieren.
2. Lokal sofort speichern, dazu ausstehende Änderungen markieren. Cloud-Version der zuletzt bestätigten Basis separat merken. Bei erstem Cloud-INSERT setzt der Server `version=1` und `updated_at`; bei Konflikt durch paralleles INSERT erst erneut lesen.
3. Updates mit Compare-and-Swap: `UPDATE game_states SET state=:state,schema_version=:schema_version WHERE user_id=auth.uid() AND version=:base_version RETURNING version,updated_at`. Im Supabase-Client `.update(...).eq('user_id',id).eq('version',baseVersion).select(...)`. Der Trigger erhöht jede erfolgreiche Revision um eins und setzt den Zeitstempel. Keine blind überschreibenden Upserts.
4. Keine zurückgegebene Zeile bedeutet Konflikt/fehlenden Datensatz, nicht Erfolg. Neueste Cloud-Fassung lesen. Wenn lokal nichts geändert wurde, Cloud-Fassung übernehmen; andernfalls beide Fassungen erhalten und den Nutzer wählen lassen. Kein automatisches feldweises Merge von `S.life`, Logs oder Zählern.
5. **Version hat Vorrang**, `updated_at` ist serverseitiger sekundärer Zeit-/Anzeigehinweis. Lokale Gerätezeiten entscheiden keinen Gewinner. Bei höherer Cloud-Version veraltete lokale Daten niemals still überschreiben. Bei Schema-Version, die der Client nicht versteht, Upload sperren und lokalen Stand erhalten.
6. Bei erfolgreichem CAS lokale Basis aktualisieren. Offline, Netzwerkfehler oder verweigerte Rechte lassen den lokalen Stand und die Warteschlange erhalten. Abmeldung darf niemals den Stand des vorigen Kontos in die nächste Sitzung übernehmen. Lösch-Sync/Tombstones sind vor Aktivierung noch festzulegen.

## Prüfung und Grenzen

Pflichtprüfungen (ohne Netzwerk):
```
node tests/auth-contract.cjs
node tests/release-smoke.cjs
node tests/life-core.cjs
```
Zusätzlich: `node tests/schema-rls.cjs <Pfad-zu-@electric-sql/pglite>` gegen eine frische lokale PostgreSQL-WASM-Instanz. Prüft tatsächliche SQL-Ausführung, RLS, Grants, Gruppenisolation, Austritt, unerlaubte Self-Joins, Versionsfelder, CAS-Konflikte und Lösch-Cascades. Testlaufzeit separat installieren, z. B. `npm install --prefix <temporärer-Ordner> @electric-sql/pglite`; keine neue App-Abhängigkeit. Das ersetzt vor Freigabe keinen Test in einer **separaten** Supabase-Testumgebung mit echten SDK/JWT-Rollen. Der lokale Test legt ausschließlich simulierte Auth-Rollen und Nutzer an.

### Manueller Postfach-Test durch den Nutzer

- [ ] Mit eigener Testadresse registrieren; keine App-Sitzung vor E-Mail-Bestätigung. Bestätigungslink auf genau die freigegebene App-URL zurückführen und anmelden.
- [ ] Falsches Passwort: verständlicher Fehler, kein Zugriff. Erfolgreich anmelden, Seite neu laden; Konto und Spielstand bleiben passend zur Nutzer-ID.
- [ ] Passwort-Reset anfordern. Mail erhalten, Link öffnen: Formular für neues Passwort. Passwort selbst setzen; mit neuem Passwort anmelden, altes ablehnen.
- [ ] Reset-Link erneut/abgelaufen öffnen; Fehler statt scheinbarem Erfolg. Reset-Formular neu laden; danach abmelden und anderes Konto öffnen: kein übertragener Recovery-Modus.
- [ ] Abmelden, Seite neu laden; keine wiederbelebte App-Sitzung. Speicher prüfen: `war_within_auth_v1`/Spielstand enthalten keine Passwort-/Access-/Refresh-Token-Felder. SDK-eigene `sb-...`-Sitzung getrennt beurteilen, Tokens niemals kopieren oder im PR teilen.
- [ ] Lokale und öffentliche Rücksprungadresse getrennt testen; gesperrten Browser-Speicher und unerreichbaren Anmeldedienst prüfen.

## Offene Entscheidungen für Claude / Nutzer

1. Öffentliche Mitgliedsfelder und gruppenweite UUID-Sichtbarkeit freigeben? Namens-/Avataränderungen nur gruppenweise oder gemeinsam aktualisieren?
2. Einladungen: Codes oder gezielte Einladungen, Ablauf, Widerruf, Kapazität, Besitzerwechsel und Moderation?
3. Wer darf welche Liga-Ergebnisse veröffentlichen, und wie werden sie serverseitig berechnet? Niemals gesamte Spielstände für Rankings freigeben.
4. Aufbewahrung und Löschung: Accountlöschung löscht derzeit auch besessene Gruppen; soll stattdessen vorher übertragen werden? Wie werden lokale Warteschlangen nach Löschung behandelt?
5. JSONB-Größenlimit, Backup, Sync-Häufigkeit, Versionsüberlauf und Konflikt-UI vor Cloud-Sync festlegen.
6. SDK-Sitzung ist lokal von Supabase verwaltet. Gewünschte Sitzungsdauer/Mehrgeräte-Strategie und zusätzlicher XSS-Schutz sind gesonderte Produkt-/Hostingentscheidungen; hier keine Einstellungen ändern.
7. Integration in `index.html` (Export-Allowlist, Sync-Adapter, UI für Reset-Fehler und Konflikte) separat mit Claude koordinieren. Keine dieser gesperrten Dateien wurde geändert; bei Auslieferung von geändertem `auth.js` muss Claude die Cache-Version in `sw.js` erhöhen.

Quellen: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [sichere Datenbankfunktionen](https://supabase.com/docs/guides/database/functions), [Auth-Ereignisse](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

# Integration von Claude

Stand: claude/loop-safety (622537f), einschließlich Wisdom, Abendritual, FTUE, UX-Feinschliff, Rückgängig und lokaler Datensicherung.

Review-Korrekturen: eigene Skripte verwenden die Release-Version in der URL und im Precache; dadurch trifft auch der alte cache-first-Worker beim Update keinen veralteten Cache-Eintrag. Bei künftigen Releases die vier URL-Versionen, APP_SHELL und VERSION gemeinsam erhöhen. Offline werden dieselben URLs aus dem Precache geladen.

Kontoentwürfe erhalten eine Nutzer-ID als Zuordnung; die Sitzung wird weiterhin ausschließlich vom SDK wiederhergestellt. Ein fremdes Konto bekommt den Entwurf nicht. Das Entfernen des Fundaments löscht auch die private Vision im Warum. Ziele und Log bleiben bestehen. Alle Abendritual-Kandidaten sind erreichbar. Neue Illustrationen verwenden Theme- und Farbrollen-Tokens.

Prüfungen: life-core, release-smoke, auth-contract, wisdom-core, ftue-flows, auth-resume und service-worker. Die letzten beiden testen den tatsächlichen Root-Lebenszyklus mit SDK-Mock sowie den Release-Worker mit vollständig ausgefallenem Origin. E-Mail-Bestätigung und Reset im echten Postfach bleiben manuell zu prüfen. Keine Supabase-Migration oder Projekteinstellung geändert.

Browser: Upgrade vom gecachten Abendritual-Release auf die Integration beim ersten Reload ohne Fehler; Gast in 375 px, beide Skins und Themes, Desktop, Abhaken und Rückgängig sowie Reload bei gestopptem Origin-Server geprüft. CDN-Netzwerkzugang war beim Browser-Offlinetest weiterhin möglich; der Worker-Test mockt den vollständigen Netzausfall.

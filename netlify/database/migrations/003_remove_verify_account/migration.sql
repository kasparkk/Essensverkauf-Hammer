-- Entfernt das Konto, mit dem nach dem Aufräumen geprüft wurde, dass die
-- Registrierung weiterhin funktioniert.
DELETE FROM "User" WHERE "email" = 'verify-cleanup@example.com';

-- Entfernt die Konten, mit denen der erste Deploy getestet wurde.
-- Reisen, Anfragen, Konversationen und Nachrichten hängen per
-- ON DELETE CASCADE daran und verschwinden mit.
DELETE FROM "User" WHERE "email" IN ('anna@example.com', 'ben@example.com');

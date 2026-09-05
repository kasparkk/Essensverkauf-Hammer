-- Entfernt die Konten, mit denen der CarryConnect-Umbau live geprüft wurde.
-- Anfragen, Reisen, Abmachungen, Chats und Nachrichten hängen per
-- ON DELETE CASCADE daran und verschwinden mit.
DELETE FROM "User" WHERE "email" IN (
  'live-a@carryconnect.test',
  'live-b@carryconnect.test'
);

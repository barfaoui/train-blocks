-- Dev login: username "testuser", password "DevPass123!"
INSERT INTO "auth"."users" (id, username, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser',
  '$2b$12$SwJXLm3yITO3RiO8pCCZVuInpFKK8eihEiS.yHxRQUKitu06frtV2'
)
ON CONFLICT (username) DO NOTHING;

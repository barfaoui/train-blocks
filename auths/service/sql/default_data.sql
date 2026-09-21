-- Dev login: username "testuser", password "DevPass123!"
INSERT INTO "auth"."users" (id, username, password_hash, display_name, avatar_icon, avatar_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser',
  '$2b$12$SwJXLm3yITO3RiO8pCCZVuInpFKK8eihEiS.yHxRQUKitu06frtV2',
  'Test User',
  '🏃',
  '#7C3AED'
)
ON CONFLICT (username) DO NOTHING;

-- Non-default values so the profile page visibly exercises every preference.
INSERT INTO "auth"."user_preferences" (
  user_id, week_start, time_format, default_view, locale, timezone,
  show_week_numbers, work_day_start, work_day_end, units, favorite_sports,
  default_sport_type, default_event_duration_min, default_reminders, theme,
  notify_by_email, searchable
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SUNDAY', 'H12', 'MONTH', 'en', 'Europe/Paris',
  true, 6, 22, 'IMPERIAL', ARRAY['OUTSIDE_RUNNING', 'SWIMMING', 'STRENGTH'],
  'OUTSIDE_RUNNING', 45, ARRAY[15, 60], 'DARK',
  false, true
)
ON CONFLICT (user_id) DO NOTHING;

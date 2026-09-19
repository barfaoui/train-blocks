-- Dev seed data for the planner service.
-- Applied by `make reset-db` / `make reset` (not on plain `make run`).
-- Prefer idempotent inserts (e.g. ON CONFLICT DO NOTHING) so re-runs are safe.
--
-- References the auths service's fixed dev user id directly (see
-- auths/service/sql/default_data.sql, username "testuser") rather than
-- looking it up — both services seed the same fixed id, so this doesn't
-- depend on which one runs first.

INSERT INTO "planner"."plan_prototypes" (id, sport_type, fields)
VALUES
  ('00000000-0000-0000-0000-000000000401', 'OUTSIDE_RUNNING',
    '[{"key": "distanceKm", "label": "Distance (km)", "type": "number", "required": true}, {"key": "targetPaceMinPerKm", "label": "Target pace (min/km)", "type": "number", "required": false}]'::jsonb),
  ('00000000-0000-0000-0000-000000000402', 'STRENGTH',
    '[{"key": "exercises", "label": "Exercises", "type": "list", "required": true}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "planner"."plans" (id, name, sport_type, notes, details, created_by_id)
VALUES
  ('00000000-0000-0000-0000-000000000201', '5k Easy Run', 'OUTSIDE_RUNNING', 'Seed: 5k easy run',
    '{"distanceKm": 5, "targetPaceMinPerKm": 5.5}'::jsonb, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000202', 'Full-Body Strength', 'STRENGTH', 'Seed: full-body strength',
    '{"exercises": [{"name": "Back squat", "sets": 4, "reps": 8, "weightKg": 60}, {"name": "Bench press", "sets": 4, "reps": 8, "weightKg": 40}]}'::jsonb,
    '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Tuesday Evening Swim (000105) is a recurring series: it's its own series
-- root (id = series_id) and carries the recurrence rule; 000106/000107 are
-- later occurrences sharing that series_id.
INSERT INTO "planner"."events"
  (id, title, start_date, end_date, start_time, end_time, timezone, description, location, sport_type, created_by_id, recurrence_rule, series_id, plan_id)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Morning Run', CURRENT_DATE, CURRENT_DATE, '07:00', '08:00', 'Europe/Paris',
    'Easy 5k loop around the park before work.', 'Riverside Park', 'OUTSIDE_RUNNING', '00000000-0000-0000-0000-000000000001',
    NULL, NULL, '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000102', 'Rest & Stretch Day', CURRENT_DATE + 1, CURRENT_DATE + 1, NULL, NULL, 'Europe/Paris',
    'Whole-day recovery: light stretching, no fixed time.', NULL, 'YOGA', '00000000-0000-0000-0000-000000000001',
    NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000103', 'Sunday Long Ride', CURRENT_DATE + 3, CURRENT_DATE + 3, '09:00', '11:30', 'Europe/Paris',
    'Weekend endurance ride, moderate pace.', 'Forest Loop Trail', 'STATIC_CYCLING', '00000000-0000-0000-0000-000000000001',
    NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000104', 'Strength Training Weekend', CURRENT_DATE + 5, CURRENT_DATE + 7, NULL, NULL, 'Europe/Paris',
    'Three-day multi-day strength camp, whole-day block on the calendar.', 'Lakeside Sports Center', 'STRENGTH', '00000000-0000-0000-0000-000000000001',
    NULL, NULL, '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000000105', 'Tuesday Evening Swim', CURRENT_DATE + 2, CURRENT_DATE + 2, '18:30', '19:30', 'Europe/Paris',
    'Weekly technique swim session.', 'Community Pool', 'SWIMMING', '00000000-0000-0000-0000-000000000001',
    'FREQ=WEEKLY;BYDAY=TU;COUNT=6', '00000000-0000-0000-0000-000000000105', NULL),
  ('00000000-0000-0000-0000-000000000106', 'Tuesday Evening Swim', CURRENT_DATE + 9, CURRENT_DATE + 9, '18:30', '19:30', 'Europe/Paris',
    'Weekly technique swim session.', 'Community Pool', 'SWIMMING', '00000000-0000-0000-0000-000000000001',
    NULL, '00000000-0000-0000-0000-000000000105', NULL),
  ('00000000-0000-0000-0000-000000000107', 'Tuesday Evening Swim', CURRENT_DATE + 16, CURRENT_DATE + 16, '18:30', '19:30', 'Europe/Paris',
    'Weekly technique swim session.', 'Community Pool', 'SWIMMING', '00000000-0000-0000-0000-000000000001',
    NULL, '00000000-0000-0000-0000-000000000105', NULL)
ON CONFLICT (id) DO NOTHING;

-- The dev user is a CONFIRMED participant on everything, except the last
-- swim occurrence (SKIPPED), to exercise more than one status value.
INSERT INTO "planner"."event_participants" (event_id, user_id, status)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'CONFIRMED'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'CONFIRMED'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'CONFIRMED'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'CONFIRMED'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'CONFIRMED'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', 'CONFIRMED'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', 'SKIPPED')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Two reminders on the swim series root, to show a participant can have more than one.
INSERT INTO "planner"."event_reminders" (id, event_id, user_id, minutes_before)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 60),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 1440)
ON CONFLICT (id) DO NOTHING;

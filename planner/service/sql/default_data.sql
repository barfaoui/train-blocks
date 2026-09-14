-- Dev seed data for the planner service.
-- Applied by `make reset-db` / `make reset` (not on plain `make run`).
-- Prefer idempotent inserts (e.g. ON CONFLICT DO NOTHING) so re-runs are safe.
--
-- Depends on the auths service's dev user ("testuser", see
-- auths/service/sql/default_data.sql) already existing in auth.users. If it
-- doesn't (e.g. planner was reset on its own), the inserts below are no-ops.

WITH dev_user AS (
  SELECT id FROM "auth"."users" WHERE username = 'testuser'
), new_events AS (
  INSERT INTO "planner"."events"
    (id, title, start_date, end_date, start_time, end_time, timezone, description, location, sport_type, created_by_id)
  SELECT
    gen_random_uuid(),
    e.title,
    e.start_date,
    e.end_date,
    e.start_time,
    e.end_time,
    e.timezone,
    e.description,
    e.location,
    e.sport_type::"planner"."SportType",
    dev_user.id
  FROM dev_user, (VALUES
    ('Morning Run', CURRENT_DATE, CURRENT_DATE, '07:00'::time, '08:00'::time, 'Europe/Paris',
      'Easy 5k loop around the park before work.', 'Riverside Park', 'RUNNING'),
    ('Rest & Stretch Day', CURRENT_DATE + 1, CURRENT_DATE + 1, NULL::time, NULL::time, 'Europe/Paris',
      'Whole-day recovery: light stretching, no fixed time.', NULL, 'YOGA'),
    ('Sunday Long Ride', CURRENT_DATE + 3, CURRENT_DATE + 3, '09:00'::time, '11:30'::time, 'Europe/Paris',
      'Weekend endurance ride, moderate pace.', 'Forest Loop Trail', 'CYCLING'),
    ('Strength Training Weekend', CURRENT_DATE + 5, CURRENT_DATE + 7, NULL::time, NULL::time, 'Europe/Paris',
      'Three-day multi-day strength camp, whole-day block on the calendar.', 'Lakeside Sports Center', 'STRENGTH')
  ) AS e(title, start_date, end_date, start_time, end_time, timezone, description, location, sport_type)
  WHERE NOT EXISTS (
    SELECT 1 FROM "planner"."events" ev WHERE ev.title = e.title
  )
  RETURNING id, created_by_id
)
INSERT INTO "planner"."event_participants" (event_id, user_id)
SELECT id, created_by_id FROM new_events
ON CONFLICT DO NOTHING;

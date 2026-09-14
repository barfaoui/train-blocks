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
INSERT INTO "planner"."event_participants" (event_id, user_id, status)
SELECT id, created_by_id, 'CONFIRMED' FROM new_events
ON CONFLICT DO NOTHING;

-- Recurring series (root + 2 later occurrences sharing one series_id) and
-- two training plans, linked back onto events from the block above.
DO $$
DECLARE
  dev_user_id      UUID;
  series_root_id   UUID;
  occurrence_2_id  UUID;
  occurrence_3_id  UUID;
  running_plan_id  UUID;
  strength_plan_id UUID;
  morning_run_id   UUID;
  strength_event_id UUID;
BEGIN
  SELECT id INTO dev_user_id FROM "auth"."users" WHERE username = 'testuser';
  IF dev_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "planner"."events" WHERE title = 'Tuesday Evening Swim') THEN
    series_root_id := gen_random_uuid();
    occurrence_2_id := gen_random_uuid();
    occurrence_3_id := gen_random_uuid();

    INSERT INTO "planner"."events"
      (id, title, start_date, end_date, start_time, end_time, timezone, description, location, sport_type, created_by_id, recurrence_rule, series_id)
    VALUES
      (series_root_id, 'Tuesday Evening Swim', CURRENT_DATE + 2, CURRENT_DATE + 2, '18:30'::time, '19:30'::time, 'Europe/Paris',
        'Weekly technique swim session.', 'Community Pool', 'SWIMMING', dev_user_id, 'FREQ=WEEKLY;BYDAY=TU;COUNT=6', series_root_id),
      (occurrence_2_id, 'Tuesday Evening Swim', CURRENT_DATE + 9, CURRENT_DATE + 9, '18:30'::time, '19:30'::time, 'Europe/Paris',
        'Weekly technique swim session.', 'Community Pool', 'SWIMMING', dev_user_id, NULL, series_root_id),
      (occurrence_3_id, 'Tuesday Evening Swim', CURRENT_DATE + 16, CURRENT_DATE + 16, '18:30'::time, '19:30'::time, 'Europe/Paris',
        'Weekly technique swim session.', 'Community Pool', 'SWIMMING', dev_user_id, NULL, series_root_id);

    -- Different statuses per occurrence to exercise the enum: confirmed for
    -- the next two, skipped for the third (still on the plan, sitting this one out).
    INSERT INTO "planner"."event_participants" (event_id, user_id, status)
    VALUES
      (series_root_id, dev_user_id, 'CONFIRMED'),
      (occurrence_2_id, dev_user_id, 'CONFIRMED'),
      (occurrence_3_id, dev_user_id, 'SKIPPED');

    -- Reminders on the root occurrence only, to show a participant can have more than one.
    INSERT INTO "planner"."event_reminders" (id, event_id, user_id, minutes_before)
    VALUES
      (gen_random_uuid(), series_root_id, dev_user_id, 60),
      (gen_random_uuid(), series_root_id, dev_user_id, 1440);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "planner"."training_plans" WHERE notes = 'Seed: 5k easy run') THEN
    running_plan_id := gen_random_uuid();
    INSERT INTO "planner"."training_plans" (id, sport_type, notes, details, created_by_id)
    VALUES (running_plan_id, 'RUNNING', 'Seed: 5k easy run',
      '{"distanceKm": 5, "targetPaceMinPerKm": 5.5}'::jsonb, dev_user_id);

    SELECT id INTO morning_run_id FROM "planner"."events" WHERE title = 'Morning Run';
    IF morning_run_id IS NOT NULL THEN
      UPDATE "planner"."events" SET training_plan_id = running_plan_id WHERE id = morning_run_id;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "planner"."training_plans" WHERE notes = 'Seed: full-body strength') THEN
    strength_plan_id := gen_random_uuid();
    INSERT INTO "planner"."training_plans" (id, sport_type, notes, details, created_by_id)
    VALUES (strength_plan_id, 'STRENGTH', 'Seed: full-body strength',
      '{"exercises": [{"name": "Back squat", "sets": 4, "reps": 8, "weightKg": 60}, {"name": "Bench press", "sets": 4, "reps": 8, "weightKg": 40}]}'::jsonb,
      dev_user_id);

    SELECT id INTO strength_event_id FROM "planner"."events" WHERE title = 'Strength Training Weekend';
    IF strength_event_id IS NOT NULL THEN
      UPDATE "planner"."events" SET training_plan_id = strength_plan_id WHERE id = strength_event_id;
    END IF;
  END IF;
END $$;

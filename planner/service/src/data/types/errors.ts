export class InvalidRecurrenceRuleError extends Error {
  constructor() {
    super("That repeat pattern isn't valid.");
    this.name = 'InvalidRecurrenceRuleError';
  }
}

export class PlanNotFoundError extends Error {
  constructor() {
    super("We couldn't find that plan.");
    this.name = 'PlanNotFoundError';
  }
}

export class EventNotFoundError extends Error {
  constructor() {
    super('This event no longer exists.');
    this.name = 'EventNotFoundError';
  }
}

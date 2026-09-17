export class InvalidRecurrenceRuleError extends Error {
  constructor() {
    super('recurrenceRule is not a valid RFC5545 recurrence rule');
    this.name = 'InvalidRecurrenceRuleError';
  }
}

export class PlanNotFoundError extends Error {
  constructor() {
    super('planId does not reference an existing plan');
    this.name = 'PlanNotFoundError';
  }
}

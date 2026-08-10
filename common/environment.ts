/** Generated based on common/environment.json — do not edit. */

export const environment = {
  ports: {
    auths: 3001,
    planner: 3002,
  },
} as const;

export type AppId = keyof typeof environment.ports;

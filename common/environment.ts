/** Generated based on common/environment.json - do not edit. */

export const environment = {
  ports: {
    'auths-service': 3001,
    'auths-front': 3002,
    'planner-service': 3003,
    'planner-front': 3004,
  },
} as const;

export type AppId = keyof typeof environment.ports;

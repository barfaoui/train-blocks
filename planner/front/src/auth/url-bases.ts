import { appBaseHref, authsLoginHref, resolveSameOrigin } from '@common/app-urls';

export const sameOrigin = resolveSameOrigin(import.meta.env.VITE_SAME_ORIGIN, import.meta.env.PROD);

export const authsFrontBase = appBaseHref('auths-front', sameOrigin);
export const loginHref = authsLoginHref(authsFrontBase);
export const authsServiceBase = appBaseHref('auths-service', sameOrigin);
export const plannerServiceBase = appBaseHref('planner-service', sameOrigin);

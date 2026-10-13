import { appBaseHref, resolveSameOrigin } from '@common/app-urls';

export const sameOrigin = resolveSameOrigin(import.meta.env.VITE_SAME_ORIGIN, import.meta.env.PROD);

export const authsServiceBase = appBaseHref('auths-service', sameOrigin);
export const plannerFrontBase = appBaseHref('planner-front', sameOrigin);
export const plannerHomeHref = plannerFrontBase || '/';

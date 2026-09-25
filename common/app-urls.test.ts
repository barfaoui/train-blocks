import { describe, expect, it } from 'vitest';

import { appBaseHref, authsLoginHref, isAllowedAppRedirect } from './app-urls';

describe('appBaseHref', () => {
  it('uses each app’s localhost port when not same-origin, with the auths front under /auth', () => {
    expect(appBaseHref('auths-front', false)).toBe('http://localhost:3002/auth');
    expect(appBaseHref('planner-front', false)).toBe('http://localhost:3004');
  });

  it('puts the auths front under /auth and everything else at the root when same-origin', () => {
    expect(appBaseHref('auths-front', true)).toBe('/auth');
    expect(appBaseHref('planner-front', true)).toBe('');
    expect(appBaseHref('auths-service', true)).toBe('');
    expect(appBaseHref('planner-service', true)).toBe('');
  });
});

describe('authsLoginHref', () => {
  it('points at the auths front root', () => {
    expect(authsLoginHref(appBaseHref('auths-front', true))).toBe('/auth/');
    expect(authsLoginHref(appBaseHref('auths-front', false))).toBe('http://localhost:3002/auth/');
  });
});

describe('isAllowedAppRedirect', () => {
  it('allows relative planner paths, including the planner home', () => {
    expect(isAllowedAppRedirect('/')).toBe(true);
    expect(isAllowedAppRedirect('/profile?tab=account')).toBe(true);
  });

  it('rejects relative paths into the sign-in app', () => {
    expect(isAllowedAppRedirect('/auth')).toBe(false);
    expect(isAllowedAppRedirect('/auth/')).toBe(false);
    expect(isAllowedAppRedirect('/auth/forgot-password')).toBe(false);
  });

  it('does not mistake a path that merely starts with "auth" for the sign-in app', () => {
    expect(isAllowedAppRedirect('/authors')).toBe(true);
  });

  it('allows the local planner front but not the local sign-in app', () => {
    expect(isAllowedAppRedirect('http://localhost:3004/profile')).toBe(true);
    expect(isAllowedAppRedirect('http://localhost:3002/auth/')).toBe(false);
    expect(isAllowedAppRedirect('http://localhost:3002/auth/reset-password')).toBe(false);
  });

  it('rejects other origins and protocol-relative URLs', () => {
    expect(isAllowedAppRedirect('https://evil.example/')).toBe(false);
    expect(isAllowedAppRedirect('//evil.example/')).toBe(false);
    expect(isAllowedAppRedirect('/\\evil.example/')).toBe(false);
  });
});

import { confirmPassword, signInBody, signUpBody } from '@common/auth-validation';

export { confirmPassword, signInBody };

export function signUpForm(values: { password: string }) {
  return signUpBody.extend({
    confirmPassword: confirmPassword(values.password),
  });
}

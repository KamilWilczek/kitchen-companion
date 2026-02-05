import { useApi } from './useApi';

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type AccountInfo = {
  id: string;
  email: string;
  plan: string;
};

export function useAccountApi() {
  const api = useApi();
  return {
    getMe: () => api<AccountInfo>('/account/me'),

    changePassword: (currentPassword: string, newPassword: string) =>
      api<void>('/account/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      }),

    updatePlan: (plan: 'free' | 'premium') =>
      api<TokenResponse>('/account/plan', {
        method: 'PUT',
        body: JSON.stringify({ plan }),
      }),
  };
}

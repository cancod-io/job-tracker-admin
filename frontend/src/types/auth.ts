export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

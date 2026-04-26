interface GoogleAccountsOAuth2TokenClient {
  requestAccessToken(config: { prompt: string }): void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: { error?: string; access_token: string }) => void;
  }): GoogleAccountsOAuth2TokenClient;
}

interface GoogleAccounts {
  oauth2: GoogleAccountsOAuth2;
}

interface Google {
  accounts: GoogleAccounts;
}

declare var google: Google;
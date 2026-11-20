import firebaseConfig from '../../firebase-applet-config.json';
import { Contact } from '../types';

export const GOOGLE_CONTACTS_SCOPES = [
  'https://www.googleapis.com/auth/contacts',
];

// Keep OAuth access token strictly in memory (never in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let cachedAccountEmail: string | null = null;

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }) => {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
  };
  revoke: (token: string, done?: () => void) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2;
      };
    };
  }
}

async function waitForGsi(timeoutMs = 5000): Promise<GoogleAccountsOAuth2> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google?.accounts?.oauth2) {
      return window.google.accounts.oauth2;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error('Google sign-in library did not load. Please check your connection and try again.');
}

export function getCachedGoogleToken(): string | null {
  return cachedAccessToken;
}

export function getCachedGoogleEmail(): string | null {
  return cachedAccountEmail;
}

export async function connectGoogleContacts(): Promise<{
  accessToken: string;
  email: string;
}> {
  const oauth2 = await waitForGsi();
  const clientId = firebaseConfig.oAuthClientId;

  if (!clientId) {
    throw new Error('Google Contacts client ID is not configured.');
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CONTACTS_SCOPES.join(' '),
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.access_token) {
          reject(new Error('No access token returned by Google.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err.message || 'Google sign-in popup was closed or blocked.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });

  cachedAccessToken = accessToken;

  // Fetch authenticated user's email from People API
  let email = 'Google Account';
  try {
    const profileRes = await fetch(
      'https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (profileRes.ok) {
      const profile = await profileRes.json();
      email =
        profile.emailAddresses?.[0]?.value ||
        profile.names?.[0]?.displayName ||
        'Google Account';
    }
  } catch {
    // Non-fatal; proceed with token
  }

  cachedAccountEmail = email;
  return { accessToken, email };
}

export async function fetchGoogleContacts(accessToken: string): Promise<Contact[]> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,organizations,biographies&pageSize=200',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Failed to load Google Contacts (${res.status}).`
    );
  }

  const data = await res.json();
  const connections: Array<{
    resourceName?: string;
    names?: Array<{ displayName?: string }>;
    phoneNumbers?: Array<{ value?: string }>;
    emailAddresses?: Array<{ value?: string }>;
    organizations?: Array<{ name?: string }>;
    biographies?: Array<{ value?: string }>;
  }> = data.connections || [];

  const mapped: Contact[] = [];
  for (const person of connections) {
    const name = person.names?.[0]?.displayName?.trim();
    const phone = person.phoneNumbers?.[0]?.value?.trim();
    const email = person.emailAddresses?.[0]?.value?.trim();

    if (!name && !phone && !email) continue;

    mapped.push({
      id: `google-${(person.resourceName || Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      name: name || phone || email || 'Unnamed Contact',
      phone: phone || '',
      email: email || '',
      company: person.organizations?.[0]?.name || '',
      notes: person.biographies?.[0]?.value || '',
      source: 'google',
      googleResourceName: person.resourceName,
      createdAt: new Date().toISOString(),
    });
  }

  return mapped;
}

export async function createGoogleContact(
  accessToken: string,
  contact: { name: string; phone: string; email?: string; company?: string; notes?: string }
): Promise<{ resourceName?: string }> {
  const nameParts = contact.name.trim().split(/\s+/);
  const givenName = nameParts[0] || contact.name;
  const familyName = nameParts.slice(1).join(' ');

  const payload: Record<string, unknown> = {
    names: [{ givenName, familyName }],
    phoneNumbers: contact.phone ? [{ value: contact.phone, type: 'mobile' }] : [],
  };

  if (contact.email) {
    payload.emailAddresses = [{ value: contact.email, type: 'work' }];
  }
  if (contact.company) {
    payload.organizations = [{ name: contact.company }];
  }
  if (contact.notes) {
    payload.biographies = [{ value: contact.notes, contentType: 'TEXT_PLAIN' }];
  }

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Unable to save contact to Google (${res.status}).`
    );
  }

  return res.json();
}

export function disconnectGoogleContacts(): void {
  const token = cachedAccessToken;
  cachedAccessToken = null;
  cachedAccountEmail = null;
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch {
      // ignore
    }
  }
}

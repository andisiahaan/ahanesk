'use client';

import { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleAuthProviderProps {
  children: ReactNode;
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
export const isGoogleAuthClientConfigured = Boolean(
  clientId &&
  !clientId.includes('dummy') &&
  !clientId.includes('your-google-client-id') &&
  !clientId.includes('isi_dengan')
);

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  if (!isGoogleAuthClientConfigured || !clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}

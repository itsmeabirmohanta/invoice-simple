import { createAuthClient } from 'better-auth/client';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

// Initialize Neon Auth client using Better Auth SDK
// This connects to the Neon Auth endpoint provisioned for your project
export const authClient = createAuthClient({
  baseURL: authUrl,
  // Neon Auth mounts Better Auth routes directly at the base URL
  // (e.g. /neondb/auth/get-session), NOT under /api/auth/.
  // Setting basePath to "/" prevents the SDK from prepending /api/auth/.
  basePath: '/',
  fetchOptions: {
    credentials: 'include',
  },
});

// Export auth methods for signup, signin, signout
export const { 
  signUp, 
  signIn, 
  signOut, 
  useSession 
} = authClient;

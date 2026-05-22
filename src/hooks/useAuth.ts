import { useUser, useClerk } from "@clerk/astro/react";

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const signOut = async () => {
    try {
      await clerkSignOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    loading: !isLoaded,
    isAuthenticated: !!user,
    signOut,
  };
}

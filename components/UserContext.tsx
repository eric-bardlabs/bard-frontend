import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type PropsWithChildren } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchUser, UserResponse } from "@/lib/api/user";

type UserContextType = {
  user?: UserResponse;
  isLoading: boolean;
  refetch: () => void;
};
const UserContext = createContext<UserContextType>({
  user: undefined,
  isLoading: true,
  refetch: () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }: PropsWithChildren) => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  
  const { data, isLoading, refetch, error } = useQuery<UserResponse | null>({
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        return null;
      }
      return await fetchUser({ token });
    },
    queryKey: ["user"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isLoaded && isSignedIn, // Only fetch when Clerk is ready and user is signed in
    retry: 2,
    retryDelay: 1000,
  });

  const handleRefetch = () => {
    refetch();
  };

  // Don't show loading if we have an error and no data
  const shouldShowLoading = isLoading && !error;

  return (
    <UserContext.Provider value={{ 
      user: data || undefined, 
      isLoading: shouldShowLoading, 
      refetch: handleRefetch 
    }}>
      {children}
    </UserContext.Provider>
  );
};

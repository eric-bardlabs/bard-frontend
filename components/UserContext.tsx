import { type User } from "@/db/schema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { createContext, useContext, type PropsWithChildren } from "react";

type UserContextType = {
  user?: User;
  isLoading: boolean;
};
const UserContext = createContext<UserContextType>({
  user: undefined,
  isLoading: true,
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }: PropsWithChildren) => {
  // You can use React Query here to fetch user data
  // For simplicity, let's assume you have a function called fetchUser

  const { data, isLoading } = useQuery<{
    user: User;
  }>({
    queryFn: () => axios.get("/api/user").then((result) => result.data),
    queryKey: ["user"],
    staleTime: Infinity,
  });

  // useEffect(() => {
  //   posthog.identify(data?.user?.id, {
  //     email: data?.user?.emailAddress,
  //     organizationId: data?.user?.organizationId,
  //   });
  // }, [data?.user]);

  return (
    <UserContext.Provider value={{ user: data as any, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

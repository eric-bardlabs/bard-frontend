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
  const { data, isLoading } = useQuery<{
    user: User;
  }>({
    queryFn: () => axios.get("/api/user").then((result) => result.data),
    queryKey: ["user"],
    staleTime: Infinity,
  });

  return (
    <UserContext.Provider value={{ user: data as any, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

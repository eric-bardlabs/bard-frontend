"use client";

import { UserProfile } from "@clerk/nextjs";
import { Checkbox, Divider } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UserRound } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  return (
    <div className="flex flex-row w-full justify-center h-full pt-[72px] md:pt-0">
      <UserProfile
        appearance={{
          variables: {
            colorPrimary: "#161616",
            colorText: "#161616",
          },
        }}
      />
    </div>
  );
};

export default ProfilePage;

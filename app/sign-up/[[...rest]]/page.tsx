import { SignUp } from "@clerk/nextjs";

export default function Sign() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#161616",
            colorText: "#161616",
          },
        }}
        signInUrl="/"
        forceRedirectUrl={`/profile`}
      />
    </div>
  );
}

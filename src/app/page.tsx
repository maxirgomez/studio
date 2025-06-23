import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
           <Image
            src="https://placehold.co/251x98.png"
            alt="Baigun Realty Logo"
            width={251}
            height={98}
            className="h-20 w-auto"
            data-ai-hint="logo"
          />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

import { LoginForm } from "@/components/auth/login-form";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary rounded-full mb-4">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">
            Welcome to Baigun Realty
          </h1>
          <p className="text-muted-foreground text-center mt-2">
            Your trusted partner in real estate.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

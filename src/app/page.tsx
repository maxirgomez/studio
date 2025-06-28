import { LoginForm } from "@/components/auth/login-form";
import { BaigunRealtyLogo } from "@/components/ui/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
           <BaigunRealtyLogo className="h-20 w-auto" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

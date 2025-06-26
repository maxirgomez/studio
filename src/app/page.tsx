import { LoginForm } from "@/components/auth/login-form";
import { BaigunRealtyLogo } from "@/components/ui/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
           <BaigunRealtyLogo className="h-20 w-auto" />
           <h1 className="text-3xl font-bold text-center text-foreground mt-4">Comunidad de Negocios</h1>
           <p className="text-muted-foreground text-center mt-2">Bienvenido a la plataforma de Baigun Realty</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

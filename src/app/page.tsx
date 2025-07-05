import { LoginForm } from "@/components/auth/login-form";
import { BaigunRealtyLogo } from "@/components/ui/logo";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen">
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://videos.pexels.com/video-files/32161011/13713425_1920_1080_24fps.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <BaigunRealtyLogo className="h-20 w-auto" />
          </div>
          <Suspense fallback={<div>Cargando formulario...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

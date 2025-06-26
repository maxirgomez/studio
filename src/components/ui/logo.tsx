import Image from 'next/image';
import { cn } from "@/lib/utils";

export const BaigunRealtyLogo = ({ className }: { className?: string }) => (
  <Image 
    src="https://baigunrealty.com/wp-content/uploads/2024/01/logo-1.png" 
    alt="Baigun Realty Logo" 
    width={355} 
    height={98}
    className={cn(className)}
  />
);

import { cn } from "@/lib/utils";

export const BaigunRealtyLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 251 98"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(className)}
    {...props}
  >
    <path d="M57.75 0H0V22.5H41.25V33.75H0V56.25H41.25V67.5H0V90H57.75C79.875 90 97.5 72.375 97.5 50.25V39.75C97.5 17.625 79.875 0 57.75 0ZM56.25 67.5H41.25V56.25H56.25C63.375 56.25 67.5 60.375 67.5 63.75C67.5 67.125 63.375 67.5 56.25 67.5ZM56.25 33.75H41.25V22.5H56.25C63.375 22.5 67.5 26.625 67.5 30C67.5 33.375 63.375 33.75 56.25 33.75Z" fill="currentColor"/>
    <g transform="translate(105, 0)">
      <text y="38" fontFamily="Inter, sans-serif" fontSize="38" fontWeight="bold" fill="currentColor">BAIGUN</text>
      <text y="80" fontFamily="Inter, sans-serif" fontSize="38" fontWeight="bold" fill="currentColor">REALTY</text>
      <text y="94" fontFamily="Inter, sans-serif" fontSize="8" letterSpacing="1.2" fill="currentColor">COMUNIDAD DE NEGOCIOS</text>
    </g>
  </svg>
);

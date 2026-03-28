import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <div className={cn("flex items-center", className)}>
        <Image src="/logo.svg" alt="ESG ON" width={20} height={7} className="object-contain" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Image src="/logo.svg" alt="ESG ON" width={84} height={26} className="object-contain brightness-0 invert" />
    </div>
  );
}

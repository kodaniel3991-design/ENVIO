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
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          E
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/ESG_ON_logo_header.png"
        alt="ESG ON"
        width={96}
        height={29}
        priority
        className="h-[1.6rem] w-auto"
      />
    </div>
  );
}

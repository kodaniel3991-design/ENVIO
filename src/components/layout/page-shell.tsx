import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  headerChildren?: React.ReactNode;
  "data-page"?: string;
}

interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  children,
  className,
  headerChildren,
  "data-page": dataPage,
}: PageShellProps) {
  return (
    <div data-page={dataPage} className={cn("space-y-8", className)}>
      <PageHeader title={title} description={description}>
        {headerChildren}
      </PageHeader>
      {children}
    </div>
  );
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || description || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-sm font-medium text-muted-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}


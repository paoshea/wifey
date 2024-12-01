interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  heading,
  text,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}

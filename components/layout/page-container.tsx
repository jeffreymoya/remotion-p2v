export function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-6xl pt-6">{children}</div>;
}

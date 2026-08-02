export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-full bg-canvas">{children}</div>
}

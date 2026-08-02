import { cookies } from "next/headers";
import ScrollToTop from "@/components/ScrollToTop";
import Shell from "@/components/Shell";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collapsed = (await cookies()).get("sidebar")?.value === "1";

  return (
    <Shell collapsed={collapsed} sidebar={<Sidebar />}>
      <ScrollToTop />
      {children}
    </Shell>
  );
}

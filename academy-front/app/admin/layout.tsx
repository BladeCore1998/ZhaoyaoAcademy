import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return <AdminShell>{children}</AdminShell>;
}

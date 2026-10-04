import { getSession } from "@/lib/session";
import { getCurrentSeason } from "@/lib/season";
import UserSeasonTheme from "./UserSeasonTheme";

export default async function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession().catch(() => null);

  return (
    <UserSeasonTheme isLoggedIn={Boolean(session)} initialSeason={getCurrentSeason()}>
      {children}
    </UserSeasonTheme>
  );
}

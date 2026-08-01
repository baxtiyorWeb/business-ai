import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerUser(req?: Request) {
  try {
    // 1. Try to get token from Authorization header (JWT)
    if (req) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() { return []; },
              setAll() {},
            },
          }
        );
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          return user;
        }
      }
    }

    // 2. Fall back to cookie-based auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie setting errors inside route handlers
            }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("getServerUser error:", error);
    return null;
  }
}

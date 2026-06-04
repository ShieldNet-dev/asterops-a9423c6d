import { createServerFn } from "./_shim";
import { requireSupabaseAuth } from "./_shim";

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role as string);
    return {
      roles,
      isAdmin: roles.includes("admin"),
      isOperator: roles.includes("admin") || roles.includes("operator"),
    };
  });
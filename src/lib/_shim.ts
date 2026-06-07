// Thin compatibility shim that lets former TanStack createServerFn wrappers
// run client-side against Supabase with the user's RLS-scoped session.
import { supabase } from "@/lib/supabase";

export async function _ctx() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return { supabase, userId: data.user.id, claims: data.user };
}

export type Ctx = Awaited<ReturnType<typeof _ctx>>;

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

class ServerFnBuilder<I = unknown> {
  private _validator: ((i: unknown) => I) | null = null;
  middleware(_: unknown[]) {
    return this;
  }
  inputValidator<NewI>(v: (i: any) => NewI) {
    this._validator = v as unknown as (i: unknown) => I;
    return this as unknown as ServerFnBuilder<NewI>;
  }
  handler<R>(fn: (args: { data: I; context: Ctx }) => Promise<R> | R) {
    const validator = this._validator;
    return async (args?: { data?: unknown }): Promise<R> => {
      const raw = args?.data;
      const data = (validator ? validator(raw) : (raw as I)) as I;
      const context = await _ctx();
      return fn({ data, context });
    };
  }
}

export function createServerFn(_opts: { method: Method }) {
  return new ServerFnBuilder();
}

// Marker; the shim does its own auth in _ctx().
export const requireSupabaseAuth = Symbol("requireSupabaseAuth");

// Routes used to wrap server fns with useServerFn; now it's an identity hook.
export function useServerFn<T>(fn: T): T {
  return fn;
}
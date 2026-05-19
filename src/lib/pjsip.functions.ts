import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { renderPjsip, renderHardeningScript, type RenderInput } from "./pjsip-renderer";

const CodecSchema = z.enum(["ulaw", "alaw", "g722", "g729", "opus", "speex"]);

const EndpointSchema = z.object({
  id: z.string().uuid().optional(),
  extension: z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  display_name: z.string().trim().max(80).optional().nullable(),
  context: z.string().trim().min(1).max(40).default("from-internal"),
  codecs: z.array(CodecSchema).min(1).max(8),
  transport: z.string().trim().min(1).max(40).default("transport-tls"),
  tls_required: z.boolean().default(true),
  srtp_required: z.boolean().default(true),
  max_contacts: z.number().int().min(1).max(10).default(1),
});

const TrunkSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/),
  provider: z.string().trim().max(80).optional().nullable(),
  host: z.string().trim().min(1).max(255),
  port: z.number().int().min(1).max(65535).default(5060),
  username: z.string().trim().max(80).optional().nullable(),
  transport: z.string().trim().min(1).max(40).default("transport-tls"),
  srtp_required: z.boolean().default(true),
});

export const listEndpoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: endpoints } = await supabase
      .from("endpoints")
      .select("*")
      .eq("server_id", data.server_id)
      .order("extension");
    const { data: trunks } = await supabase
      .from("trunks")
      .select("*")
      .eq("server_id", data.server_id)
      .order("name");
    return { endpoints: endpoints ?? [], trunks: trunks ?? [] };
  });

export const upsertEndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ server_id: z.string().uuid(), endpoint: EndpointSchema })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { ...data.endpoint, server_id: data.server_id };
    const { error } = data.endpoint.id
      ? await supabase.from("endpoints").update(payload).eq("id", data.endpoint.id)
      : await supabase.from("endpoints").insert(payload);
    if (error) return { ok: false, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: data.endpoint.id ? "endpoint.update" : "endpoint.create",
      target_type: "endpoint",
      meta: { extension: data.endpoint.extension },
    });
    return { ok: true, error: null };
  });

export const deleteEndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase.from("endpoints").select("server_id, extension").eq("id", data.id).maybeSingle();
    const { error } = await supabase.from("endpoints").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    if (row) {
      await supabase.from("audit_events").insert({
        actor_id: userId,
        server_id: row.server_id,
        action: "endpoint.delete",
        target_type: "endpoint",
        meta: { extension: row.extension },
      });
    }
    return { ok: true, error: null };
  });

export const upsertTrunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), trunk: TrunkSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload = { ...data.trunk, server_id: data.server_id };
    const { error } = data.trunk.id
      ? await supabase.from("trunks").update(payload).eq("id", data.trunk.id)
      : await supabase.from("trunks").insert(payload);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  });

export const renderAndSavePjsipConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: server }, { data: endpoints }, { data: trunks }, { data: hardening }] =
      await Promise.all([
        supabase.from("servers").select("name").eq("id", data.server_id).maybeSingle(),
        supabase.from("endpoints").select("*").eq("server_id", data.server_id),
        supabase.from("trunks").select("*").eq("server_id", data.server_id),
        supabase.from("hardening_profiles").select("*").eq("server_id", data.server_id).maybeSingle(),
      ]);

    if (!server) return { config: null, error: "Server not found" };

    const rendered = renderPjsip({
      serverName: server.name,
      tlsOnly: hardening?.tls_only ?? true,
      endpoints: (endpoints ?? []) as RenderInput["endpoints"],
      trunks: (trunks ?? []) as RenderInput["trunks"],
    });

    const { data: latest } = await supabase
      .from("pjsip_configs")
      .select("version")
      .eq("server_id", data.server_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;

    const { data: cfg, error } = await supabase
      .from("pjsip_configs")
      .insert({
        server_id: data.server_id,
        version: nextVersion,
        rendered_text: rendered,
        state: "pending",
        created_by: userId,
      })
      .select()
      .single();
    if (error) return { config: null, error: error.message };

    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "pjsip.render",
      target_type: "pjsip_config",
      target_id: cfg.id,
      meta: { version: nextVersion },
    });
    return { config: cfg, error: null };
  });

export const previewPjsipConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: server }, { data: endpoints }, { data: trunks }, { data: hardening }] =
      await Promise.all([
        supabase.from("servers").select("name").eq("id", data.server_id).maybeSingle(),
        supabase.from("endpoints").select("*").eq("server_id", data.server_id),
        supabase.from("trunks").select("*").eq("server_id", data.server_id),
        supabase.from("hardening_profiles").select("*").eq("server_id", data.server_id).maybeSingle(),
      ]);
    if (!server) return { rendered: "" };
    return {
      rendered: renderPjsip({
        serverName: server.name,
        tlsOnly: hardening?.tls_only ?? true,
        endpoints: (endpoints ?? []) as RenderInput["endpoints"],
        trunks: (trunks ?? []) as RenderInput["trunks"],
      }),
    };
  });

export const getHardening = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: h } = await context.supabase
      .from("hardening_profiles")
      .select("*")
      .eq("server_id", data.server_id)
      .maybeSingle();
    return { hardening: h };
  });

const HardeningSchema = z.object({
  server_id: z.string().uuid(),
  fail2ban_enabled: z.boolean(),
  iptables_enabled: z.boolean(),
  ami_lockdown: z.boolean(),
  tls_only: z.boolean(),
  srtp_only: z.boolean(),
  ssh_hardening: z.boolean(),
  rtp_port_start: z.number().int().min(1024).max(65535),
  rtp_port_end: z.number().int().min(1024).max(65535),
});

export const updateHardening = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => HardeningSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("hardening_profiles")
      .update({
        fail2ban_enabled: data.fail2ban_enabled,
        iptables_enabled: data.iptables_enabled,
        ami_lockdown: data.ami_lockdown,
        tls_only: data.tls_only,
        srtp_only: data.srtp_only,
        ssh_hardening: data.ssh_hardening,
        rtp_port_start: data.rtp_port_start,
        rtp_port_end: data.rtp_port_end,
      })
      .eq("server_id", data.server_id);
    if (error) return { ok: false, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "hardening.update",
      target_type: "hardening_profile",
    });
    return { ok: true, error: null };
  });

export const renderHardeningBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: server }, { data: hardening }] = await Promise.all([
      supabase.from("servers").select("name").eq("id", data.server_id).maybeSingle(),
      supabase.from("hardening_profiles").select("*").eq("server_id", data.server_id).maybeSingle(),
    ]);
    if (!server || !hardening) return { script: "" };
    return {
      script: renderHardeningScript({
        serverName: server.name,
        fail2banEnabled: hardening.fail2ban_enabled,
        iptablesEnabled: hardening.iptables_enabled,
        amiLockdown: hardening.ami_lockdown,
        rtpStart: hardening.rtp_port_start,
        rtpEnd: hardening.rtp_port_end,
        sshHardening: hardening.ssh_hardening,
      }),
    };
  });
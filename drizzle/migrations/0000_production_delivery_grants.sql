GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT ALL ON public.notification_deliveries TO service_role;

GRANT SELECT ON public.agent_reloads TO authenticated;
GRANT ALL ON public.agent_reloads TO service_role;
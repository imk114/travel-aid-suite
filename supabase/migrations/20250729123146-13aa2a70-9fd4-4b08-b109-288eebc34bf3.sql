-- Fix security warnings by properly updating functions with search_path

-- Drop function and dependent triggers with CASCADE
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the triggers
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update GST calculation functions with proper search_path
DROP FUNCTION IF EXISTS public.calculate_gst(service_type, DECIMAL);
DROP FUNCTION IF EXISTS public.get_gst_rate(service_type);

CREATE OR REPLACE FUNCTION public.calculate_gst(service_type service_type, amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    CASE service_type
        WHEN 'self_drive' THEN
            RETURN amount * 0.18;
        WHEN 'taxi', 'tour' THEN
            RETURN amount * 0.05;
        ELSE
            RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_gst_rate(service_type service_type)
RETURNS DECIMAL AS $$
BEGIN
    CASE service_type
        WHEN 'self_drive' THEN
            RETURN 18.00;
        WHEN 'taxi', 'tour' THEN
            RETURN 5.00;
        ELSE
            RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
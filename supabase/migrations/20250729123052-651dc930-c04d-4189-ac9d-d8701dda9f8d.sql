-- Fix security warnings by updating functions with proper search_path

-- Drop and recreate the update function with security definer and proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate GST calculation functions with security definer and proper search_path
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
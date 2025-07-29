-- Create enum types for the travel business application
CREATE TYPE public.service_type AS ENUM ('self_drive', 'taxi', 'tour');
CREATE TYPE public.payment_mode AS ENUM ('upi', 'cash', 'bank_transfer');
CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'bank');
CREATE TYPE public.id_proof_type AS ENUM ('aadhar', 'pan', 'license', 'passport', 'voter_id');
CREATE TYPE public.payment_status AS ENUM ('advance', 'pending', 'completed');

-- Create clients table
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    id_proof_type id_proof_type NOT NULL,
    id_proof_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    payment_mode payment_mode NOT NULL,
    received_bank_name TEXT,
    transaction_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    gst_rate DECIMAL(5,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app users table for authentication
CREATE TABLE public.app_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin user (password: travelx@2023)
INSERT INTO public.app_users (username, password_hash, full_name, role) 
VALUES ('travelxadv1', '$2b$10$8K3qzKFVNz.nQlFBGY5mfOzQF7wWqZx3LKjr3gV4QxPGI5bM4RLXK', 'Travel Admin', 'admin');

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all authenticated operations for now)
CREATE POLICY "Allow all operations for authenticated users" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.payments FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.app_users FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_clients_mobile ON public.clients(mobile_number);
CREATE INDEX idx_clients_name ON public.clients(client_name);
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX idx_payments_booking_date ON public.payments(booking_date);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
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

-- Create function to calculate GST based on service type
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
$$ LANGUAGE plpgsql;

-- Create function to get GST rate based on service type
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
$$ LANGUAGE plpgsql;
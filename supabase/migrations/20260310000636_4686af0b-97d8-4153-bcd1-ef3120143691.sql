INSERT INTO public.user_roles (user_id, role)
VALUES ('f1c49c7c-1c3d-4b0d-8e68-32b31f125153', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
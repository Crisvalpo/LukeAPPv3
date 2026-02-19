SELECT email, substring(encrypted_password from 1 for 4) as prefix FROM auth.users WHERE email = 'cristianluke+v3@gmail.com';

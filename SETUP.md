# Authentication Setup Guide

This Hotel Management System now includes authentication with two types of users:
- **Admin users**: Can perform CRUD operations (Create, Read, Update, Delete)
- **Regular users**: View-only access via Google OAuth

## Setup Instructions

### 1. Database Setup

Run the updated `schema.sql` file to create the necessary tables:
- `users` - Stores user accounts (admin and regular users)
- `accounts` - Stores OAuth account information
- `sessions` - Stores user sessions
- `verification_tokens` - Stores email verification tokens

```bash
mysql -u your_user -p < schema.sql
```

### 2. Environment Variables

Copy `env.local.example` to `.env.local` and fill in the required values:

```bash
cp env.local.example .env.local
```

Required environment variables:
- `MYSQL_HOST` - Your MySQL host
- `MYSQL_PORT` - MySQL port (default: 3306)
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - MySQL database name
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` - A random secret string (generate with: `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local` file

### 4. Create Admin User

Create an admin user using the provided script:

```bash
npm run create-admin <email> <password>
```

Example:
```bash
npm run create-admin admin@hotel.com admin123
```

If the user already exists, the script will update their password and set them as admin.

### 5. Run the Application

```bash
npm run dev
```

## Usage

### Admin Login
1. Navigate to `/login`
2. Enter your admin email and password
3. Click "Sign in as Admin"
4. You'll have full CRUD access to rooms

### User Login (View Only)
1. Navigate to `/login`
2. Click "Sign in with Google (View Only)"
3. Authenticate with your Google account
4. You'll have view-only access to rooms (no create, edit, or delete)

## Features

- **Protected Routes**: All routes require authentication
- **Role-Based Access Control**: Admin can perform CRUD, users can only view
- **Session Management**: Uses NextAuth.js for secure session handling
- **Google OAuth**: Seamless authentication for regular users
- **Password Hashing**: Admin passwords are securely hashed using bcrypt

## Security Notes

- Change the default admin password immediately
- Use a strong `NEXTAUTH_SECRET` in production
- Keep your `.env.local` file secure and never commit it to version control
- Regularly update dependencies for security patches


# DigitalOcean Deployment Guide

## Database Setup on DigitalOcean

### 1. Create MySQL Database on DigitalOcean

1. Log in to your DigitalOcean account
2. Navigate to **Databases** → **Create Database Cluster**
3. Choose **MySQL** as the database engine
4. Select your preferred plan and region
5. Create a database cluster
6. Once created, note down:
   - **Host** (e.g., `db-mysql-nyc1-12345.db.ondigitalocean.com`)
   - **Port** (usually `25060` for managed databases)
   - **Database name** (default or create a new one)
   - **Username** and **Password**

### 2. Configure Database Connection

1. In your DigitalOcean database dashboard, go to **Settings** → **Trusted Sources**
2. Add your application's IP address or allow all sources (for development)
3. For production, restrict to your app's IP addresses

### 3. Run the Schema

You can run the schema in several ways:

#### Option A: Using DigitalOcean Console
1. Go to your database cluster
2. Click on **Quick Actions** → **MySQL Console**
3. Select your database
4. Copy and paste the contents of `schema.sql`
5. Execute the script

#### Option B: Using MySQL Client
```bash
mysql -h <your-host> -P 25060 -u <username> -p <database-name> < schema.sql
```

#### Option C: Using a Database Tool
Use tools like:
- MySQL Workbench
- DBeaver
- TablePlus
- phpMyAdmin (if installed)

Connect using:
- **Host**: Your database host
- **Port**: 25060 (or your assigned port)
- **Username**: Your database username
- **Password**: Your database password
- **Database**: Your database name
- **SSL**: Required (DigitalOcean uses SSL by default)

### 4. Update Environment Variables

Update your `.env.local` (or production environment variables) with:

```env
MYSQL_HOST=your-database-host.db.ondigitalocean.com
MYSQL_PORT=25060
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=your-database-name

NEXTAUTH_URL=https://your-app-domain.com
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important**: For production, update the Google OAuth redirect URI to:
```
https://your-app-domain.com/api/auth/callback/google
```

### 5. Create Admin User

After deploying your application, create an admin user:

```bash
npm run create-admin admin@yourdomain.com your-secure-password
```

Or if running on the server:
```bash
node scripts/create-admin.js admin@yourdomain.com your-secure-password
```

### 6. SSL Connection

DigitalOcean MySQL requires SSL connections. The `mysql2` package supports SSL by default, but you may need to configure it explicitly in production:

```typescript
// In src/lib/db.ts (if needed)
globalThis.mysqlPool = mysql.createPool({
  host,
  database,
  user,
  password,
  port,
  ssl: {
    rejectUnauthorized: false // For DigitalOcean managed databases
  },
  waitForConnections: true,
  connectionLimit: 10,
});
```

## App Platform Deployment

### 1. Connect Your Repository

1. Go to DigitalOcean **App Platform**
2. Click **Create App**
3. Connect your GitHub/GitLab repository
4. Select the branch to deploy

### 2. Configure Build Settings

- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Environment**: Node.js

### 3. Set Environment Variables

Add all environment variables from your `.env.local` in the App Platform dashboard:
- Go to **Settings** → **App-Level Environment Variables**
- Add each variable:
  - `MYSQL_HOST`
  - `MYSQL_PORT`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

### 4. Deploy

1. Review your settings
2. Click **Create Resources**
3. Wait for deployment to complete

## Security Checklist

- [ ] Use strong passwords for database and admin account
- [ ] Set `NEXTAUTH_SECRET` to a secure random string
- [ ] Update Google OAuth redirect URIs for production
- [ ] Restrict database trusted sources to your app IPs
- [ ] Enable SSL for database connections
- [ ] Use environment variables (never commit secrets)
- [ ] Regularly update dependencies
- [ ] Set up database backups in DigitalOcean

## Troubleshooting

### Connection Issues
- Verify database host, port, and credentials
- Check trusted sources in DigitalOcean dashboard
- Ensure SSL is enabled for connections

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your app domain
- Check `NEXTAUTH_SECRET` is set correctly
- Ensure Google OAuth redirect URI is correct

### Database Errors
- Verify schema has been run successfully
- Check table names match (case-sensitive)
- Ensure foreign key constraints are properly set


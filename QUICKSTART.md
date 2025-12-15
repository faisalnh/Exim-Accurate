# Quick Start Guide

Follow these steps to get Exima up and running quickly.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Accurate Online account with API credentials

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

The `.env` file is already created. Update if needed:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/exim_accurate?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-please-change-in-production"
NODE_ENV="development"
```

## Step 3: Start Database

```bash
docker-compose up -d
```

Wait a few seconds for PostgreSQL to initialize.

## Step 4: Run Database Migrations

```bash
npm run db:push
```

Or use migrations:

```bash
npm run db:migrate
```

## Step 5: Create a User

```bash
npm run db:seed
```

This creates a default user:
- Email: `admin@example.com`
- Password: `password123`

To create a custom user:

```bash
npm run db:seed your@email.com yourpassword admin
```

## Step 6: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

## Step 7: Login and Configure

1. Navigate to http://localhost:3000
2. Login with your credentials
3. Go to **Accurate Credentials** in the sidebar
4. Add your Accurate API credentials:
   - App Key
   - Signature Secret
   - API Token

## Step 8: Start Using

### Export Inventory Adjustments

1. Go to **Export > Inventory Adjustment**
2. Select credentials
3. Choose date range
4. Select format (CSV/XLSX/JSON)
5. Click **Export**

### Import Inventory Adjustments

1. Prepare your CSV/XLSX file with required columns:
   - itemCode, type, quantity, unit, adjustmentDate
2. Go to **Import > Inventory Adjustment**
3. Select credentials
4. Upload file
5. Click **Validate**
6. Review validation results
7. Click **Import**

## Troubleshooting

### Database Connection Failed
```bash
# Check if Docker container is running
docker ps

# Restart the container
docker-compose restart
```

### Port Already in Use
```bash
# Change the port in package.json dev script
"dev": "next dev -p 3001"
```

### Prisma Client Not Generated
```bash
npm run db:generate
```

## Additional Commands

```bash
# Open Prisma Studio (Database GUI)
npm run db:studio

# View logs
docker-compose logs -f

# Stop database
docker-compose down

# Reset database (WARNING: Deletes all data)
docker-compose down -v
npm run db:push
```

## Getting Your Accurate API Credentials

1. Login to your Accurate Online account
2. Go to **Settings** > **API Configuration**
3. Generate or retrieve your:
   - App Key
   - Signature Secret
   - API Token

Contact Accurate support if you need help accessing API credentials.

## Next Steps

- Configure additional users (via Prisma Studio or the seed script)
- Set up role-based access control if needed
- Configure production environment variables
- Set up SSL certificates for production

## Support

For issues, check:
- The main README.md
- GitHub Issues
- Accurate API documentation

# Exima - Export/Import Manager for Accurate Online

Exima is a web application designed to extend the capabilities of Accurate Online (Indonesian accounting software) by providing export and import functionality for Inventory Adjustments (Penyesuaian Persediaan).

## Features

### MVP Features
- **Export Inventory Adjustments** - Export inventory adjustment data to CSV, XLSX, or JSON formats
- **Import Inventory Adjustments** - Import inventory adjustments from CSV/XLSX templates with validation
- **Accurate API Integration** - Secure integration with Accurate Online API
- **Credential Management** - Manage multiple Accurate API credentials
- **Authentication** - Secure login with NextAuth

## Technology Stack

### Frontend + Backend
- **Next.js 16** with App Router
- **TypeScript**
- **Mantine UI** - Complete component library
- **Tabler Icons**
- **Zustand** - Client state management (light usage)

### Backend
- **Next.js Server Actions** + Route Handlers (API)
- **PostgreSQL** with Prisma ORM
- **NextAuth** (Credentials provider)
- **Zod** - Schema validation

### Styling
- **Mantine UI** theming system
- No Tailwind, No Shadcn

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)
- Accurate Online account with API credentials

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Exima-Accurate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/exim_accurate?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Node Environment
NODE_ENV="development"
```

### 4. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432`.

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Create a default user

You can create a user directly in the database or use Prisma Studio:

```bash
npx prisma studio
```

Or create a user via script:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('User created:', user);
}

main().then(() => process.exit(0)).catch(console.error);
"
```

### 7. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

### 1. Login

Navigate to `http://localhost:3000/login` and sign in with your credentials.

### 2. Add Accurate Credentials

1. Go to **Accurate Credentials** in the sidebar
2. Enter your Accurate API credentials:
   - App Key
   - Signature Secret
   - API Token
3. Click **Save Credentials**

The system will automatically resolve and save your Accurate host URL.

### 3. Export Inventory Adjustments

1. Go to **Export > Inventory Adjustment**
2. Select your Accurate credentials
3. Choose a date range
4. Select export format (CSV, XLSX, or JSON)
5. Click **Export** to download the file

You can also click **Preview** to see the first 20 rows before exporting.

### 4. Import Inventory Adjustments

#### Template Format

Your CSV or XLSX file must contain these columns:

| Column | Required | Description |
|--------|----------|-------------|
| itemCode | Yes | Item code from Accurate |
| type | Yes | "Penambahan" or "Pengurangan" |
| quantity | Yes | Positive number |
| unit | Yes | Unit name |
| adjustmentDate | Yes | YYYY-MM-DD format |
| referenceNumber | No | Optional reference |

#### Import Process

1. Go to **Import > Inventory Adjustment**
2. Select your Accurate credentials
3. Upload your CSV or XLSX file
4. Click **Validate** to check for errors
5. Review the validation results
6. Click **Import** to import the data to Accurate

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Credentials
- `GET /api/credentials` - List user's credentials
- `POST /api/credentials` - Add new credentials
- `DELETE /api/credentials?id={id}` - Delete credentials

### Export
- `POST /api/export/inventory-adjustment` - Export inventory adjustments
- `GET /api/export/inventory-adjustment/preview` - Preview export data

### Import
- `POST /api/import/inventory-adjustment/validate` - Validate import file
- `POST /api/import/inventory-adjustment` - Import inventory adjustments

## Project Structure

```
Exima-Accurate/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth routes
│   │   ├── credentials/          # Credentials API
│   │   ├── export/               # Export APIs
│   │   └── import/               # Import APIs
│   ├── dashboard/                # Dashboard pages
│   │   ├── credentials/          # Credentials management
│   │   ├── export/               # Export pages
│   │   └── import/               # Import pages
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   └── DashboardLayout.tsx       # Dashboard layout with AppShell
├── lib/                          # Library code
│   ├── accurate/                 # Accurate API client
│   │   ├── client.ts             # API client with auth & rate limiting
│   │   └── inventory.ts          # Inventory adjustment module
│   ├── export/                   # Export engines
│   │   └── exporters.ts          # CSV/XLSX/JSON exporters
│   ├── import/                   # Import engines
│   │   ├── parser.ts             # CSV/XLSX parsers
│   │   └── validator.ts          # Import validation
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   └── providers.tsx             # React context providers
├── prisma/                       # Prisma schema and migrations
│   └── schema.prisma             # Database schema
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth types
├── docker-compose.yml            # PostgreSQL container
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Database Schema

### User
Stores user authentication data and role information.

### AccurateCredentials
Stores Accurate API credentials for each user.

### ExportJob
Tracks export job status and results.

### ImportJob
Tracks import job status and results.

## Accurate API Integration

### Authentication
The application uses HMAC-SHA256 signature authentication with Accurate API:
1. Generate ISO timestamp
2. Create HMAC signature using signature secret
3. Include in request headers

### Rate Limiting
Implements rate limiting to comply with Accurate API limits:
- 8 requests per second
- 8 concurrent requests maximum

### Host Resolution
Automatically resolves the correct Accurate host URL for each API token.

## Development

### Run Prisma Studio
```bash
npx prisma studio
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Create Migration
```bash
npx prisma migrate dev --name <migration-name>
```

### Run Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

## Troubleshooting

### Database Connection Issues
- Ensure Docker is running
- Check PostgreSQL container is up: `docker ps`
- Verify DATABASE_URL in `.env`

### Accurate API Errors
- Verify your API credentials are correct
- Ensure host has been resolved (check credentials page)
- Check rate limiting isn't being exceeded

### Import Validation Failures
- Ensure item codes exist in Accurate
- Check date format is YYYY-MM-DD
- Verify type is exactly "Penambahan" or "Pengurangan"

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

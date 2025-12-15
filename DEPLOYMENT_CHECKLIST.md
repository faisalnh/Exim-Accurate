# Deployment Checklist

Use this checklist to deploy Exima to production.

## Pre-Deployment

### Environment Setup
- [ ] Update `.env` with production values
- [ ] Generate strong `NEXTAUTH_SECRET` (min 32 characters)
- [ ] Configure production `DATABASE_URL`
- [ ] Set `NODE_ENV=production`
- [ ] Set correct `NEXTAUTH_URL` (production domain)

### Database
- [ ] Set up production PostgreSQL (managed service recommended)
- [ ] Run database migrations: `npm run db:migrate`
- [ ] Create admin user: `npm run db:seed admin@yourdomain.com securePassword admin`
- [ ] Test database connection
- [ ] Configure automatic backups

### Build & Test
- [ ] Install dependencies: `npm install`
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Run linting: `npm run lint`
- [ ] Build project: `npm run build`
- [ ] Test production build locally: `npm start`

### Security Review
- [ ] Verify all API endpoints require authentication
- [ ] Check password hashing is working (bcrypt with 10 rounds)
- [ ] Verify Accurate API credentials are encrypted in transit
- [ ] Review CORS settings if needed
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up rate limiting at server level
- [ ] Configure Content Security Policy headers

### Performance
- [ ] Enable compression (gzip/brotli)
- [ ] Configure caching headers
- [ ] Set up CDN for static assets (if applicable)
- [ ] Test with production data volumes
- [ ] Monitor memory usage
- [ ] Set up health check endpoint

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Required Environment Variables:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-here
NODE_ENV=production
```

### Option 2: Docker

1. Create Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t exim-accurate .
docker run -p 3000:3000 --env-file .env exim-accurate
```

### Option 3: VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd Exima-Accurate
npm install
npx prisma generate
npm run build

# Use PM2 for process management
sudo npm install -g pm2
pm2 start npm --name "exim" -- start
pm2 save
pm2 startup
```

## Post-Deployment

### Verification
- [ ] Test login functionality
- [ ] Add Accurate credentials
- [ ] Test export with date range
- [ ] Test import with sample file
- [ ] Verify all pages load correctly
- [ ] Check error handling
- [ ] Test on mobile devices

### Monitoring Setup
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Configure alerts for failures
- [ ] Monitor database performance
- [ ] Track API rate limit usage

### Documentation
- [ ] Update README with production URL
- [ ] Document backup procedures
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] Update user guide

### Backup & Recovery
- [ ] Test database backup restoration
- [ ] Document recovery procedures
- [ ] Set up automated backups (daily recommended)
- [ ] Store backups in separate location
- [ ] Test disaster recovery plan

### User Onboarding
- [ ] Create first admin user
- [ ] Prepare user documentation
- [ ] Test complete user workflow
- [ ] Gather Accurate API credentials
- [ ] Train initial users

## Maintenance

### Regular Tasks
- [ ] Monitor application logs weekly
- [ ] Review database size monthly
- [ ] Update dependencies quarterly
- [ ] Review security patches
- [ ] Check Accurate API for changes

### Scaling Considerations
- [ ] Monitor concurrent user count
- [ ] Track export/import job volumes
- [ ] Review database performance
- [ ] Consider read replicas if needed
- [ ] Implement job queue for large imports

## Rollback Plan

If deployment fails:

1. **Immediate:**
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   npm install
   npm run build
   pm2 restart exim
   ```

2. **Database:**
   ```bash
   # Restore from backup
   psql -U postgres -d exim_accurate < backup.sql
   ```

3. **Notify:**
   - Inform users of downtime
   - Document what went wrong
   - Plan fix or rollback

## Support

### Common Issues

**Can't connect to database:**
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules
- Verify credentials

**Accurate API errors:**
- Verify API credentials
- Check rate limiting
- Verify host is resolved
- Check Accurate API status

**Import fails:**
- Verify file format (CSV/XLSX)
- Check column names match template
- Verify item codes exist in Accurate
- Check date format (YYYY-MM-DD)

**Export timeout:**
- Reduce date range
- Check Accurate API rate limits
- Verify database performance

## Production URLs

- **Application**: https://yourdomain.com
- **Database**: postgresql://...
- **Monitoring**: https://monitoring.yourdomain.com

## Contacts

- **DevOps**: devops@yourdomain.com
- **Support**: support@yourdomain.com
- **Accurate Support**: support@accurate.id

---

## Quick Production Setup

```bash
# 1. Clone and install
git clone <repo>
cd Exima-Accurate
npm install

# 2. Configure
cp .env.example .env
# Edit .env with production values

# 3. Database
npm run db:push
npm run db:seed admin@company.com SecurePass123 admin

# 4. Build
npm run build

# 5. Start
npm start
# Or with PM2: pm2 start npm --name exim -- start
```

---

Last Updated: 2025-12-09

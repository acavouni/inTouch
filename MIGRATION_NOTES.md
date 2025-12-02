# Database Migration Notes

## Adding Clerk ID to User Model

After updating the Prisma schema to include `clerkId`, you need to run a migration:

### Steps:

1. **Create the migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_clerk_id
   ```

2. **For existing users (if any):**
   - If you have existing users in your database, you'll need to manually add `clerkId` values
   - You can do this via Prisma Studio or a migration script
   - Example migration script:
   ```javascript
   // backend/scripts/add-clerk-ids.js
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   
   async function addClerkIds() {
     // This is just an example - adjust based on your needs
     // You might need to link existing users to Clerk accounts manually
     const users = await prisma.user.findMany({
       where: { clerkId: null }
     });
     
     console.log(`Found ${users.length} users without clerkId`);
     // Handle migration logic here
   }
   
   addClerkIds()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

### Important Notes:

- The `clerkId` field is marked as `@unique`, so each Clerk user can only have one database record
- New users will automatically get a `clerkId` when they sign up via the sync endpoint
- Existing users without a `clerkId` will need to be handled manually or through a data migration


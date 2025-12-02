# 🔧 UserSync 400 Error - Root Cause & Fix

## 🐛 **The Problem**

**Symptom**: 400 error when `UserSync` component tries to hit `/api/sync-user`

**Root Cause Analysis:**

### **Frontend Issue** (`UserSync.tsx`)
```typescript
// ❌ BEFORE - No body sent!
const response = await authedFetch(`${API_BASE_URL}/api/sync-user`, {
  method: 'POST',
  // NO BODY DATA!
});
```

The frontend was sending an **empty POST request** with no JSON body containing user data.

### **Backend Issue** (`syncController.js`)
```javascript
// ❌ BEFORE - Trying to extract from JWT token
const email = clerkUser.primaryEmailAddress?.emailAddress 
  || clerkUser.emailAddresses?.[0]?.emailAddress;
```

The backend was trying to extract `email`, `firstName`, `lastName` from `req.auth` (JWT token claims), but **JWT tokens don't contain full user profile data** - they only have basic claims like `userId`, `sessionId`, etc.

**Result**: `email` was `undefined` → 400 error returned at line 25-27.

---

## ✅ **The Solution**

### **Frontend Fix** (`UserSync.tsx`)

#### **Changes Made:**
1. ✅ Added `useUser()` hook to get full Clerk user object
2. ✅ Extract user data: `email`, `name`, `username` from Clerk user
3. ✅ Send data in POST body as JSON
4. ✅ Added console logs for debugging

```typescript
// ✅ AFTER - Proper data extraction and sending
import { useAuth, useUser } from '@clerk/clerk-expo';

export function UserSync({ children, onSyncComplete }: UserSyncProps) {
  const { isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser(); // ← NEW: Get full user object

  useEffect(() => {
    const syncUser = async () => {
      if (!isSignedIn || !userId || !user || synced) return;

      // ✅ Extract user data from Clerk
      const email = user.primaryEmailAddress?.emailAddress 
        || user.emailAddresses?.[0]?.emailAddress;
      const username = user.username;
      const firstName = user.firstName;
      const lastName = user.lastName;
      const name = firstName && lastName 
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName || username || email?.split('@')[0] || 'User';

      console.log('Syncing user to backend:', { userId, email, name, username });

      const authedFetch = createAuthedFetch(getToken);
      const response = await authedFetch(`${API_BASE_URL}/api/sync-user`, {
        method: 'POST',
        body: JSON.stringify({
          clerkId: userId,
          email,
          name,
          username,
        }), // ← NEW: Send data in body!
      });

      // ... rest of code
    };
    syncUser();
  }, [isSignedIn, userId, user, getToken, synced, onSyncComplete]);
  // ↑ Added 'user' to dependencies

  return <>{children}</>;
}
```

### **Backend Fix** (`syncController.js`)

#### **Changes Made:**
1. ✅ Read data from `req.body` instead of `req.auth`
2. ✅ Added comprehensive console logging for debugging
3. ✅ Improved error messages with received data

```javascript
// ✅ AFTER - Read from request body
async function syncUser(req, res) {
  try {
    console.log('=== SYNC USER REQUEST ===');
    console.log('Request Body:', req.body);
    console.log('Clerk User ID (from middleware):', req.clerkUserId);

    const clerkUserId = req.clerkUserId; // From JWT token (middleware)

    if (!clerkUserId) {
      console.error('ERROR: No Clerk user ID found');
      return res.status(401).json({ error: 'Unauthorized: No Clerk user ID' });
    }

    // ✅ Get user info from request body (sent by frontend)
    const { email, name, username } = req.body;

    console.log('Extracted Data:', { clerkUserId, email, name, username });

    if (!email) {
      console.error('ERROR: No email in request body');
      return res.status(400).json({ 
        error: 'Email is required',
        received: req.body  // ← Show what was received
      });
    }

    // Check if user exists by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (user) {
      console.log('User exists - updating:', user.id);
      user = await prisma.user.update({
        where: { clerkId: clerkUserId },
        data: { email, name, lastUpdated: new Date() },
      });
      console.log('User updated successfully:', user);
    } else {
      console.log('User does not exist - creating new user');
      user = await prisma.user.create({
        data: { clerkId: clerkUserId, email, name },
      });
      console.log('User created successfully:', user);
    }

    console.log('=== SYNC COMPLETE ===');
    res.json(user);
  } catch (error) {
    console.error('=== ERROR SYNCING USER ===');
    console.error('Error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email already exists with a different account',
        code: 'EMAIL_CONFLICT'
      });
    }
    
    res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
}
```

---

## 📊 **Data Flow (After Fix)**

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: UserSync Component                              │
├─────────────────────────────────────────────────────────────┤
│  1. useUser() hook gets full Clerk user object              │
│  2. Extract: email, name, username, firstName, lastName     │
│  3. POST /api/sync-user with JWT token + JSON body:        │
│     {                                                        │
│       "clerkId": "user_abc123",                            │
│       "email": "user@example.com",                         │
│       "name": "John Doe",                                  │
│       "username": "johndoe"                                │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MIDDLEWARE: ClerkExpressRequireAuth()                      │
├─────────────────────────────────────────────────────────────┤
│  1. Validates JWT token from Authorization header           │
│  2. Extracts userId from token                              │
│  3. Sets req.auth = { userId, sessionId, ... }             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MIDDLEWARE: attachClerkUser()                              │
├─────────────────────────────────────────────────────────────┤
│  1. Reads req.auth.userId                                   │
│  2. Sets req.clerkUserId = userId                          │
│  3. Sets req.clerkUser = req.auth (for reference)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER: syncUser()                                     │
├─────────────────────────────────────────────────────────────┤
│  1. Get clerkUserId from req.clerkUserId (middleware)       │
│  2. Get { email, name, username } from req.body (frontend)  │
│  3. UPSERT in database:                                     │
│     - If user with clerkId exists → UPDATE                  │
│     - If not → CREATE new user                              │
│  4. Return database user object                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE: User data from PostgreSQL                        │
├─────────────────────────────────────────────────────────────┤
│  {                                                           │
│    "id": "db-uuid-123",                                     │
│    "clerkId": "user_abc123",                               │
│    "email": "user@example.com",                            │
│    "name": "John Doe",                                     │
│    "createdAt": "2025-12-02T...",                          │
│    "lastUpdated": "2025-12-02T..."                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: UserSync stores user.id in AsyncStorage          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 **Key Learnings**

### **1. JWT Tokens vs. User Data**
- **JWT Token** (`req.auth`): Contains only **claims** (userId, sessionId, etc.)
- **User Profile**: Full user data (email, name, avatar) must come from:
  - Frontend: `useUser()` hook
  - Backend: Clerk API or request body

### **2. Data Source Strategy**
```
┌──────────────────┬─────────────────┬──────────────────┐
│ Data Type        │ Source          │ Method           │
├──────────────────┼─────────────────┼──────────────────┤
│ User ID (Auth)   │ JWT Token       │ req.auth.userId  │
│ User Profile     │ Request Body    │ req.body.email   │
│ Validation       │ Middleware      │ Clerk SDK        │
└──────────────────┴─────────────────┴──────────────────┘
```

### **3. Why This Approach?**
- ✅ **Frontend has full user data**: Clerk's `useUser()` provides complete profile
- ✅ **Backend validates auth**: JWT token proves identity
- ✅ **No extra API calls**: No need to fetch user from Clerk API on backend
- ✅ **Single source of truth**: Frontend already loaded the user data

---

## 🧪 **Testing the Fix**

### **Step 1: Start Backend**
```bash
cd backend
npm run dev
```

### **Step 2: Watch Backend Logs**
You should now see detailed logs:
```
=== SYNC USER REQUEST ===
Request Body: { clerkId: 'user_abc123', email: 'user@example.com', name: 'John Doe', username: 'johndoe' }
Clerk User ID (from middleware): user_abc123
Extracted Data: { clerkUserId: 'user_abc123', email: 'user@example.com', name: 'John Doe', username: 'johndoe' }
User does not exist - creating new user
User created successfully: { id: 'uuid-123', clerkId: 'user_abc123', ... }
=== SYNC COMPLETE ===
```

### **Step 3: Start Frontend**
```bash
cd frontend/intouch-frontend
npm start
```

### **Step 4: Sign In/Sign Up**
1. Sign in or sign up with a test account
2. After authentication, UserSync will run automatically
3. Check frontend console for: `"Syncing user to backend: { userId, email, name, username }"`
4. Check backend console for sync logs

### **Step 5: Verify Database**
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 1;
```

Should show your newly created/updated user with:
- `clerkId` populated
- `email` populated
- `name` populated
- `createdAt` and `lastUpdated` timestamps

---

## ✅ **Success Indicators**

After this fix, you should see:

**Frontend Console:**
```
Syncing user to backend: { userId: 'user_abc123', email: '...', name: '...', username: '...' }
User synced successfully: { id: 'uuid-123', clerkId: 'user_abc123', ... }
```

**Backend Console:**
```
=== SYNC USER REQUEST ===
Request Body: { clerkId: '...', email: '...', name: '...', username: '...' }
User created successfully: { id: '...', clerkId: '...', email: '...', name: '...' }
=== SYNC COMPLETE ===
```

**Database:**
```
User record exists with correct clerkId, email, and name
```

**No More Errors:**
- ❌ 400 errors gone
- ❌ "Email not found" errors gone
- ✅ User synced to database successfully

---

## 📝 **Summary**

| Aspect | Before (❌) | After (✅) |
|--------|------------|-----------|
| **Frontend sends** | Empty POST | JSON body with user data |
| **Backend reads from** | req.auth (JWT) | req.body (request payload) |
| **Email source** | JWT token (undefined) | Request body from Clerk user |
| **Error handling** | Generic 400 | Detailed logs + error info |
| **Debugging** | No logs | Comprehensive console logs |

**Result**: UserSync now properly syncs Clerk users to your PostgreSQL database with complete user information! 🎉


# 🔧 UserSync Race Condition Fix

## 🐛 **The Problem**

### **Race Condition Scenario:**

```
Time: 0ms  - Effect runs, synced = false, starts Sync A
Time: 50ms - getToken() is recreated (React re-render)
Time: 51ms - Effect re-runs, synced = false (still!), starts Sync B
Time: 100ms - Sync A completes, sets synced = true
Time: 150ms - Sync B completes (duplicate!)
```

### **What Went Wrong:**

```typescript
// ❌ BEFORE - Only checks synced state
const [synced, setSynced] = useState(false);

useEffect(() => {
  const syncUser = async () => {
    if (!isSignedIn || !userId || !user || synced) return;
    // ^ Only prevents re-run AFTER completion
    
    // If effect re-runs while sync is in progress,
    // synced is still false, so another sync starts!
    
    try {
      await fetch(...); // Long-running operation
      setSynced(true); // Only set after completion
    } catch (error) {
      setSynced(true);
    }
  };
  
  syncUser();
}, [isSignedIn, userId, user, getToken, synced, onSyncComplete]);
// ^ getToken can be recreated during render, causing re-run
```

### **Consequences:**

1. **Concurrent Backend Requests**: Multiple POST requests to `/api/sync-user`
2. **Database Constraint Violations**: If UPSERT isn't perfectly idempotent
3. **Race Conditions**: First request updates, second request might overwrite with stale data
4. **Resource Waste**: Unnecessary network calls and database operations
5. **Potential 409 Conflicts**: Email constraint violations if timing is wrong

---

## ✅ **The Solution**

### **Use a Ref to Track In-Progress Syncs:**

```typescript
// ✅ AFTER - Use ref to prevent concurrent syncs
const [synced, setSynced] = useState(false);
const syncingRef = useRef(false); // ← NEW: Track in-progress sync

useEffect(() => {
  const syncUser = async () => {
    // Check BOTH synced AND syncingRef
    if (!isSignedIn || !userId || !user || synced || syncingRef.current) return;
    // ^ Prevents concurrent syncs AND re-syncing after completion
    
    // Mark sync as in progress
    syncingRef.current = true;
    
    try {
      await fetch(...);
      setSynced(true);
    } catch (error) {
      setSynced(true);
    } finally {
      // Always clear the syncing flag (success or error)
      syncingRef.current = false;
    }
  };
  
  syncUser();
}, [isSignedIn, userId, user, getToken, synced, onSyncComplete]);
```

---

## 🔍 **How It Works**

### **Timeline With Fix:**

```
Time: 0ms   - Effect runs
            - synced = false, syncingRef.current = false
            - Enters syncUser()
            - Sets syncingRef.current = true
            - Starts Sync A

Time: 50ms  - getToken() is recreated (React re-render)
Time: 51ms  - Effect re-runs
            - synced = false, but syncingRef.current = true!
            - Returns early, NO Sync B started ✅

Time: 100ms - Sync A completes
            - Sets synced = true
            - Sets syncingRef.current = false (in finally)

Time: 150ms - Effect could re-run again
            - synced = true, returns early ✅
```

### **Key Differences:**

| Aspect | Before (❌) | After (✅) |
|--------|------------|-----------|
| **Tracks completion** | Yes (state) | Yes (state) |
| **Tracks in-progress** | No | Yes (ref) |
| **Prevents concurrent syncs** | No | Yes |
| **Cleanup on error** | Yes | Yes (finally) |
| **React re-renders** | Triggers new sync | Blocked during sync |

---

## 🎯 **Why Use a Ref?**

### **State vs. Ref:**

```typescript
// ❌ Using State - Doesn't work!
const [syncing, setSyncing] = useState(false);

useEffect(() => {
  if (syncing) return; // Checks old state value
  setSyncing(true);    // Update queued, not immediate
  await longOperation();
  setSyncing(false);
  // ^ If effect re-runs before this, syncing is still false!
}, [deps, syncing]); // syncing in deps causes infinite loop
```

```typescript
// ✅ Using Ref - Works perfectly!
const syncingRef = useRef(false);

useEffect(() => {
  if (syncingRef.current) return; // Checks current value immediately
  syncingRef.current = true;      // Updates immediately, no re-render
  await longOperation();
  syncingRef.current = false;
  // ^ If effect re-runs during operation, ref is already true
}, [deps]); // No ref in deps, no infinite loop
```

### **Ref Benefits:**

1. **Immediate Updates**: Changes are instant, not queued like state
2. **No Re-renders**: Updating ref doesn't trigger React re-render
3. **Synchronous**: Value is immediately available in the same render
4. **No Dependency Issues**: Don't need to add ref to dependency array
5. **Mutable**: Can be updated inside async functions without closures

---

## 🧪 **Testing the Fix**

### **Scenario 1: Normal Flow**
```
1. User signs in
2. Effect runs, syncingRef = true, starts sync
3. Sync completes successfully
4. syncingRef = false, synced = true
✅ User synced once
```

### **Scenario 2: Effect Re-runs During Sync**
```
1. User signs in
2. Effect runs, syncingRef = true, starts sync
3. React re-renders (getToken recreated)
4. Effect re-runs, syncingRef is true → returns early
5. Original sync completes
6. syncingRef = false, synced = true
✅ User synced once (duplicate prevented)
```

### **Scenario 3: Sync Fails**
```
1. User signs in
2. Effect runs, syncingRef = true, starts sync
3. Network error occurs
4. Catch block sets synced = true (don't block UI)
5. Finally block sets syncingRef = false
✅ Error handled, flag cleared, UI not blocked
```

### **Scenario 4: Multiple Fast Re-renders**
```
1. Effect runs, syncingRef = true, starts sync
2. Re-render 1 → syncingRef = true, returns early
3. Re-render 2 → syncingRef = true, returns early
4. Re-render 3 → syncingRef = true, returns early
5. Original sync completes
6. syncingRef = false, synced = true
✅ Only one sync, all duplicates blocked
```

---

## 📝 **Code Changes Summary**

### **Added:**
```typescript
import { useEffect, useState, useRef } from 'react'; // ← Added useRef

const syncingRef = useRef(false); // ← NEW: Track in-progress sync
```

### **Modified:**
```typescript
// Check syncingRef.current to prevent concurrent syncs
if (!isSignedIn || !userId || !user || synced || syncingRef.current) return;

// Mark sync as in progress
syncingRef.current = true;

// ... sync logic ...

} finally {
  // Always clear the syncing flag when done (success or error)
  syncingRef.current = false;
}
```

---

## 🔐 **Why This Matters**

### **Without This Fix:**
- Multiple sync requests could hit backend simultaneously
- Database UPSERT operations could conflict
- Email unique constraint could throw 409 errors
- Wasted network bandwidth and server resources
- Potential data inconsistency if one request fails

### **With This Fix:**
- ✅ Only one sync runs at a time
- ✅ No concurrent database operations
- ✅ No race conditions
- ✅ Clean, predictable behavior
- ✅ Efficient resource usage

---

## 🎓 **General Pattern**

This pattern is useful for any async operation in useEffect:

```typescript
function Component() {
  const operationInProgressRef = useRef(false);
  
  useEffect(() => {
    const doAsyncOperation = async () => {
      if (operationInProgressRef.current) return;
      
      operationInProgressRef.current = true;
      
      try {
        await longRunningOperation();
      } finally {
        operationInProgressRef.current = false;
      }
    };
    
    doAsyncOperation();
  }, [dependencies]);
}
```

**Use this pattern when:**
- Async operation takes time to complete
- Effect dependencies might change during operation
- Concurrent executions would cause problems
- You need to prevent race conditions

---

## ✅ **Verification**

The fix is complete and safe:
- ✅ No linter errors
- ✅ Ref properly initialized to `false`
- ✅ Ref set to `true` before async operation
- ✅ Ref cleared in `finally` block (always runs)
- ✅ Early return checks ref value
- ✅ No dependency array issues

**Result**: UserSync now safely prevents concurrent syncs! 🎉


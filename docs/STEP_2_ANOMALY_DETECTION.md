# STEP 2: Add Anomaly Detection - Complete ✅

**Date:** 2024-01-XX  
**Status:** ✅ Complete

---

## 📋 Summary

Anomaly detection has been successfully implemented to track and block suspicious login attempts. The system monitors failed login attempts per wallet address and temporarily blocks wallets that exceed the threshold.

---

## ✅ Changes Made

### 1. Created AnomalyDetectionService (`src/modules/auth/anomaly-detection.service.ts`)
- ✅ Tracks failed login attempts per wallet address
- ✅ Implements time-window based tracking (1 hour)
- ✅ Maximum 5 failed attempts per hour
- ✅ Automatic blocking when threshold exceeded
- ✅ Automatic reset on successful login
- ✅ Comprehensive logging of suspicious activity
- ✅ Wallet address redaction in logs (shows only last 6 chars)

### 2. Integrated into AuthModule (`src/modules/auth/auth.module.ts`)
- ✅ Added `AnomalyDetectionService` to providers

### 3. Integrated into AuthService (`src/modules/auth/auth.service.ts`)
- ✅ Checks if wallet is blocked before verification
- ✅ Records failed attempts on authentication failures
- ✅ Resets counter on successful login
- ✅ Uses `ForbiddenException` for blocked wallets

---

## 🔒 Anomaly Detection Configuration

### Thresholds
- **Max Failed Attempts:** 5 per wallet
- **Time Window:** 1 hour (60 minutes)
- **Block Duration:** Until time window expires (1 hour from first attempt)

### Behavior
1. **First Failed Attempt:** Recorded, no blocking
2. **2-4 Failed Attempts:** Recorded, warning logged, no blocking
3. **5+ Failed Attempts:** Wallet is blocked, `ForbiddenException` thrown
4. **Successful Login:** Counter is reset immediately
5. **Time Window Expires:** Counter automatically clears after 1 hour

---

## 📊 How It Works

### Flow Diagram

```
User attempts login
    ↓
Check if wallet is blocked
    ↓ (if blocked)
Return 403 Forbidden
    ↓ (if not blocked)
Verify signature
    ↓ (if verification fails)
Record failed attempt
    ↓
Check if threshold exceeded
    ↓ (if exceeded)
Block wallet for 1 hour
    ↓ (if verification succeeds)
Reset failed attempts counter
    ↓
Return JWT token
```

### Storage
- **Current Implementation:** In-memory Map (suitable for single-instance deployments)
- **Production Consideration:** For multi-instance deployments, consider Redis-based storage

---

## 🚨 Error Responses

### Blocked Wallet (403 Forbidden)
```json
{
  "statusCode": 403,
  "message": "Too many failed login attempts. Please try again later."
}
```

### Failed Login Attempts (401 Unauthorized)
- Standard authentication errors still return 401
- Failed attempts are recorded in the background

---

## 📝 Logging

### Log Levels

1. **Warning - Failed Attempt:**
   ```
   Failed login attempt for wallet ***abc123. Total attempts: 3/5
   ```

2. **Warning - Suspicious Activity (3+ attempts):**
   ```
   Suspicious activity detected: Wallet ***abc123 has 4 failed login attempts in the last hour.
   ```

3. **Warning - Wallet Blocked:**
   ```
   Wallet ***abc123 is temporarily blocked due to 5 failed login attempts. Unblocks in 45 minutes.
   ```

4. **Info - Reset on Success:**
   ```
   [AnomalyDetectionService] Resetting failed login attempts for wallet ***abc123 after successful login.
   ```

### Security Features
- ✅ Wallet addresses are redacted in logs (only last 6 chars shown)
- ✅ All suspicious activity is logged with context

---

## 🧪 Testing Checklist

### Manual Testing Required:

- [ ] **Test Normal Login Flow**
  - Make 1 successful login → Should work
  - Counter should be reset

- [ ] **Test Failed Attempts**
  - Make 1 failed login (wrong signature) → Should record attempt
  - Make 2nd failed login → Should record (2/5)
  - Make 3rd failed login → Should log suspicious activity
  - Make 4th failed login → Should record (4/5)
  - Make 5th failed login → Should record (5/5)
  - Make 6th failed login → Should return 403 Forbidden

- [ ] **Test Blocking**
  - After 5 failed attempts, try to login → Should return 403
  - Check logs → Should show blocking message with time until unblock

- [ ] **Test Time Window Expiry**
  - Make 5 failed attempts
  - Wait 1 hour
  - Try to login → Should work (counter cleared)

- [ ] **Test Reset on Success**
  - Make 3 failed attempts
  - Make 1 successful login → Counter should reset
  - Make 1 failed login → Should show 1/5 (not 4/5)

- [ ] **Test Logging**
  - Check logs for failed attempts
  - Check logs for suspicious activity (3+ attempts)
  - Check logs for blocking messages
  - Verify wallet addresses are redacted

---

## 📝 Code Changes

### New File: `src/modules/auth/anomaly-detection.service.ts`

Key methods:
- `isBlocked(walletAddress)` - Check if wallet is blocked
- `recordFailedAttempt(walletAddress)` - Record a failed attempt
- `resetFailedAttempts(walletAddress)` - Reset counter on success
- `getFailedAttemptsCount(walletAddress)` - Get current count

### `src/modules/auth/auth.service.ts`

**Before verification:**
```typescript
if (this.anomalyDetection.isBlocked(normalizedAddress)) {
  throw new ForbiddenException(
    'Too many failed login attempts. Please try again later.',
  );
}
```

**On verification failure:**
```typescript
if (!challenge) {
  this.anomalyDetection.recordFailedAttempt(normalizedAddress);
  throw new UnauthorizedException('Challenge not found or expired.');
}
```

**On successful login:**
```typescript
this.anomalyDetection.resetFailedAttempts(normalizedAddress);
```

---

## ⚠️ Important Notes

1. **In-Memory Storage:** Current implementation uses in-memory Map
   - Works for single-instance deployments
   - For production with multiple instances, consider Redis

2. **Time Window:** 1-hour rolling window from first failed attempt
   - Counter resets automatically after 1 hour
   - Each new failed attempt extends the window

3. **Wallet Normalization:** All wallet addresses are normalized to lowercase
   - Ensures consistent tracking regardless of input format

4. **Error Handling:** Uses `ForbiddenException` (403) for blocked wallets
   - Different from `UnauthorizedException` (401) for auth failures
   - Clear distinction between blocked vs. invalid credentials

5. **Logging Security:** Wallet addresses are redacted in logs
   - Only last 6 characters shown: `***abc123`
   - Protects user privacy while maintaining debugging capability

---

## 🔄 Next Steps

- ✅ Step 2 Complete - Anomaly Detection
- ⏭️ Step 3 - Standard Response Format

---

## 📚 Implementation Details

### Data Structure
```typescript
interface FailedAttempt {
  count: number;           // Number of failed attempts
  firstAttemptAt: Date;    // Timestamp of first attempt
  lastAttemptAt: Date;     // Timestamp of last attempt
}
```

### Storage
```typescript
private readonly failedAttempts = new Map<string, FailedAttempt>();
```

### Key Logic
- Time window check: `now - firstAttemptAt < 1 hour`
- Threshold check: `count >= 5`
- Auto-cleanup: Removes expired entries on access

---

**Status:** ✅ Complete  
**Build:** ✅ Successful  
**Ready for Step 3:** ✅


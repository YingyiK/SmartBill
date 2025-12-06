# SmartBill Backend Testing Guide

## 🎯 Quick Start

### 1. Update Database Schema
```bash
cd backend/auth_service
source venv/bin/activate
python init_db.py
```

### 2. Start Auth Service
```bash
# Make sure service is running
python -m uvicorn main:app --reload --port 6000
```

### 3. Run Complete Flow Test
```bash
python test_complete_flow.py
```

---

## 🧪 What the Test Covers

### Complete User Journey:
1. ✅ **User Registration** (Alice & Bob)
   - Email verification
   - Account creation
   - Token generation

2. ✅ **Bidirectional Friendships**
   - Alice adds Bob → **Both become friends automatically**
   - Verifies both can see each other in contacts

3. ✅ **Expense Creation**
   - Alice creates $50 Pizza Palace bill
   - 5 items included

4. ✅ **Expense Splitting**
   - Alice splits with Bob
   - Bob owes $25
   - Specific items assigned

5. ✅ **Email Notifications**
   - Beautiful split bill email sent to Bob
   - Professional design with all details

6. ✅ **Shared Expense Viewing**
   - Bob can see expenses shared with him
   - Full access to expense details

---

## 📝 Test Output Example

```
================================================================================
🧪 SmartBill Complete Flow Test
================================================================================

[Step 1] Register User A (Alice)
   Registering alice@test.com...
ℹ️  Verification code sent. Check terminal running auth_service (port 6000)
   Enter verification code for alice@test.com: 123456
✅ Registered alice@test.com

[Step 2] Register User B (Bob)
   Registering bob@test.com...
ℹ️  Verification code sent. Check terminal running auth_service (port 6000)
   Enter verification code for bob@test.com: 789012
✅ Registered bob@test.com

[Step 3] Alice adds Bob to contacts (auto bidirectional)
✅ Added bob@test.com to contacts (auto bidirectional)

[Step 4] Verify bidirectional contact relationship
   Alice's contacts: 1 friend(s)
      • bob@test.com
   Bob's contacts: 1 friend(s)
      • alice@test.com
✅ Bidirectional contacts verified!

[Step 5] Alice creates expense at Pizza Palace
✅ Created expense at Pizza Palace
   Total: $50.00
   Items: 5 items

[Step 6] Alice creates expense splits
✅ Created expense splits
   Bob owes: $25.00

[Step 7] Get expense splits
✅ Found 1 split(s)
   Bob: $25.00

[Step 8] Alice sends bill email to Bob
ℹ️  Check Bob's email inbox for the bill!
✅ Sent bills to 1 participant(s)
   ✉️  Bob: Email sent to bob@test.com

[Step 9] Bob views expenses shared with him
   Bob's shared expenses: 1 expense(s)
      • Pizza Palace: $50.00
✅ Bob can see the expense!

================================================================================
📊 Test Summary
================================================================================
✅ All steps completed successfully!

✅ Verified features:
   • User registration with email verification
   • Auto bidirectional contact adding
   • Expense creation
   • Expense splitting
   • Bill email sending
   • Shared expense viewing

📧 Email Status:
   • Check bob@test.com inbox for beautiful split bill email
   • Subject: 'SmartBill - You owe $25.00 for Pizza Palace'

💾 Database Status:
   • 2 users registered
   • 2 bidirectional contacts
   • 1 expense created
   • 1 split created
   • 1 email sent

================================================================================
                        🎉 ALL TESTS PASSED! 🎉
================================================================================

✨ Backend is ready for frontend integration!
```

---

## 🔍 Key Features Tested

### 1. Auto Bidirectional Contacts ✨ NEW!
When Alice adds Bob:
- Alice → Bob contact created
- Bob → Alice contact **automatically created**
- No manual acceptance needed
- Both can see each other immediately

### 2. Shared Expense Viewing ✨ NEW!
New API endpoint: `GET /expenses/shared-with-me`
- Bob can see expenses where he's a participant
- Even though Alice created them
- Full expense details visible
- Only creator (Alice) can modify

### 3. Email Notifications
Beautiful professional emails with:
- 💸 Orange gradient design
- Large amount owed display
- Expense details (store, date, payer)
- Specific items breakdown
- Payment instructions

---

## 🐛 Troubleshooting

### Database Errors
```bash
# Recreate tables
cd backend/auth_service
source venv/bin/activate
python init_db.py
```

### "User already registered"
The test uses fixed email addresses. Either:
1. Delete users from database
2. Change email addresses in `test_complete_flow.py`

### "Cannot connect to service"
```bash
# Check if auth_service is running
curl http://localhost:6000/health

# If not, start it:
cd backend/auth_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 6000
```

### Email not received
Check:
1. SMTP configuration in `.env`
2. Spam folder
3. Console output (verification codes printed if SMTP not configured)

---

## 📚 Other Test Scripts

### test_email.py
Tests verification email sending
```bash
python test_email.py
```

### test_bill_email_advanced.py
Tests receipt emails with multiple samples
```bash
python test_bill_email_advanced.py
```

---

## 🎯 What to Test Next

After backend tests pass:
1. **Frontend Development** - Connect UI to APIs
2. **Integration Testing** - Test frontend + backend together
3. **Edge Cases** - Test error scenarios
4. **Performance** - Test with many users/expenses

---

## ✅ Success Criteria

Backend is ready when:
- [x] All users can register with email
- [x] Friends auto-add bidirectionally
- [x] Expenses can be created
- [x] Splits can be configured
- [x] Emails send successfully
- [x] Participants can view shared expenses
- [x] Only creators can modify expenses

**Status: ✅ ALL READY FOR FRONTEND!**

---

## 💡 Tips

1. **Run test multiple times** - Make sure it's consistent
2. **Check database** - Verify data is saved correctly
3. **Check emails** - Verify beautiful design
4. **Test edge cases** - Try invalid inputs
5. **Clean up** - Delete test users between tests if needed

---

## 🚀 Next Steps

1. ✅ Backend tested and working
2. → Connect frontend to these APIs
3. → Build UI for contacts management
4. → Build UI for expense splitting
5. → Build UI for sending bills
6. → Deploy and celebrate! 🎉



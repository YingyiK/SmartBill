# SmartBill - Expense Split & Bill Sending Guide

Complete guide for the expense splitting and bill email system.

## 📋 Overview

The system allows users to:
1. **Add friends** to their contacts (must be registered users)
2. **Create expenses** with items
3. **Split expenses** among participants
4. **Send bill emails** to selected friends with detailed breakdown

---

## 🗄️ Database Structure

### New Tables

#### 1. `contacts` - User's Contact List
```sql
- id (UUID)
- user_id (UUID) - Owner of the contact list
- friend_user_id (UUID) - Friend's user ID (must be registered)
- nickname (String) - Optional nickname
- created_at (DateTime)
```

#### 2. `expense_splits` - Expense Split Details
```sql
- id (UUID)
- expense_id (UUID) - Related expense
- participant_name (String)
- participant_email (String)
- contact_id (UUID) - Link to contact if registered
- amount_owed (Decimal) - How much this person owes
- items_detail (JSON) - List of items they're paying for
- is_paid (Boolean) - Payment status
- email_sent (Boolean) - Email sent status
- email_sent_at (DateTime)
- created_at (DateTime)
```

---

## 🚀 API Endpoints

### Contact Management

#### 1. Add a Friend to Contacts
```http
POST /contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "friend_email": "friend@example.com",
  "nickname": "John"  // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "friend_user_id": "uuid",
  "friend_email": "friend@example.com",
  "nickname": "John",
  "created_at": "2024-12-05T..."
}
```

#### 2. Get Contact List
```http
GET /contacts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "friend_user_id": "uuid",
      "friend_email": "friend@example.com",
      "nickname": "John",
      "created_at": "2024-12-05T..."
    }
  ],
  "total": 1
}
```

#### 3. Delete a Contact
```http
DELETE /contacts/{contact_id}
Authorization: Bearer <token>
```

---

### Expense Split Management

#### 1. Create Expense Splits
```http
POST /expenses/{expense_id}/splits
Authorization: Bearer <token>
Content-Type: application/json

{
  "expense_id": "uuid",
  "participants": [
    {
      "name": "John",
      "email": "john@example.com",  // optional
      "contact_id": "uuid",  // optional, if friend is in contacts
      "amount_owed": 15.50,
      "items_detail": ["Pizza", "Soda"]  // optional
    },
    {
      "name": "Alice",
      "contact_id": "uuid",
      "amount_owed": 20.00,
      "items_detail": ["Salad", "Wine"]
    }
  ]
}
```

#### 2. Get Expense Splits
```http
GET /expenses/{expense_id}/splits
Authorization: Bearer <token>
```

**Response:**
```json
{
  "splits": [
    {
      "id": "uuid",
      "expense_id": "uuid",
      "participant_name": "John",
      "participant_email": "john@example.com",
      "contact_id": "uuid",
      "amount_owed": 15.50,
      "items_detail": "[\"Pizza\", \"Soda\"]",
      "is_paid": false,
      "email_sent": false,
      "email_sent_at": null,
      "created_at": "2024-12-05T..."
    }
  ],
  "total": 1
}
```

#### 3. Send Bills to Participants
```http
POST /expenses/{expense_id}/send-bills
Authorization: Bearer <token>
Content-Type: application/json

{
  "expense_id": "uuid",
  "participant_ids": ["split_id_1", "split_id_2"]
}
```

**Response:**
```json
{
  "sent_count": 2,
  "failed_count": 0,
  "results": [
    {
      "participant_id": "uuid",
      "participant_name": "John",
      "status": "sent",
      "message": "Email sent to john@example.com"
    },
    {
      "participant_id": "uuid",
      "participant_name": "Alice",
      "status": "sent",
      "message": "Email sent to alice@example.com"
    }
  ]
}
```

---

## 📧 Email Template

The split bill email includes:

- **Orange gradient header** with "Bill Split Request"
- **Large amount owed** in highlighted box
- **Expense details**: Store, total, date, payer
- **Items breakdown**: What items the participant is paying for
- **Payment instructions**: How to settle the bill
- **Professional footer**

### Example Email Preview:
```
┌─────────────────────────────────────────┐
│     💸 Bill Split Request               │
│        From John Doe                    │
├─────────────────────────────────────────┤
│                                         │
│  Hi Alice,                              │
│  John paid for a recent expense at      │
│  Pizza Palace and is requesting         │
│  your share of the bill.                │
│                                         │
│  ┌───────────────────────────┐         │
│  │   Your Share              │         │
│  │       $20.00              │         │
│  └───────────────────────────┘         │
│                                         │
│  📋 Expense Details                     │
│  Store: Pizza Palace                    │
│  Total Bill: $50.00                     │
│  Date: December 5, 2024                 │
│  Paid by: John                          │
│                                         │
│  🛒 Your Items                          │
│  • Caesar Salad                         │
│  • Glass of Wine                        │
│                                         │
│  💳 Payment Instructions                │
│  Please settle this amount with John    │
│  directly.                              │
└─────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow

### Step 1: User Registration & Login
```bash
# Both users register
POST /send-verification-code {"email": "user1@example.com"}
POST /register {"email": "user1@example.com", "password": "...", "verification_code": "123456"}

POST /send-verification-code {"email": "user2@example.com"}
POST /register {"email": "user2@example.com", "password": "...", "verification_code": "456789"}
```

### Step 2: Add Friends to Contacts
```bash
# User1 adds User2 as contact
POST /contacts
{
  "friend_email": "user2@example.com",
  "nickname": "Alice"
}
```

### Step 3: Create an Expense
```bash
POST /expenses
{
  "store_name": "Pizza Palace",
  "total_amount": 50.00,
  "subtotal": 45.00,
  "tax_amount": 5.00,
  "items": [
    {"name": "Large Pizza", "price": 25.00, "quantity": 1},
    {"name": "Caesar Salad", "price": 10.00, "quantity": 1},
    {"name": "Soda", "price": 5.00, "quantity": 2},
    {"name": "Wine", "price": 10.00, "quantity": 1}
  ],
  "participants": [
    {"name": "Me", "items": []},
    {"name": "Alice", "items": []}
  ]
}
# Returns: {"id": "expense_uuid", ...}
```

### Step 4: Create Expense Splits
```bash
POST /expenses/{expense_id}/splits
{
  "expense_id": "expense_uuid",
  "participants": [
    {
      "name": "Alice",
      "contact_id": "contact_uuid",
      "amount_owed": 20.00,
      "items_detail": ["Caesar Salad", "Wine"]
    },
    {
      "name": "Bob",
      "email": "bob@example.com",
      "amount_owed": 15.00,
      "items_detail": ["Soda x2"]
    }
  ]
}
```

### Step 5: Get Splits & Select Recipients
```bash
GET /expenses/{expense_id}/splits
# Returns list of splits with IDs
```

### Step 6: Send Bills
```bash
POST /expenses/{expense_id}/send-bills
{
  "expense_id": "expense_uuid",
  "participant_ids": ["split_id_1", "split_id_2"]
}
```

### Step 7: Participants Receive Emails
- Professional email with breakdown
- Clear amount owed
- Payment instructions
- Item details

---

## 🧪 Testing

### Update Database Schema
```bash
cd backend/auth_service
source venv/bin/activate
python init_db.py
```

### Test the APIs
```bash
# Use the existing test scripts or create new ones
python test_email.py  # Test verification emails
python test_bill_email_advanced.py  # Test receipt emails
```

### Testing with cURL
```bash
# 1. Register two users
# 2. Login and get tokens
# 3. Add contact
curl -X POST http://localhost:6000/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"friend_email": "friend@example.com"}'

# 4. Create expense (through API Gateway on port 5001)
# 5. Create splits
# 6. Send bills
```

---

## 💡 Frontend Integration

### Dashboard Flow

1. **Display Expenses**
   - Show all expenses with "Send Bills" button
   - Badge showing if bills already sent

2. **Split Configuration**
   - Modal to configure who owes what
   - Dropdown to select from contacts
   - Auto-calculate amounts

3. **Send Bills**
   - Multi-select checkbox for recipients
   - Preview email before sending
   - Confirmation toast

### Example UI Pseudocode:
```jsx
// Dashboard component
<ExpenseCard expense={expense}>
  <Button onClick={() => openSplitModal(expense)}>
    Split Bill
  </Button>
</ExpenseCard>

// Split Modal
<SplitModal expense={expense}>
  <ContactSelector contacts={contacts} />
  <AmountInput />
  <ItemsSelector items={expense.items} />
  <Button onClick={sendBills}>
    Send Bills to Selected
  </Button>
</SplitModal>
```

---

## 🔐 Security Notes

1. **Friend Verification**: Friends must be registered users
2. **Expense Ownership**: Only expense owner can create splits and send bills
3. **Email Validation**: Validates email addresses before sending
4. **Token Authentication**: All endpoints require valid JWT token

---

## 📊 Database Migration

If you have existing data, run:
```bash
python init_db.py  # Creates new tables without affecting existing data
```

New tables created:
- `contacts`
- `expense_splits`

---

## 🎯 Summary

The complete system flow:
1. ✅ **Register** → Users create accounts
2. ✅ **Add Contacts** → Build friend list (registered users only)
3. ✅ **Create Expense** → Record bill details
4. ✅ **Create Splits** → Define who owes what
5. ✅ **Send Bills** → Email selected friends with beautiful breakdown
6. ✅ **Track Status** → Monitor who's paid, who's received emails

All emails are professional, mobile-friendly, and include complete details!



# RxAegis API Documentation

This document provides detailed information about the RxAegis backend API, including Edge Functions, database operations, and authentication.

## 🌐 Base URLs

**Development**: `http://localhost:54321/functions/v1/`
**Production**: `https://crivnlflhgytzdtoydrm.supabase.co/functions/v1/`

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <JWT_TOKEN>
```

To obtain a token:
1. Sign in through the authentication flow
2. Token is automatically managed by Supabase client
3. Token is stored in localStorage

## 📡 Edge Functions

### 1. OCR Extract

Extracts text from medicine label images using OCR technology.

**Endpoint**: `POST /ocr-extract`

**Authentication**: Required

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response** (Success):
```json
{
  "success": true,
  "text": "Panadol Extra\nParacetamol 500mg + Caffeine 65mg\nGSK Pharmaceuticals",
  "confidence": 0.92,
  "processingTime": 1234
}
```

**Response** (Error):
```json
{
  "error": "Invalid image format",
  "details": "Image must be base64 encoded"
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid request
- `401` - Unauthorized
- `500` - Server error

**Usage Example**:
```typescript
import { supabase } from '@/integrations/supabase/client';

const extractText = async (imageBase64: string) => {
  const { data, error } = await supabase.functions.invoke('ocr-extract', {
    body: { image: imageBase64 }
  });
  
  if (error) throw error;
  return data;
};
```

---

### 2. Verify Medicine

Verifies medicine against the DRAP database and provides AI-powered risk assessment.

**Endpoint**: `POST /verify-medicine`

**Authentication**: Required

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
```json
{
  "medicineName": "Panadol",
  "extractedText": "Full OCR extracted text from medicine label"
}
```

**Response** (Medicine Found):
```json
{
  "status": "verified",
  "medicine": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Panadol",
    "generic_name": "Paracetamol",
    "manufacturer": "GSK Pharmaceuticals",
    "category": "Analgesic",
    "strength": ["500mg", "500mg + 65mg Caffeine"],
    "registration_number": "DRAP-PK-2023-12345",
    "barcode": "6291106481031",
    "authenticity_status": "verified",
    "who_approved": true,
    "side_effects": [
      "Nausea",
      "Stomach upset",
      "Allergic reactions (rare)"
    ],
    "alternatives": [
      "Calpol",
      "Disprol",
      "Fevadol"
    ],
    "created_at": "2024-01-15T10:30:00Z"
  },
  "verificationId": "987e6543-e21b-34c5-d654-321098765432"
}
```

**Response** (Medicine Not Found):
```json
{
  "status": "not_found",
  "analysis": {
    "isCounterfeit": true,
    "riskScore": 85,
    "reasoning": "The medicine name does not match any records in the official DRAP database. The lack of proper registration number and unverified manufacturer raises significant concerns about authenticity.",
    "recommendations": [
      "Do not consume this medicine",
      "Report to local health authorities",
      "Purchase from verified pharmacies only",
      "Check for proper packaging and seals"
    ]
  },
  "suggestedAlternatives": [
    "Panadol",
    "Calpol",
    "Disprol"
  ],
  "inferredCategory": "Analgesic",
  "verificationId": "987e6543-e21b-34c5-d654-321098765432"
}
```

**Risk Score Interpretation**:
- `0-30` - Low risk (green) - Likely safe
- `31-70` - Medium risk (yellow) - Exercise caution
- `71-100` - High risk (red) - Potentially dangerous

**Response** (Error):
```json
{
  "error": "Validation failed",
  "details": "Medicine name is required"
}
```

**Status Codes**:
- `200` - Success (both found and not found return 200)
- `400` - Invalid request
- `401` - Unauthorized
- `500` - Server error

**Usage Example**:
```typescript
const verifyMedicine = async (name: string, text: string) => {
  const { data, error } = await supabase.functions.invoke('verify-medicine', {
    body: {
      medicineName: name,
      extractedText: text
    }
  });
  
  if (error) throw error;
  
  if (data.status === 'verified') {
    console.log('Medicine found:', data.medicine);
  } else {
    console.log('Risk score:', data.analysis.riskScore);
  }
  
  return data;
};
```

---

### 3. Import Medicines

Bulk imports medicine data into the database (Admin only).

**Endpoint**: `POST /import-medicines`

**Authentication**: Required (Admin)

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
```json
{}
```

**Response** (Success):
```json
{
  "success": true,
  "inserted": 42,
  "errors": 0,
  "errorDetails": []
}
```

**Response** (Partial Success):
```json
{
  "success": true,
  "inserted": 35,
  "errors": 7,
  "errorDetails": [
    {
      "record": "Medicine Name",
      "error": "Duplicate key violation"
    }
  ]
}
```

**Response** (Error):
```json
{
  "error": "Unauthorized",
  "details": "Admin access required"
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `500` - Server error

**Usage Example**:
```typescript
const importMedicines = async () => {
  const { data, error } = await supabase.functions.invoke('import-medicines', {
    body: {}
  });
  
  if (error) throw error;
  console.log(`Imported ${data.inserted} medicines`);
  return data;
};
```

---

## 🗄️ Database API

### Tables

All database operations use Supabase client with automatic RLS enforcement.

#### Medicines Table

**Select All**:
```typescript
const { data, error } = await supabase
  .from('medicines')
  .select('*');
```

**Select with Filter**:
```typescript
const { data, error } = await supabase
  .from('medicines')
  .select('*')
  .ilike('name', '%panadol%');
```

**Select by ID**:
```typescript
const { data, error } = await supabase
  .from('medicines')
  .select('*')
  .eq('id', medicineId)
  .single();
```

**Insert** (Admin only):
```typescript
const { data, error } = await supabase
  .from('medicines')
  .insert({
    id: uuidv4(),
    name: 'Panadol',
    generic_name: 'Paracetamol',
    manufacturer: 'GSK',
    category: 'Analgesic',
    strength: ['500mg'],
    registration_number: 'DRAP-PK-2023-12345',
    barcode: '6291106481031',
    authenticity_status: 'verified',
    who_approved: true,
    side_effects: ['Nausea'],
    alternatives: ['Calpol']
  });
```

**Update** (Admin only):
```typescript
const { data, error } = await supabase
  .from('medicines')
  .update({ name: 'Updated Name' })
  .eq('id', medicineId);
```

**Delete** (Admin only):
```typescript
const { data, error } = await supabase
  .from('medicines')
  .delete()
  .eq('id', medicineId);
```

---

#### Verification History Table

**Select User's History**:
```typescript
const { data, error } = await supabase
  .from('verification_history')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

**Insert Verification**:
```typescript
const { data, error } = await supabase
  .from('verification_history')
  .insert({
    user_id: userId,
    medicine_name: 'Panadol',
    extracted_text: 'OCR text...',
    verification_status: 'verified',
    verified_data: { /* medicine data */ }
  });
```

---

#### Scan History Table

**Select User's Scans**:
```typescript
const { data, error } = await supabase
  .from('scan_history')
  .select('*')
  .eq('user_id', userId)
  .order('scanned_at', { ascending: false });
```

**Insert Scan**:
```typescript
const { data, error } = await supabase
  .from('scan_history')
  .insert({
    user_id: userId,
    scan_data: '1234567890123',
    scan_format: 'EAN_13'
  });
```

---

## 🔑 Authentication API

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});
```

### Sign In with Google

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User

```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

### Get Session

```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

---

## 📊 Realtime Subscriptions

### Subscribe to Verification History Changes

```typescript
const channel = supabase
  .channel('verification-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'verification_history',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

---

## 🚨 Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `PGRST116` | No rows found | Handle as empty result |
| `23505` | Unique violation | Check for duplicates |
| `23503` | Foreign key violation | Verify referenced records exist |
| `42501` | RLS policy violation | Check user permissions |
| `JWT expired` | Token expired | Re-authenticate user |

### Error Response Format

```typescript
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}
```

### Example Error Handling

```typescript
const handleError = (error: SupabaseError) => {
  switch (error.code) {
    case 'PGRST116':
      console.log('No data found');
      break;
    case '23505':
      console.error('Duplicate entry');
      break;
    case '42501':
      console.error('Permission denied');
      break;
    default:
      console.error('Error:', error.message);
  }
};
```

---

## 🔒 Row Level Security (RLS)

### Medicines Table

**SELECT**: Public read access
```sql
CREATE POLICY "Public read access"
ON medicines FOR SELECT
USING (true);
```

**INSERT/UPDATE/DELETE**: Admin only
```sql
CREATE POLICY "Admin write access"
ON medicines FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));
```

### Verification History

**SELECT**: Own records only
```sql
CREATE POLICY "Users can view own history"
ON verification_history FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT**: Own records only
```sql
CREATE POLICY "Users can insert own history"
ON verification_history FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Scan History

**SELECT**: Own records only
```sql
CREATE POLICY "Users can view own scans"
ON scan_history FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT**: Own records only
```sql
CREATE POLICY "Users can insert own scans"
ON scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 📈 Rate Limits

- **OCR Extract**: 60 requests per minute per user
- **Verify Medicine**: 60 requests per minute per user
- **Import Medicines**: 10 requests per hour (admin only)

Exceeding rate limits returns `429 Too Many Requests`.

---

## 🧪 Testing

### Using cURL

**OCR Extract**:
```bash
curl -X POST https://crivnlflhgytzdtoydrm.supabase.co/functions/v1/ocr-extract \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

**Verify Medicine**:
```bash
curl -X POST https://crivnlflhgytzdtoydrm.supabase.co/functions/v1/verify-medicine \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medicineName": "Panadol", "extractedText": "..."}'
```

### Using Postman

1. Set request type to `POST`
2. Enter endpoint URL
3. Add Authorization header: `Bearer YOUR_JWT_TOKEN`
4. Set body to raw JSON
5. Send request

---

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial API release
- OCR extraction endpoint
- Medicine verification with AI
- Bulk import functionality
- Complete CRUD for all tables
- RLS policies implemented

---

## 📞 Support

For API issues or questions:
- **GitHub Issues**: Technical problems
- **Discord**: [Lovable Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **Documentation**: [Lovable Docs](https://docs.lovable.dev)

---

*Last Updated: 2025-01-15*

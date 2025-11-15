# RxAegis - Medicine Verification System

A comprehensive web application for verifying the authenticity of medicines using OCR scanning and DRAP (Drug Regulatory Authority of Pakistan) database verification.

## 🌟 Features

### Core Functionality
- **Smart OCR Scanning**: Capture and extract text from medicine labels using camera or image upload
- **DRAP Verification**: Verify medicines against official DRAP database
- **Barcode Scanning**: Support for barcode/QR code scanning
- **Risk Assessment**: AI-powered counterfeit risk analysis
- **Verification History**: Track all medicine verification attempts
- **Scan History**: Maintain history of all scanned barcodes

### User Features
- **Authentication**: Secure email-based authentication with Google sign-in support
- **User Profiles**: Manage personal information and view account details
- **Dashboard**: Centralized view of recent activities and statistics
- **Responsive Design**: Fully responsive UI that works on all devices

### Admin Features
- **Medicine Database Import**: Bulk import medicine data from JSON
- **Database Management**: Full CRUD operations on medicine records

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - UI component library built on Radix UI

### Backend & Database
- **Supabase** (via Lovable Cloud)
  - PostgreSQL database
  - Authentication & Authorization
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Storage for file uploads

### Key Libraries
- **TanStack React Query** - Data fetching and caching
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **html5-qrcode** - QR/barcode scanning
- **@zxing/library** - Barcode processing
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **date-fns** - Date utilities

### AI Integration
- **Lovable AI Gateway** - AI-powered features using Google Gemini and OpenAI GPT-5

## 📁 Project Structure

```
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── CameraCapture.tsx
│   │   ├── Scanner.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Landing page
│   │   ├── Auth.tsx        # Authentication
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── Profile.tsx     # User profile
│   │   ├── ScanHistory.tsx # Barcode scan history
│   │   ├── VerificationHistory.tsx
│   │   └── ImportMedicines.tsx
│   ├── integrations/
│   │   └── supabase/       # Supabase client & types
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── data/               # Static data files
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── import-medicines/
│   │   ├── ocr-extract/
│   │   └── verify-medicine/
│   ├── migrations/         # Database migrations
│   └── config.toml        # Supabase configuration
└── public/                # Static assets
```

## 🗄️ Database Schema

### Tables

#### `medicines`
Stores verified medicine information from DRAP database.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Medicine name |
| generic_name | text | Generic/scientific name |
| manufacturer | text | Manufacturer name |
| category | text | Medicine category |
| strength | text[] | Available strengths |
| registration_number | text | DRAP registration number |
| barcode | text | Product barcode |
| authenticity_status | text | Verification status |
| who_approved | boolean | WHO approval status |
| side_effects | text[] | Known side effects |
| alternatives | text[] | Alternative medicines |
| created_at | timestamp | Record creation time |

#### `verification_history`
Tracks all medicine verification attempts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who performed verification |
| medicine_name | text | Medicine searched |
| extracted_text | text | OCR extracted text |
| verification_status | text | 'verified', 'not_found', 'error' |
| verified_data | jsonb | Full verification response |
| created_at | timestamp | Verification time |

#### `scan_history`
Records all barcode/QR code scans.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who performed scan |
| scan_data | text | Scanned barcode/QR data |
| scan_format | text | Format (QR_CODE, EAN_13, etc.) |
| scanned_at | timestamp | Scan time |
| created_at | timestamp | Record creation time |

## 🔐 Security

### Row Level Security (RLS)
All tables implement RLS policies:
- Users can only read/write their own data
- Authentication required for all operations
- Admin functions use service role for bulk operations

### Authentication
- Email/password authentication
- Google OAuth integration
- JWT-based session management
- Auto-confirm email signups (for non-production)

### API Security
- Edge functions validate JWT tokens
- CORS properly configured
- Sensitive operations require authentication
- Environment variables for secrets

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd rxaegis
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
The `.env` file is automatically configured with Lovable Cloud. It contains:
- `VITE_SUPABASE_URL` - Backend URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

4. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### First Time Setup

1. **Create an account** - Sign up with email on the `/auth` page
2. **Import medicine data** - Navigate to `/import-medicines` and run the import
3. **Start scanning** - Use the dashboard to scan and verify medicines

## 📱 Usage Guide

### For End Users

#### Scanning a Medicine
1. Navigate to the Dashboard
2. Click "Scan Medicine" or use the Scanner component
3. Allow camera permissions
4. Point camera at medicine label or barcode
5. Review extracted information
6. Submit for verification

#### Viewing Verification Results
- **Verified**: Shows complete medicine information, manufacturer, side effects, alternatives
- **Not Found**: Displays AI-powered risk assessment and suggested alternatives
- **Risk Score**: Color-coded indicator (green=safe, yellow=caution, red=danger)

#### History
- **Verification History**: View all past medicine verifications with full details
- **Scan History**: Review all barcode/QR scans with timestamps

### For Administrators

#### Importing Medicine Database
1. Navigate to `/import-medicines`
2. Click "Start Import"
3. Monitor progress
4. Review results (inserted count and errors)

The import process:
- Attempts server-side import via Edge Function (bypasses RLS)
- Falls back to client-side import if needed
- Uses upsert to handle duplicates
- Processes data in batches of 100

## 🔧 Edge Functions

### `ocr-extract`
Extracts text from images using OCR.

**Endpoint**: `/functions/v1/ocr-extract`

**Request**:
```json
{
  "image": "base64-encoded-image-data"
}
```

**Response**:
```json
{
  "text": "extracted text from image",
  "confidence": 0.95
}
```

### `verify-medicine`
Verifies medicine against DRAP database.

**Endpoint**: `/functions/v1/verify-medicine`

**Request**:
```json
{
  "medicineName": "Panadol",
  "extractedText": "full text from OCR"
}
```

**Response** (Found):
```json
{
  "status": "verified",
  "medicine": {
    "id": "uuid",
    "name": "Panadol",
    "manufacturer": "GSK",
    "category": "Analgesic",
    // ... full medicine details
  }
}
```

**Response** (Not Found):
```json
{
  "status": "not_found",
  "analysis": {
    "isCounterfeit": true,
    "riskScore": 85,
    "reasoning": "AI analysis...",
    "recommendations": ["..."]
  },
  "suggestedAlternatives": ["Medicine1", "Medicine2"]
}
```

### `import-medicines`
Bulk imports medicine data (admin only).

**Endpoint**: `/functions/v1/import-medicines`

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "inserted": 42,
  "errors": 0
}
```

## 🎨 Design System

### Color Tokens
All colors use HSL values and semantic tokens defined in `src/index.css`:

- `--background` - Page background
- `--foreground` - Primary text
- `--primary` - Brand color
- `--secondary` - Secondary surfaces
- `--accent` - Accent elements
- `--destructive` - Error states
- `--muted` - Muted surfaces

### Component Variants
UI components follow shadcn/ui patterns with custom variants:
- Buttons: default, destructive, outline, secondary, ghost, link
- Cards: default with hover states
- Badges: default, secondary, destructive, outline

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactive elements

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier-compatible formatting
- Functional React components with hooks

### Adding New Features

1. **New Page**:
   - Create component in `src/pages/`
   - Add route in `src/App.tsx`
   - Update navigation in `Header.tsx`

2. **New Edge Function**:
   - Create folder in `supabase/functions/`
   - Add `index.ts` with handler
   - Update `supabase/config.toml`
   - Deploy automatically on build

3. **Database Changes**:
   - Use Lovable Cloud migration tool
   - Write SQL in migration
   - Update RLS policies
   - Test with different user roles

## 📊 Performance Considerations

- **React Query** caching reduces API calls
- **Lazy loading** for routes and components
- **Optimized images** with proper formats
- **Edge Functions** deployed globally via Supabase
- **Database indexes** on frequently queried columns

## 🐛 Troubleshooting

### Import Errors
- **0 inserted, multiple errors**: Check RLS policies and authentication
- **Duplicate key errors**: Import uses upsert, should handle duplicates
- **Timeout**: Large imports handled in batches

### Scanning Issues
- **Camera not working**: Check browser permissions
- **Poor OCR results**: Ensure good lighting and clear image
- **Barcode not detected**: Try different angles or manual entry

### Authentication Issues
- **Can't sign up**: Email confirmation may be required (check settings)
- **Session expired**: Re-authenticate on `/auth` page
- **RLS violations**: Ensure user is logged in before operations

## 🚢 Deployment

### Via Lovable
1. Click "Publish" in top-right corner
2. Review changes
3. Click "Update" to deploy
4. Frontend deploys immediately
5. Edge functions deploy automatically

### Custom Domain
1. Go to Project Settings → Domains
2. Click "Connect Domain"
3. Follow DNS configuration steps
4. Wait for SSL certificate provisioning

### Self-Hosting
See [Lovable Self-Hosting Guide](https://docs.lovable.dev/tips-tricks/self-hosting)

## 📄 License

This project is built with Lovable and uses the following open-source technologies:
- React (MIT)
- Supabase (Apache 2.0)
- Tailwind CSS (MIT)
- shadcn/ui (MIT)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Links

- **Live App**: https://rxaegis-pill-check.vercel.app/
- **GitHub Repository**: https://github.com/muskaanfayyaz/rxaegis-pill-check

---

Built with ❤️ 

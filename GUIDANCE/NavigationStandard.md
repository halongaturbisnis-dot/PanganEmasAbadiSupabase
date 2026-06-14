# Referrer-Safe Navigation Standard

## Purpose
In a modular architecture, a Detail Page (e.g., `PembelianDetailPage`) might be accessed from various modules (e.g., `Pengadaan`, `Finansial`). Using a hardcoded static back-link causes a poor user experience when the user is forced into a flow they didn't come from.

## Protocol

### 1. Caller Side (Link Creation)
When navigating to a shared Detail or Form page from a different module, you MUST append the current path as a `referrer` query parameter.

**Example:**
```tsx
// From /finansial/pengeluaran to /pengadaan/pembelian/detail
navigate(`/pengadaan/pembelian/detail/${row.id}?referrer=/finansial/pengeluaran`);
```

### 2. Receiver Side (Handling "Back")
The target page MUST listen for the `referrer` parameter and use it for its "Back", "Delete-success", or "Close" navigation logic.

**Example Implementation:**
```tsx
import { useNavigate, useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const referrer = searchParams.get('referrer');
const navigate = useNavigate();

const handleBack = () => {
  // Use referrer if exists, otherwise fallback to standard module path
  navigate(referrer || '/pengadaan/pembelian');
};
```

## Mandatory Application
This pattern is MANDATORY for all cross-module transitions to maintain contextual integrity.

# Dynamic Tintz — Quote Builder (PWA)

Responsive, installable PWA for calculating square footage and pricing for Premium Ceramic and Solar Control films, applying shop-minimum logic, and generating a customer-ready email.

## Features
- Responsive layout for iPhone/iPad/desktop
- Editable line items (add/duplicate/delete) with live sqft math
- **Shop minimum**: ≤18 sq ft → $250 if ≤50 mi from 75409; $350 if >50 mi (no stacking with matrix pricing)
- **Matrices**: Ceramic and Solar Control tiers (editable from Settings)
- **Generate Email**: polished email with TSER 69%+ positioning for Ceramic and limited coverage language for Solar Control
- **PWA**: Manifest + Service Worker + icons (from your logo)

## Dev
```bash
npm install
npm run dev
```

## Build & Preview
```bash
npm run build
npm run preview
```

## Deploy
Any static host works (GitHub Pages, Netlify, Vercel, S3/CloudFront). iOS install is via Safari → Share → Add to Home Screen.


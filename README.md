# CCS Project - Frontend

## 📁 Struktur Folder

```
src/
├── api/                    # API configuration & axios instance
├── assets/                 # Static assets
│   └── styles/            # Global styles & CSS
├── components/            # Reusable components
│   ├── common/           # Common UI components (Navbar, Sidebar, Loading, etc)
│   ├── charts/           # Chart components
│   └── ui/               # UI primitives (future)
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── layouts/               # Layout components (Dashboard, User, etc)
├── pages/                 # Page components
│   ├── admin/            # Admin pages
│   ├── auth/             # Authentication pages
│   ├── forms/            # Form pages
│   ├── public/           # Public pages
│   ├── settings/         # Settings pages
│   └── user/             # User pages
├── routes/                # Route configuration & Protected routes
└── utils/                 # Utility functions & helpers
```

## 🎯 Naming Conventions

- **Components**: PascalCase (e.g., `LoadingSpinner.jsx`)
- **Contexts**: PascalCase with Context suffix (e.g., `AuthContext.jsx`)
- **Utils**: camelCase (e.g., `formatDate.js`)
- **Folders**: kebab-case or camelCase

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Main Dependencies

- React 18
- React Router v6
- Tailwind CSS v3
- Framer Motion (animations)
- Formik + Yup (forms)
- React Leaflet (maps)
- React Icons
- React Toastify
- Axios

## 🎨 Design System

### Colors
- Primary: Emerald/Teal gradient
- Dark Mode: Slate/Gray tones
- Accent: Cyan

### Components
- Glass morphism effects
- Premium gradients
- Smooth animations
- Responsive design (mobile-first)

## 🔐 Authentication

Uses JWT-based authentication with:
- Token refresh mechanism
- Protected routes
- Role-based access (admin/user)

## 📝 Code Style

- Use functional components with hooks
- Prefer named exports for utilities
- Use default exports for pages/components
- Keep components small and focused
- Extract reusable logic to custom hooks

## 🚀 Deployment

Backend API: https://apiccshbobwkigoazltg3hzsfcvh6xot4pure.soundofiwu.com/api

## 📄 License

Proprietary - CCS Project

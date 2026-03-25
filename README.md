# Invoice Simple

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)
![Neon](https://img.shields.io/badge/Neon-Database-00E599)

A beautifully modern, frontend-first invoice management dashboard. Create, track, and manage invoices with a sleek UI built on React, TailwindCSS, and shadcn/ui. Connects seamlessly and directly to Neon PostgreSQL, eliminating the need for a backend server!

## 🚀 Features

- **Beautiful Analytics Dashboard:** Visualize your revenue trends, invoice status breakdown, and top clients with interactive charts using Recharts.
- **Serverless Architecture:** A frontend-only web app that connects directly to the Neon PostgreSQL database via the Neon Data API. No Node API or containers required!
- **Data Export & Import:** Seamlessly migrate and backup your invoice data.
- **Modern Authentication:** Secure, lightweight, and modern UUID-based auth with Neon Auth integrations.
- **Premium Design Aesthetics:** Vibrant dark/light modes, interactive elements, micro-animations, and pixel-perfect typography (Inter & refined color palettes).
- **Type-safe:** Fully written in TypeScript for predictable and robust development.

## 🛠️ Technology Stack

- **Core:** [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech/)
- **Charts:** [Recharts](https://recharts.org/)
- **Routing:** [React Router](https://reactrouter.com/)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)

## 📦 Quick Start Quick Start

### 1. Database Setup (Neon)
1. Head over to [Neon Console](https://console.neon.tech/app/projects) and create a project.
2. Generate an API Key under **API Keys**.
3. Enable **Neon Auth** in the Auth tab, and add `http://localhost:5173` to your allowed origins.

### 2. Environment Variables
Create a `.env` file in the root folder based on the `.env.example` file (or create one):
```env
VITE_NEON_DATA_API_KEY=your_api_key_here
VITE_NEON_DATA_API_URL=https://your-project.neon.database.neon.tech/rest/v1
VITE_NEON_AUTH_URL=https://your-project.auth.neon.tech
```

### 3. Installation & Run Local Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the app!

## 🏗️ Deployment

This is a **pure frontend** application. Just deploy the `dist` folder to Vercel, Netlify, or GitHub Pages. Don't forget to:
1. Update your deployment environment variables (`VITE_NEON_DATA_API_KEY`, etc.).
2. Add your new production domain to the Neon Auth allowed origins.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

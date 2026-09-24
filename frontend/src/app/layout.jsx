import './globals.css';
import { AuthProvider } from '../lib/authContext.jsx';
import Navbar from '../components/Navbar.jsx';

export const metadata = {
  title: 'Trao | The AI Interview Prep Kit',
  description: 'Turn any job description and company site into an adaptive, personalized interview preparation kit.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

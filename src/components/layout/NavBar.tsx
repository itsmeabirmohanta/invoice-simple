import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Settings, Home, HelpCircle, Clipboard, Menu, X, Plus } from 'lucide-react';
import NavLoading from './NavLoading';
import { useInvoice } from '../../context/InvoiceContext';

const NavBar: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createNewInvoice } = useInvoice();

  // Run only client-side
  useEffect(() => {
    setIsClient(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };

    window.addEventListener('scroll', handleScroll);
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, []);

  const isActive = (path: string) => currentPath === path;

  const handleNewInvoice = () => {
    createNewInvoice();
    router.push('/');
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <Home size={18} /> },
    { path: '/invoices', name: 'Invoices', icon: <Clipboard size={18} /> },
    { path: '/settings', name: 'Settings', icon: <Settings size={18} /> },
    { path: '/help', name: 'Help', icon: <HelpCircle size={18} /> },
  ];

  // Don't render the real content during SSR - only a basic navbar structure
  // This avoids any document/window references during server rendering
  if (!isClient) {
    return (
      <nav className="fixed w-full z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <span className="font-semibold text-xl tracking-tight">InvoiceSimple</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed w-full z-10 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-black text-white">
              <FileText size={18} />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              InvoiceSimple
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                    isActive(item.path) 
                      ? 'text-black border-b-2 border-black' 
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <button 
                onClick={handleNewInvoice}
                className="px-4 py-2 rounded bg-black text-white text-sm font-medium flex items-center space-x-1 hover:opacity-70 transition-opacity"
              >
                <Plus size={18} />
                <span>New Invoice</span>
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-gray-600 hover:text-black focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} transition-all duration-300`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded text-base font-medium flex items-center space-x-2 ${
                isActive(item.path)
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
          
          <button 
            onClick={() => {
              handleNewInvoice();
              setMobileMenuOpen(false);
            }}
            className="w-full px-3 py-2 rounded bg-black text-white text-base font-medium flex items-center space-x-2 hover:opacity-70 transition-opacity"
          >
            <Plus size={18} />
            <span>New Invoice</span>
          </button>
        </div>
      </div>
      
      {/* Loading indicator */}
      <NavLoading isLoading={isLoading} />
    </nav>
  );
};

export default NavBar; 
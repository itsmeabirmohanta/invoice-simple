import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Plus, User, LogOut, Menu, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline text-gray-900">InvoiceHub</span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Invoices
            </Button>
            <Button
              variant={isActive('/create') ? 'default' : 'ghost'}
              onClick={() => navigate('/create')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                <Menu className="w-4 h-4 md:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { navigate('/'); setMenuOpen(false); }} className="md:hidden">
                <FileText className="w-4 h-4 mr-2" />
                Invoices
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate('/create'); setMenuOpen(false); }} className="md:hidden">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem onClick={() => { navigate('/profile'); setMenuOpen(false); }}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate('/settings'); setMenuOpen(false); }}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

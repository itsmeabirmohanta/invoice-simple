import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserCircle, Mail, Building2, MapPin, AtSign } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    company_name: user?.company_name || '',
    company_address: user?.company_address || '',
    company_email: user?.company_email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile via API
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          </div>
          <p className="text-gray-600">Update your personal and company information</p>
        </div>

        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input 
                      id="email"
                      value={user?.email} 
                      disabled 
                      className="bg-gray-50 cursor-not-allowed" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <UserCircle className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Company Information</CardTitle>
              <CardDescription>Details about your business</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company_name" className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    placeholder="Your company name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="company_email" className="flex items-center gap-2 mb-2">
                    <AtSign className="w-4 h-4" />
                    Company Email
                  </Label>
                  <Input
                    id="company_email"
                    type="email"
                    placeholder="business@example.com"
                    value={formData.company_email}
                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="company_address" className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Company Address
                  </Label>
                  <Textarea
                    id="company_address"
                    placeholder="Enter your company address..."
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    disabled={loading}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              Discard Changes
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-8"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

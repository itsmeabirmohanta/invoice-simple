import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';
import { Bell, Palette, Shield, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    securityAlerts: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save settings to backend API
      // await apiClient.putRequest('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and notifications</p>
        </div>

        <div className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Control how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium cursor-default">Email Notifications</Label>
                  <p className="text-sm text-gray-600 mt-1">Receive email updates about your account</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium cursor-default flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Invoice Reminders
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Get reminded about overdue invoices</p>
                </div>
                <Switch
                  id="invoice-reminders"
                  checked={settings.invoiceReminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, invoiceReminders: checked })
                  }
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium cursor-default flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Alerts
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Important security notifications for your account</p>
                </div>
                <Switch
                  id="security-alerts"
                  checked={settings.securityAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, securityAlerts: checked })
                  }
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  🎨 Appearance settings will be available soon. Your system theme preference is currently being used.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              Reset
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="px-8"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

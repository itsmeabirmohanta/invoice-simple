import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatINR } from '@/lib/format';
import { format, subMonths, isAfter } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { TrendingUp, Users, PieChart as PieChartIcon } from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  status: string;
  payment_status: string;
  paid_amount: number;
  total_amount: number;
  bill_to_name: string;
}

interface DashboardAnalyticsProps {
  invoices: Invoice[];
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

export const DashboardAnalytics = ({ invoices }: DashboardAnalyticsProps) => {
  const analyticsData = useMemo(() => {
    // 1. Monthly Revenue (Last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6);
    const monthlyMap: Record<string, { month: string; paid: number; unpaid: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthStr = format(d, 'MMM yyyy');
      monthlyMap[monthStr] = { month: monthStr, paid: 0, unpaid: 0 };
    }

    // 2. Client Revenue
    const clientMap: Record<string, number> = {};
    
    // 3. Status Breakdown
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    invoices.forEach(inv => {
      // Monthly aggregation
      try {
        if (!inv.date) return;
        const invDate = new Date(inv.date);
        if (isAfter(invDate, sixMonthsAgo)) {
          const monthStr = format(invDate, 'MMM yyyy');
          if (monthlyMap[monthStr]) {
            if (inv.payment_status === 'paid') {
              monthlyMap[monthStr].paid += (inv.total_amount || 0);
            } else {
              monthlyMap[monthStr].unpaid += (inv.total_amount || 0);
            }
          }
        }
      } catch (e) {
        // ignore invalid dates
      }

      // Client aggregation
      if (inv.bill_to_name) {
        clientMap[inv.bill_to_name] = (clientMap[inv.bill_to_name] || 0) + (inv.total_amount || 0);
      }

      // Status count
      const status = inv.payment_status || 'unpaid';
      if (status === 'paid') paidCount++;
      else if (status === 'unpaid') unpaidCount++;
      else partialCount++;
    });

    const monthlyData = Object.values(monthlyMap);
    
    const statusData = [
      { name: 'Paid', value: paidCount },
      { name: 'Unpaid', value: unpaidCount },
      { name: 'Partial', value: partialCount },
    ].filter(d => d.value > 0);

    const topClients = Object.entries(clientMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // top 5

    return { monthlyData, statusData, topClients };
  }, [invoices]);

  if (invoices.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Monthly Revenue Chart */}
      <Card className="lg:col-span-2 p-6 border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">Last 6 Months</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                dx={-10}
              />
              <RechartsTooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => formatINR(value)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="paid" name="Paid Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="unpaid" name="Pending Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Status Breakdown */}
        {analyticsData.statusData.length > 0 && (
          <Card className="p-6 border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <PieChartIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Invoice Status</h3>
            </div>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-[-20px]">
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-800">{invoices.length}</span>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Top Clients */}
        {analyticsData.topClients.length > 0 && (
          <Card className="p-6 border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top Clients</h3>
            </div>
            <div className="space-y-4">
              {analyticsData.topClients.map((client, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate" title={client.name}>
                      {client.name}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap ml-4">
                    {formatINR(client.total)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

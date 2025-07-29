import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  IndianRupee,
  Clock,
  Receipt,
  TrendingUp,
  Car,
  MapPin,
  Plane,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalClients: number;
  totalRevenue: number;
  pendingPayments: number;
  gstCollected: number;
  selfDriveRevenue: number;
  taxiRevenue: number;
  tourRevenue: number;
  totalExpenses: number;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  expenses?: number;
}

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    gstCollected: 0,
    selfDriveRevenue: 0,
    taxiRevenue: 0,
    tourRevenue: 0,
    totalExpenses: 0,
  });
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [serviceData, setServiceData] = useState<ChartData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch payment statistics
      const { data: payments } = await supabase
        .from('payments')
        .select('*');

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, expense_date');

      if (payments && expenses) {
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const gstCollected = payments.reduce((sum, p) => sum + Number(p.gst_amount), 0);
        const pendingPayments = payments
          .filter(p => p.payment_status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Service-wise revenue
        const selfDriveRevenue = payments
          .filter(p => p.service_type === 'self_drive')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const taxiRevenue = payments
          .filter(p => p.service_type === 'taxi')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const tourRevenue = payments
          .filter(p => p.service_type === 'tour')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        setStats({
          totalClients: clientsCount || 0,
          totalRevenue,
          pendingPayments,
          gstCollected,
          selfDriveRevenue,
          taxiRevenue,
          tourRevenue,
          totalExpenses,
        });

        // Prepare chart data
        setServiceData([
          { name: 'Self Drive', value: selfDriveRevenue },
          { name: 'Taxi', value: taxiRevenue },
          { name: 'Tour', value: tourRevenue },
        ]);

        // Monthly revenue vs expenses (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          const monthRevenue = payments
            .filter(p => {
              const paymentDate = new Date(p.booking_date);
              return paymentDate.getMonth() === date.getMonth() && 
                     paymentDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, p) => sum + Number(p.amount), 0);

          const monthExpenses = expenses
            .filter(e => {
              const expenseDate = new Date(e.expense_date);
              return expenseDate.getMonth() === date.getMonth() && 
                     expenseDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, e) => sum + Number(e.amount), 0);

          monthlyData.push({
            name: monthName,
            revenue: monthRevenue,
            expenses: monthExpenses,
            value: monthRevenue - monthExpenses,
          });
        }

        setMonthlyTrend(monthlyData);
        setRevenueData(monthlyData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Payments",
      value: `₹${stats.pendingPayments.toLocaleString()}`,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "GST Collected",
      value: `₹${stats.gstCollected.toLocaleString()}`,
      icon: Receipt,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const serviceCards = [
    {
      title: "Self Drive",
      value: `₹${stats.selfDriveRevenue.toLocaleString()}`,
      icon: Car,
      color: "text-primary",
    },
    {
      title: "Taxi Service",
      value: `₹${stats.taxiRevenue.toLocaleString()}`,
      icon: MapPin,
      color: "text-secondary",
    },
    {
      title: "Tour Packages",
      value: `₹${stats.tourRevenue.toLocaleString()}`,
      icon: Plane,
      color: "text-accent",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Travel business analytics and insights</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-soft border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service-wise Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {serviceCards.map((service, index) => (
          <Card key={index} className="shadow-soft border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-muted">
                  <service.icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {service.title}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {service.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Revenue vs Expenses</span>
            </CardTitle>
            <CardDescription>Monthly comparison for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Service Revenue Distribution</CardTitle>
            <CardDescription>Revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="font-semibold text-success">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-semibold text-destructive">₹{stats.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Net Profit</span>
              <span className={`font-bold ${stats.totalRevenue - stats.totalExpenses > 0 ? 'text-success' : 'text-destructive'}`}>
                ₹{(stats.totalRevenue - stats.totalExpenses).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {stats.totalClients} total clients registered
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                ₹{stats.pendingPayments.toLocaleString()} in pending payments
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                ₹{stats.gstCollected.toLocaleString()} GST collected
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
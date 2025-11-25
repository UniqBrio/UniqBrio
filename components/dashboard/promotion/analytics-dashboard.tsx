'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Zap,
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  type: string;
  reach: number;
  engagement: number;
  conversions: number;
  roi: number;
  status: string;
  budget?: number;
  budget_spent?: number;
  impressions?: number;
  clicks?: number;
  conversions_count?: number;
}

interface AnalyticsDashboardProps {
  campaigns: Campaign[];
}

export default function AnalyticsDashboard({ campaigns }: AnalyticsDashboardProps) {
  // Calculate overall metrics
  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
  const totalEngagement = campaigns.reduce((sum, c) => sum + c.engagement, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalBudgetSpent = campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const avgROI =
    campaigns.length > 0
      ? (campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1)
      : '0';

  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
  const conversionRate =
    totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0';
  const budgetUtilization =
    totalBudget > 0 ? ((totalBudgetSpent / totalBudget) * 100).toFixed(1) : '0';

  // Campaign type breakdown
  const typeBreakdown = campaigns.reduce(
    (acc, campaign) => {
      const existing = acc.find((item) => item.name === campaign.type);
      if (existing) {
        existing.value += 1;
        existing.reach += campaign.reach;
      } else {
        acc.push({
          name: campaign.type,
          value: 1,
          reach: campaign.reach,
        });
      }
      return acc;
    },
    [] as { name: string; value: number; reach: number }[]
  );

  // Status breakdown
  const statusBreakdown = campaigns.reduce(
    (acc, campaign) => {
      const existing = acc.find((item) => item.status === campaign.status);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          status: campaign.status,
          count: 1,
        });
      }
      return acc;
    },
    [] as { status: string; count: number }[]
  );

  // Performance trend (simulated)
  const performanceTrend = [
    { week: 'Week 1', reach: 1500, engagement: 380, conversions: 45 },
    { week: 'Week 2', reach: 2100, engagement: 520, conversions: 62 },
    { week: 'Week 3', reach: 1800, engagement: 450, conversions: 54 },
    { week: 'Week 4', reach: 2800, engagement: 680, conversions: 89 },
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    trend,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    color: string;
  }) => (
    <Card className={`border-2 bg-gradient-to-br from-white to-gray-50`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-white">{label}</p>
            <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Reach"
          value={`${(totalReach / 1000).toFixed(1)}k`}
          change="+12%"
          trend="up"
          color="text-purple-600"
        />
        <StatCard
          icon={Eye}
          label="Total Impressions"
          value={`${(totalImpressions / 1000).toFixed(1)}k`}
          change="+8%"
          trend="up"
          color="text-blue-600"
        />
        <StatCard
          icon={MousePointerClick}
          label="Click-Through Rate"
          value={`${ctr}%`}
          change="+2.3%"
          trend="up"
          color="text-indigo-600"
        />
        <StatCard
          icon={ShoppingCart}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          change="+4.1%"
          trend="up"
          color="text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Engagement"
          value={`${(totalEngagement / 1000).toFixed(1)}k`}
          change="+6%"
          trend="up"
          color="text-pink-600"
        />
        <StatCard
          icon={Target}
          label="Total Conversions"
          value={totalConversions}
          change="+15%"
          trend="up"
          color="text-orange-600"
        />
        <StatCard
          icon={DollarSign}
          label="Budget Utilization"
          value={`${budgetUtilization}%`}
          color="text-amber-600"
        />
        <StatCard
          icon={Zap}
          label="Average ROI"
          value={`${avgROI}%`}
          change="+5%"
          trend="up"
          color="text-cyan-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Trend */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Weekly reach, engagement, and conversion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="reach"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Reach"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="engagement"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Engagement"
                />
                <Bar
                  yAxisId="right"
                  dataKey="conversions"
                  fill="#10b981"
                  opacity={0.7}
                  name="Conversions"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Type Breakdown */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Campaign Type Distribution</CardTitle>
            <CardDescription>Number of campaigns by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Breakdown */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Campaign Status</CardTitle>
            <CardDescription>Active campaigns overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.map((item) => {
              let badgeColor = 'bg-gray-100 text-gray-800 dark:text-white';
              if (item.status === 'Active') badgeColor = 'bg-green-100 text-green-800';
              if (item.status === 'Scheduled') badgeColor = 'bg-blue-100 text-blue-800';
              if (item.status === 'Completed') badgeColor = 'bg-gray-100 text-gray-800 dark:text-white';
              if (item.status === 'Draft') badgeColor = 'bg-yellow-100 text-yellow-800';

              return (
                <div key={item.status} className="flex items-center justify-between">
                  <Badge className={badgeColor}>{item.status}</Badge>
                  <span className="text-lg font-bold">{item.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Total budget allocation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-white">Budget Spent</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  ${(totalBudgetSpent / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalBudgetSpent / totalBudget) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Budget</span>
                <span className="font-bold">${(totalBudget / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="font-bold">
                  ${((totalBudget - totalBudgetSpent) / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Best performing campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns
              .sort((a, b) => b.roi - a.roi)
              .slice(0, 3)
              .map((campaign, idx) => (
                <div key={campaign.id} className="flex items-start gap-2 pb-2 border-b last:border-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{campaign.title}</p>
                    <p className="text-xs text-gray-500 dark:text-white">ROI: {campaign.roi}%</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon: AI Analytics */}
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <CardTitle>AI-Powered Insights</CardTitle>
              <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" />
            </div>
            <CardDescription>
              Get intelligent recommendations to optimize your campaigns
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>� Predictive analytics for campaign performance</li>
            <li>� Automated optimization recommendations</li>
            <li>� Budget allocation suggestions</li>
            <li>� Audience targeting refinement</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

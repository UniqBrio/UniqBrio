"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Switch } from "@/components/dashboard/ui/switch";
import { Label } from "@/components/dashboard/ui/label";
import { Input } from "@/components/dashboard/ui/input";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { Button } from "@/components/dashboard/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { Badge } from "@/components/dashboard/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { 
  CreditCard, Bell, FileText, Settings, CheckCircle2, 
  Plus, Minus, Save, Calendar, Percent, AlertCircle,
  Mail, Eye, RotateCcw, Building2, Phone, MapPin, Globe, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";
import { useRouter } from "next/navigation";
import CoursePaymentFetcher from "./course-payment-fetcher";

// Template Management Interfaces
interface ReminderTemplate {
  id: string;
  name: string;
  category: 'one-time-full' | 'one-time-partial' | 'one-time-installments' | 'monthly-subscription' | 'monthly-subscription-discounted';
  subject: string;
  senderName: string;
  senderEmail: string;
  greeting: string;
  showStudentName: boolean;
  mainMessage: string;
  showPaymentInfo: boolean;
  showAmountDue: boolean;
  showDueDate: boolean;
  paymentInstructions: string;
  showActionButton: boolean;
  actionButtonText: string;
  footerMessage: string;
  isActive: boolean;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  category: 'one-time-full' | 'partial-payment' | 'one-time-installments' | 'monthly-subscription';
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  invoiceTitle: string;
  showInvoiceNumber: boolean;
  showInvoiceDate: boolean;
  showDueDate: boolean;
  showStudentSection: boolean;
  studentSectionTitle: string;
  showPaymentSection: boolean;
  paymentSectionTitle: string;
  footerText: string;
  isActive: boolean;
}

interface PaymentSettingsState {
  // Payment Types
  partialPaymentEnabled: boolean;
  oneTimeInstallmentsEnabled: boolean;
  installmentsCount: number;
  discountedSubscriptionEnabled: boolean;
  discountTypes: ('percentage' | 'amount')[];
  minLockInMonths: number;
  maxLockInMonths: number;
  
  // Reminder Settings
  autoRemindersEnabled: boolean;
  reminderFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  preReminderEnabled: boolean;
  preReminderDays: number;
  
  // Invoice Settings
  autoInvoiceGeneration: boolean;
  invoicePrefix: string;
  invoiceNumberStart: number;
  
  // Draft Invoice Settings
  draftInvoiceOneTimeFull: boolean;
  draftInvoicePartialPayment: boolean;
  draftInvoiceOneTimeInstallments: boolean;
  draftInvoiceMonthlySubscription: boolean;
}

export default function PaymentSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Payment Types
  const [partialPaymentEnabled, setPartialPaymentEnabled] = useState(true);
  const [oneTimeInstallmentsEnabled, setOneTimeInstallmentsEnabled] = useState(true);
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [discountedSubscriptionEnabled, setDiscountedSubscriptionEnabled] = useState(true);
  const [discountTypes, setDiscountTypes] = useState<('percentage' | 'amount')[]>(['percentage', 'amount']);
  const [minLockInMonths, setMinLockInMonths] = useState(3);
  const [maxLockInMonths, setMaxLockInMonths] = useState(12);
  
  // Reminder Settings
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [preReminderEnabled, setPreReminderEnabled] = useState(true);
  const [preReminderDays, setPreReminderDays] = useState(3);
  
  // Invoice Settings
  const [autoInvoiceGeneration, setAutoInvoiceGeneration] = useState(true);
  const [invoicePrefix, setInvoicePrefix] = useState('UB-INV');
  const [invoiceNumberStart, setInvoiceNumberStart] = useState(1000);
  
  // Draft Invoice Settings
  const [draftInvoiceOneTimeFull, setDraftInvoiceOneTimeFull] = useState(false);
  const [draftInvoicePartialPayment, setDraftInvoicePartialPayment] = useState(false);
  const [draftInvoiceOneTimeInstallments, setDraftInvoiceOneTimeInstallments] = useState(false);
  const [draftInvoiceMonthlySubscription, setDraftInvoiceMonthlySubscription] = useState(false);

  // Template Management States
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedReminderTemplate, setSelectedReminderTemplate] = useState<string>('');
  const [selectedInvoiceTemplate, setSelectedInvoiceTemplate] = useState<string>('');
  const [editingReminderTemplate, setEditingReminderTemplate] = useState<ReminderTemplate | null>(null);
  const [editingInvoiceTemplate, setEditingInvoiceTemplate] = useState<InvoiceTemplate | null>(null);

  // Custom Template Management States
  const [customReminderTemplates, setCustomReminderTemplates] = useState<ReminderTemplate[]>([]);
  const [selectedCustomReminderTemplate, setSelectedCustomReminderTemplate] = useState<string>('');
  const [editingCustomReminderTemplate, setEditingCustomReminderTemplate] = useState<ReminderTemplate | null>(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState<'reminder' | null>(null);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const settings: PaymentSettingsState = {
        partialPaymentEnabled,
        oneTimeInstallmentsEnabled,
        installmentsCount,
        discountedSubscriptionEnabled,
        discountTypes,
        minLockInMonths,
        maxLockInMonths,
        autoRemindersEnabled,
        reminderFrequency,
        preReminderEnabled,
        preReminderDays,
        autoInvoiceGeneration,
        invoicePrefix,
        invoiceNumberStart,
        draftInvoiceOneTimeFull,
        draftInvoicePartialPayment,
        draftInvoiceOneTimeInstallments,
        draftInvoiceMonthlySubscription
      };

      localStorage.setItem('paymentSettings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Payment settings have been saved successfully!",
      });
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for creating default templates
  const createDefaultReminderTemplate = (category: string): ReminderTemplate => {
    const templates = {
      'one-time-full': {
        name: 'One-Time Full Payment Reminder',
        subject: 'Payment Reminder - Complete Course Payment',
        mainMessage: 'This is a friendly reminder that your full course payment is due. Please complete your payment to secure your enrollment.',
      },
      'one-time-partial': {
        name: 'One-Time Partial Payment Reminder',
        subject: 'Payment Reminder - Outstanding Balance Due',
        mainMessage: 'You have an outstanding balance on your course payment. Please complete your remaining payment to continue your enrollment.',
      },
      'one-time-installments': {
        name: 'One-Time Installments Reminder',
        subject: 'EMI Payment Reminder - Installment Due',
        mainMessage: 'Your next EMI installment is due. Please make your payment to stay on track with your course.',
      },
      'monthly-subscription': {
        name: 'Monthly Subscription Reminder',
        subject: 'Monthly Subscription Renewal - {courseName}',
        mainMessage: 'Your monthly subscription for {courseName} is due for renewal. Continue your learning journey by renewing today.',
      },
      'monthly-subscription-discounted': {
        name: 'Monthly Subscription (Discounted) Reminder',
        subject: 'Discounted Subscription Renewal - {courseName}',
        mainMessage: 'Your discounted monthly subscription is due for renewal. Don\'t miss out on your special rate!',
      }
    };
    
    const template = templates[category as keyof typeof templates];
    return {
      id: `default-${category}`,
      category: category as any,
      ...template,
      senderName: 'UniqBrio Education',
      senderEmail: 'payments@uniqbrio.com',
      greeting: 'Dear {studentName},',
      showStudentName: true,
      showPaymentInfo: true,
      showAmountDue: true,
      showDueDate: true,
      paymentInstructions: 'Please visit our payment portal or contact our support team for payment assistance.',
      showActionButton: true,
      actionButtonText: 'Pay Now',
      footerMessage: 'Thank you for choosing UniqBrio Education.',
      isActive: true
    };
  };

  const createDefaultInvoiceTemplate = (category: string): InvoiceTemplate => {
    const templates = {
      'one-time-full': { name: 'One-Time Full Payment Invoice' },
      'partial-payment': { name: 'Partial Payment Invoice' },
      'one-time-installments': { name: 'One-Time Installments Invoice' },
      'monthly-subscription': { name: 'Monthly Subscription Invoice' },
      'monthly-subscription-discounted': { name: 'Monthly Subscription (Discounted) Invoice' }
    };
    
    return {
      id: `default-${category}`,
      category: category as any,
      name: templates[category as keyof typeof templates]?.name || 'Default Invoice',
      companyName: 'UniqBrio Education',
      companyAddress: 'Your Company Address\nCity, State, ZIP Code\nCountry',
      companyPhone: '+1 (555) 123-4567',
      companyEmail: 'billing@uniqbrio.com',
      invoiceTitle: 'INVOICE',
      showInvoiceNumber: true,
      showInvoiceDate: true,
      showDueDate: true,
      showStudentSection: true,
      studentSectionTitle: 'Bill To',
      showPaymentSection: true,
      paymentSectionTitle: 'Course Details',
      footerText: 'Thank you for your business!',
      isActive: true
    };
  };

  const createCustomReminderTemplate = (category: string, name: string): ReminderTemplate => {
    return {
      id: `custom-${Date.now()}-${category}`,
      category: category as any,
      name: name,
      subject: 'Custom Payment Reminder',
      senderName: 'UniqBrio Education',
      senderEmail: 'payments@uniqbrio.com',
      greeting: 'Dear {studentName},',
      showStudentName: true,
      mainMessage: 'This is a custom reminder for your payment.',
      showPaymentInfo: true,
      showAmountDue: true,
      showDueDate: true,
      paymentInstructions: 'Please complete your payment as per the instructions.',
      showActionButton: true,
      actionButtonText: 'Pay Now',
      footerMessage: 'Thank you for choosing UniqBrio Education.',
      isActive: true
    };
  };



  // Load settings and templates on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('paymentSettings');
      if (savedSettings) {
        const settings: PaymentSettingsState = JSON.parse(savedSettings);
        if (settings.partialPaymentEnabled !== undefined) setPartialPaymentEnabled(settings.partialPaymentEnabled);
        if (settings.oneTimeInstallmentsEnabled !== undefined) setOneTimeInstallmentsEnabled(settings.oneTimeInstallmentsEnabled);
        if (settings.installmentsCount !== undefined) setInstallmentsCount(settings.installmentsCount);
        if (settings.discountedSubscriptionEnabled !== undefined) setDiscountedSubscriptionEnabled(settings.discountedSubscriptionEnabled);
        if (settings.discountTypes !== undefined) setDiscountTypes(settings.discountTypes);
        if (settings.minLockInMonths !== undefined) setMinLockInMonths(settings.minLockInMonths);
        if (settings.maxLockInMonths !== undefined) setMaxLockInMonths(settings.maxLockInMonths);
        if (settings.autoRemindersEnabled !== undefined) setAutoRemindersEnabled(settings.autoRemindersEnabled);
        if (settings.reminderFrequency !== undefined) setReminderFrequency(settings.reminderFrequency);
        if (settings.preReminderEnabled !== undefined) setPreReminderEnabled(settings.preReminderEnabled);
        if (settings.preReminderDays !== undefined) setPreReminderDays(settings.preReminderDays);
        if (settings.autoInvoiceGeneration !== undefined) setAutoInvoiceGeneration(settings.autoInvoiceGeneration);
        if (settings.invoicePrefix !== undefined) setInvoicePrefix(settings.invoicePrefix);
        if (settings.invoiceNumberStart !== undefined) setInvoiceNumberStart(settings.invoiceNumberStart);
        if (settings.draftInvoiceOneTimeFull !== undefined) setDraftInvoiceOneTimeFull(settings.draftInvoiceOneTimeFull);
        if (settings.draftInvoicePartialPayment !== undefined) setDraftInvoicePartialPayment(settings.draftInvoicePartialPayment);
        if (settings.draftInvoiceOneTimeInstallments !== undefined) setDraftInvoiceOneTimeInstallments(settings.draftInvoiceOneTimeInstallments);
        if (settings.draftInvoiceMonthlySubscription !== undefined) setDraftInvoiceMonthlySubscription(settings.draftInvoiceMonthlySubscription);
      }
      
      // Load templates
      const savedReminderTemplates = localStorage.getItem('reminderTemplates');
      if (savedReminderTemplates) {
        setReminderTemplates(JSON.parse(savedReminderTemplates));
      }
      
      const savedInvoiceTemplates = localStorage.getItem('invoiceTemplates');
      if (savedInvoiceTemplates) {
        setInvoiceTemplates(JSON.parse(savedInvoiceTemplates));
      }

      // Load custom templates
      const savedCustomReminderTemplates = localStorage.getItem('customReminderTemplates');
      if (savedCustomReminderTemplates) {
        setCustomReminderTemplates(JSON.parse(savedCustomReminderTemplates));
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment System Configuration</h2>
          <p className="text-sm text-gray-600 dark:text-white mt-1">
            Manage payment categories, reminders, invoices, and system-wide settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 !text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="payment-types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-purple-200">
          <TabsTrigger value="payment-types" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Categories
          </TabsTrigger>
          <TabsTrigger value="reminders" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Payment Types Tab */}
        <TabsContent value="payment-types" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Payment Categories Configuration</CardTitle>
              <CardDescription>
                Enable or disable payment categories. Course category determines which options are available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Partial Payments */}
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-lg font-semibold">Partial Payments</Label>
                      {partialPaymentEnabled && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      <Badge variant="secondary" className="text-xs">One-Time Category</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white mt-1">
                      Students can split the total amount into two payments only
                    </p>
                  </div>
                  <Switch
                    checked={partialPaymentEnabled}
                    onCheckedChange={setPartialPaymentEnabled}
                  />
                </div>
              </div>

              {/* One-Time with Installments */}
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-lg font-semibold">One-Time with Installments</Label>
                      {oneTimeInstallmentsEnabled && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                      <Badge variant="secondary" className="text-xs">Regular Courses</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white mt-1">
                      Fixed {installmentsCount} installments spread across course duration
                    </p>
                    {oneTimeInstallmentsEnabled && (
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Will appear in payment dialog as "One-Time With Installments ({installmentsCount} EMIs)"
                      </p>
                    )}
                    {!oneTimeInstallmentsEnabled && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠ This option will be hidden from the payment dialog
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={oneTimeInstallmentsEnabled}
                    onCheckedChange={setOneTimeInstallmentsEnabled}
                  />
                </div>
                
                {oneTimeInstallmentsEnabled && (
                  <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Number of Installments</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setInstallmentsCount(Math.max(2, installmentsCount - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(Math.max(2, parseInt(e.target.value) || 3))}
                          className="w-24 text-center"
                          min="2"
                          max="5"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setInstallmentsCount(Math.min(5, installmentsCount + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-white">installments</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white rounded border">
                        <Badge variant="outline" className="mb-2">1st EMI</Badge>
                        <p className="text-gray-600 dark:text-white">No invoice</p>
                        <p className="text-gray-600 dark:text-white">No toggles</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <Badge variant="outline" className="mb-2">Middle EMIs</Badge>
                        <p className="text-gray-600 dark:text-white">Invoice on payment</p>
                        <p className="text-gray-600 dark:text-white">Stop toggles enabled</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <Badge variant="outline" className="mb-2">Final EMI</Badge>
                        <p className="text-gray-600 dark:text-white">Final invoice</p>
                        <p className="text-gray-600 dark:text-white">Stop toggles enabled</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Subscription with Discounts */}
              <div className="p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-lg font-semibold">Monthly Subscription with Discounts</Label>
                      {discountedSubscriptionEnabled && <CheckCircle2 className="h-5 w-5 text-pink-600" />}
                      <Badge variant="default" className="text-xs bg-purple-600">Ongoing Training Only</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white mt-1">
                      Discounted monthly plans with lock-in periods
                    </p>
                    {discountedSubscriptionEnabled && (
                      <p className="text-xs text-pink-600 mt-1">
                        ✓ Will appear in payment dialog for Ongoing Training courses
                      </p>
                    )}
                    {!discountedSubscriptionEnabled && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠ This option will be hidden from the payment dialog
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={discountedSubscriptionEnabled}
                    onCheckedChange={setDiscountedSubscriptionEnabled}
                  />
                </div>
                
                {discountedSubscriptionEnabled && (
                  <div className="mt-4 pt-4 border-t border-pink-200 space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Discount Types Allowed</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={discountTypes.includes('percentage')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDiscountTypes([...discountTypes, 'percentage']);
                              } else {
                                setDiscountTypes(discountTypes.filter(t => t !== 'percentage'));
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <Percent className="h-4 w-4" />
                          <span className="text-sm">Percentage Discount</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={discountTypes.includes('amount')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDiscountTypes([...discountTypes, 'amount']);
                              } else {
                                setDiscountTypes(discountTypes.filter(t => t !== 'amount'));
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Fixed Amount Discount</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Min Lock-in (months)</Label>
                        <Input
                          type="number"
                          value={minLockInMonths}
                          onChange={(e) => setMinLockInMonths(Math.max(1, parseInt(e.target.value) || 3))}
                          className="w-full"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Max Lock-in (months)</Label>
                        <Input
                          type="number"
                          value={maxLockInMonths}
                          onChange={(e) => setMaxLockInMonths(Math.max(minLockInMonths, parseInt(e.target.value) || 12))}
                          className="w-full"
                          min={minLockInMonths}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Reminder Settings</CardTitle>
              <CardDescription>
                Configure automatic payment reminders and notification frequency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <Label className="text-lg font-semibold">Auto Reminders</Label>
                    <p className="text-sm text-gray-600 dark:text-white mt-1">
                      Automatically send payment reminders to students
                    </p>
                  </div>
                  <Switch
                    checked={autoRemindersEnabled}
                    onCheckedChange={setAutoRemindersEnabled}
                  />
                </div>
                
                {autoRemindersEnabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-blue-200">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Reminder Frequency</Label>
                      <Select value={reminderFrequency} onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY') => setReminderFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <Label className="text-lg font-semibold">Pre-Payment Reminders</Label>
                    <p className="text-sm text-gray-600 dark:text-white mt-1">
                      Send reminders before payment due date
                    </p>
                  </div>
                  <Switch
                    checked={preReminderEnabled}
                    onCheckedChange={setPreReminderEnabled}
                  />
                </div>
                
                {preReminderEnabled && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <Label className="text-sm font-medium mb-2 block">Days Before Due Date</Label>
                    <Input
                      type="number"
                      value={preReminderDays}
                      onChange={(e) => setPreReminderDays(Math.max(1, parseInt(e.target.value) || 3))}
                      className="w-32"
                      min="1"
                      max="30"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold mb-3">Common Reminder Settings Applied to All Payment Types</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p><strong>All Payment Types:</strong> Use common frequency ({reminderFrequency}) and pre-reminder ({preReminderDays} days) settings</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p><strong>One-Time Partial Payments:</strong> Two-payment split system with reminders for second payment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p><strong>One-Time with Installments:</strong> Reminders before each EMI due date</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                    <p><strong>Monthly Subscription:</strong> Reminders for recurring monthly payments</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-pink-600 mt-0.5" />
                    <p><strong>Monthly Subscription with Discounts:</strong> Reminders for discounted recurring payments with lock-in benefits</p>
                  </div>
                  <div className="mt-3 p-2 bg-amber-50 rounded border-l-4 border-amber-400">
                    <p className="text-xs text-amber-800">
                      <strong>Note:</strong> These common settings ensure consistent reminder behavior across all payment categories. 
                      Individual payments can still be manually overridden if needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  Email Template Management
                </h4>
                
                <div className="space-y-4">
                  {/* Template Selector */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-2 block">Select Payment Category</Label>
                      <Select value={selectedReminderTemplate} onValueChange={setSelectedReminderTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose template to customize" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time-full">One-Time Full Payment</SelectItem>
                          <SelectItem value="one-time-partial">One-Time Partial Payment</SelectItem>
                          <SelectItem value="one-time-installments">One-Time Installments</SelectItem>
                          <SelectItem value="monthly-subscription">Monthly Subscription</SelectItem>
                          <SelectItem value="monthly-subscription-discounted">Monthly Subscription (Discounted)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (selectedReminderTemplate) {
                            const template = reminderTemplates.find(t => t.category === selectedReminderTemplate) || createDefaultReminderTemplate(selectedReminderTemplate as any);
                            setEditingReminderTemplate(template);
                          }
                        }}
                        disabled={!selectedReminderTemplate}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Edit Template
                      </Button>
                    </div>
                  </div>

                  {/* Template Editor */}
                  {editingReminderTemplate && (
                    <Card className="border-purple-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Editing: {editingReminderTemplate.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Email Subject</Label>
                            <Input
                              value={editingReminderTemplate.subject}
                              onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, subject: e.target.value})}
                              placeholder="Email subject line"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Sender Name</Label>
                            <Input
                              value={editingReminderTemplate.senderName}
                              onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, senderName: e.target.value})}
                              placeholder="Your name or company name"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Greeting Message</Label>
                          <Input
                            value={editingReminderTemplate.greeting}
                            onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, greeting: e.target.value})}
                            placeholder="e.g., Dear {studentName} or Hello"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Main Message</Label>
                          <Textarea
                            value={editingReminderTemplate.mainMessage}
                            onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, mainMessage: e.target.value})}
                            placeholder="Main email content - you can use variables like {courseName}, {amountDue}, {dueDate}"
                            rows={4}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Payment Instructions</Label>
                          <Textarea
                            value={editingReminderTemplate.paymentInstructions}
                            onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, paymentInstructions: e.target.value})}
                            placeholder="Instructions on how to make payment"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Display Options</Label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingReminderTemplate.showStudentName}
                                  onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, showStudentName: e.target.checked})}
                                />
                                <span className="text-sm">Show Student Name</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingReminderTemplate.showPaymentInfo}
                                  onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, showPaymentInfo: e.target.checked})}
                                />
                                <span className="text-sm">Show Payment Details</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingReminderTemplate.showAmountDue}
                                  onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, showAmountDue: e.target.checked})}
                                />
                                <span className="text-sm">Show Amount Due</span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Action Button</Label>
                            <Input
                              value={editingReminderTemplate.actionButtonText}
                              onChange={(e) => setEditingReminderTemplate({...editingReminderTemplate, actionButtonText: e.target.value})}
                              placeholder="e.g., Pay Now, Make Payment"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setEditingReminderTemplate(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              // Save template logic
                              const updatedTemplates = reminderTemplates.filter(t => t.category !== editingReminderTemplate.category);
                              updatedTemplates.push(editingReminderTemplate);
                              setReminderTemplates(updatedTemplates);
                              localStorage.setItem('reminderTemplates', JSON.stringify(updatedTemplates));
                              setEditingReminderTemplate(null);
                              toast({ title: "Template Saved", description: "Email template has been saved successfully!" });
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Enhanced Template Management Overview */}
                  {!editingReminderTemplate && (
                    <>
                      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-xs text-amber-800">
                            <strong>Template Management:</strong> Customize email templates for different payment categories. 
                            Each category uses common frequency settings but can have unique email content and styling.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'one-time-full', name: 'One-Time Full Payment', description: 'Reminders for complete course payment due' },
                          { id: 'one-time-partial', name: 'One-Time Partial Payment', description: 'Reminders for remaining balance due' },
                          { id: 'one-time-installments', name: 'One-Time Installments', description: 'Reminders for EMI payments due' },
                          { id: 'monthly-subscription', name: 'Monthly Subscription', description: 'Reminders for recurring monthly renewals' },
                          { id: 'monthly-subscription-discounted', name: 'Monthly Subscription (Discounted)', description: 'Reminders for discounted recurring payments' }
                        ].map(cat => {
                          const hasCustomTemplate = reminderTemplates.some(t => t.category === cat.id);
                          return (
                            <div key={cat.id} className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{cat.name}</span>
                                  <Badge 
                                    variant={hasCustomTemplate ? "default" : "secondary"} 
                                    className="text-xs"
                                  >
                                    {hasCustomTemplate ? "Custom" : "Default"}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const template = reminderTemplates.find(t => t.category === cat.id) || createDefaultReminderTemplate(cat.id as any);
                                    setEditingReminderTemplate(template);
                                  }}
                                  className="text-xs px-2 py-1"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 dark:text-white">
                                  {hasCustomTemplate ? "Using customized email template" : "Using system default template"}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-white italic">
                                  {cat.description}
                                </p>
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 dark:text-white">
                                    Frequency: <strong>{reminderFrequency}</strong> | 
                                    Pre-reminder: <strong>{preReminderDays} days</strong>
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {autoRemindersEnabled ? 'Enabled' : 'Disabled'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Configure automatic invoice generation and numbering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <Label className="text-lg font-semibold">Auto Invoice Generation</Label>
                    <p className="text-sm text-gray-600 dark:text-white mt-1">
                      Automatically generate invoices on payment receipt
                    </p>
                  </div>
                  <Switch
                    checked={autoInvoiceGeneration}
                    onCheckedChange={setAutoInvoiceGeneration}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Invoice Prefix</Label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="UB-INV"
                  />
                  <p className="text-xs text-gray-500 dark:text-white mt-1">Example: {invoicePrefix}-2024-0001</p>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Starting Number</Label>
                  <Input
                    type="number"
                    value={invoiceNumberStart}
                    onChange={(e) => setInvoiceNumberStart(Math.max(1, parseInt(e.target.value) || 1000))}
                    min="1"
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Invoice Template Management
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Template Selector */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">Select Payment Category</Label>
                        <Select value={selectedInvoiceTemplate} onValueChange={setSelectedInvoiceTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose invoice template to customize" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one-time-full">One-Time Full Payment</SelectItem>
                            <SelectItem value="partial-payment">Partial Payment</SelectItem>
                            <SelectItem value="one-time-installments">One-Time Installments</SelectItem>
                            <SelectItem value="monthly-subscription">Monthly Subscription</SelectItem>
                            <SelectItem value="monthly-subscription-discounted">Monthly Subscription (Discounted)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (selectedInvoiceTemplate) {
                              const template = invoiceTemplates.find(t => t.category === selectedInvoiceTemplate) || createDefaultInvoiceTemplate(selectedInvoiceTemplate as any);
                              setEditingInvoiceTemplate(template);
                            }
                          }}
                          disabled={!selectedInvoiceTemplate}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Edit Template
                        </Button>
                      </div>
                    </div>

                    {/* Invoice Template Editor */}
                    {editingInvoiceTemplate && (
                      <Card className="border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Editing: {editingInvoiceTemplate.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Company Name</Label>
                              <Input
                                value={editingInvoiceTemplate.companyName}
                                onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, companyName: e.target.value})}
                                placeholder="Your company name"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Invoice Title</Label>
                              <Input
                                value={editingInvoiceTemplate.invoiceTitle}
                                onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, invoiceTitle: e.target.value})}
                                placeholder="e.g., INVOICE, TAX INVOICE"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Company Address</Label>
                              <Textarea
                                value={editingInvoiceTemplate.companyAddress}
                                onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, companyAddress: e.target.value})}
                                placeholder="Complete company address"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Company Phone</Label>
                                <Input
                                  value={editingInvoiceTemplate.companyPhone}
                                  onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, companyPhone: e.target.value})}
                                  placeholder="Phone number"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Company Email</Label>
                                <Input
                                  value={editingInvoiceTemplate.companyEmail}
                                  onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, companyEmail: e.target.value})}
                                  placeholder="contact@company.com"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Student Section Title</Label>
                              <Input
                                value={editingInvoiceTemplate.studentSectionTitle}
                                onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, studentSectionTitle: e.target.value})}
                                placeholder="e.g., Bill To, Student Details"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Payment Section Title</Label>
                              <Input
                                value={editingInvoiceTemplate.paymentSectionTitle}
                                onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, paymentSectionTitle: e.target.value})}
                                placeholder="e.g., Payment Details, Course Fees"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Invoice Header Options</Label>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingInvoiceTemplate.showInvoiceNumber}
                                    onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, showInvoiceNumber: e.target.checked})}
                                  />
                                  <span className="text-sm">Show Invoice Number</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingInvoiceTemplate.showInvoiceDate}
                                    onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, showInvoiceDate: e.target.checked})}
                                  />
                                  <span className="text-sm">Show Invoice Date</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingInvoiceTemplate.showDueDate}
                                    onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, showDueDate: e.target.checked})}
                                  />
                                  <span className="text-sm">Show Due Date</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Footer Text</Label>
                              <Textarea
                                value={editingInvoiceTemplate.footerText}
                                onChange={(e) => setEditingInvoiceTemplate({...editingInvoiceTemplate, footerText: e.target.value})}
                                placeholder="Thank you message, terms, or additional notes"
                                rows={3}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => setEditingInvoiceTemplate(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                // Save template logic
                                const updatedTemplates = invoiceTemplates.filter(t => t.category !== editingInvoiceTemplate.category);
                                updatedTemplates.push(editingInvoiceTemplate);
                                setInvoiceTemplates(updatedTemplates);
                                localStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates));
                                setEditingInvoiceTemplate(null);
                                toast({ title: "Template Saved", description: "Invoice template has been saved successfully!" });
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Template Status Overview with Integrated Draft Settings */}
                    {!editingInvoiceTemplate && (
                      <>
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <p className="text-xs text-yellow-800">
                              <strong>Note:</strong> Draft invoices are created when payment options are enabled but not yet paid. 
                              They will be converted to final invoices upon payment completion.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'one-time-full', name: 'One-Time Full Payment', draftState: draftInvoiceOneTimeFull, setDraftState: setDraftInvoiceOneTimeFull, description: 'Generate draft for full payment option' },
                            { id: 'partial-payment', name: 'Partial Payment', draftState: draftInvoicePartialPayment, setDraftState: setDraftInvoicePartialPayment, description: 'Generate draft for partial payment option' },
                            { id: 'one-time-installments', name: 'One-Time Installments', draftState: draftInvoiceOneTimeInstallments, setDraftState: setDraftInvoiceOneTimeInstallments, description: 'Generate draft for installment payments' },
                            { id: 'monthly-subscription', name: 'Monthly Subscription', draftState: draftInvoiceMonthlySubscription, setDraftState: setDraftInvoiceMonthlySubscription, description: 'Generate draft for monthly subscription payments' },
                            { id: 'monthly-subscription-discounted', name: 'Monthly Subscription (Discounted)', draftState: draftInvoiceMonthlySubscription, setDraftState: setDraftInvoiceMonthlySubscription, description: 'Generate draft for discounted subscription payments' }
                          ].map(cat => {
                            const hasCustomTemplate = invoiceTemplates.some(t => t.category === cat.id);
                            return (
                              <div key={cat.id} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{cat.name}</span>
                                    <Badge 
                                      variant={hasCustomTemplate ? "default" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {hasCustomTemplate ? "Custom" : "Default"}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const template = invoiceTemplates.find(t => t.category === cat.id) || createDefaultInvoiceTemplate(cat.id as any);
                                      setEditingInvoiceTemplate(template);
                                    }}
                                    className="text-xs px-2 py-1"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-white mb-3">
                                  {hasCustomTemplate ? "Using customized template" : "Using system default template"}
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 dark:text-white">Auto-Generate Draft</Label>
                                    <p className="text-xs text-gray-500 dark:text-white">{cat.description}</p>
                                  </div>
                                  <Switch
                                    checked={cat.draftState}
                                    onCheckedChange={cat.setDraftState}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold mb-3">Auto Invoice Rules by Payment Type</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p><strong>One-Time Full Payment:</strong> Invoice generated immediately on payment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p><strong>One-Time Installments - 1st EMI:</strong> No invoice (invoice only when fully paid)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p><strong>One-Time Installments - Middle EMIs:</strong> Invoice generated on payment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p><strong>One-Time Installments - Final EMI:</strong> Final invoice generated on payment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p><strong>Monthly Subscription:</strong> Invoice generated for each monthly payment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}

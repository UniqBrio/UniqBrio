"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Button } from "@/components/dashboard/ui/button";
import { Label } from "@/components/dashboard/ui/label";
import { Input } from "@/components/dashboard/ui/input";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { Badge } from "@/components/dashboard/ui/badge";
import { Switch } from "@/components/dashboard/ui/switch";
import { Separator } from "@/components/dashboard/ui/separator";
import { 
  Mail, Eye, Save, RotateCcw, Plus, 
  Clock, DollarSign, User, GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";

interface ReminderTemplate {
  id: string;
  name: string;
  category: 'one-time-full' | 'one-time-partial' | 'one-time-installments' | 'monthly-subscription' | 'monthly-subscription-discounted' | 'overdue' | 'welcome' | 'course-completion';
  
  // Email Basic Info
  subject: string;
  senderName: string;
  senderEmail: string;
  
  // Message Content
  greeting: string;
  showStudentName: boolean;
  mainMessage: string;
  
  // Payment Information (for payment reminders)
  showPaymentInfo: boolean;
  showAmountDue: boolean;
  showDueDate: boolean;
  showPaymentMethods: boolean;
  paymentInstructions: string;
  
  // Course Information
  showCourseInfo: boolean;
  showCourseName: boolean;
  showCohortInfo: boolean;
  showStartDate: boolean;
  
  // Action Items
  showActionButton: boolean;
  actionButtonText: string;
  actionButtonLink: string;
  
  // Contact Information
  showContactInfo: boolean;
  supportEmail: string;
  supportPhone: string;
  
  // Footer
  closingMessage: string;
  companySignature: string;
  
  // Urgency Settings
  urgencyLevel: 'low' | 'medium' | 'high';
  showUrgencyIndicator: boolean;
  
  isDefault: boolean;
}

// Default templates for each payment category
const defaultTemplates: ReminderTemplate[] = [
  {
    id: 'one-time-full-default',
    name: 'One-Time Full Payment Reminder',
    category: 'one-time-full',
    subject: 'Payment Reminder - Complete Course Payment',
    senderName: 'UniqBrio Academy',
    senderEmail: 'support@uniqbrio.com',
    greeting: 'Dear',
    showStudentName: true,
    mainMessage: 'We hope you are enjoying your learning journey with us. This is a friendly reminder to complete your full course payment.',
    showPaymentInfo: true,
    showAmountDue: true,
    showDueDate: true,
    showPaymentMethods: true,
    paymentInstructions: 'Please complete your payment to maintain uninterrupted access to your course materials.',
    showCourseInfo: true,
    showCourseName: true,
    showCohortInfo: true,
    showStartDate: false,
    showActionButton: true,
    actionButtonText: 'Complete Payment',
    actionButtonLink: 'https://uniqbrio.com/payment',
    showContactInfo: true,
    supportEmail: 'support@uniqbrio.com',
    supportPhone: '+1 (555) 123-4567',
    closingMessage: 'Thank you for choosing UniqBrio Academy!',
    companySignature: 'Best regards,\\nUniqBrio Academy Team',
    urgencyLevel: 'medium',
    showUrgencyIndicator: false,
    isDefault: true
  },
  {
    id: 'one-time-partial-default',
    name: 'One-Time Partial Payment Reminder',
    category: 'one-time-partial',
    subject: 'Payment Reminder - Outstanding Balance Due',
    senderName: 'UniqBrio Academy',
    senderEmail: 'support@uniqbrio.com',
    greeting: 'Dear',
    showStudentName: true,
    mainMessage: 'We hope you are progressing well in your course. This is a reminder about your outstanding balance that needs to be paid.',
    showPaymentInfo: true,
    showAmountDue: true,
    showDueDate: true,
    showPaymentMethods: true,
    paymentInstructions: 'Please clear your outstanding balance to avoid any interruption in your learning experience.',
    showCourseInfo: true,
    showCourseName: true,
    showCohortInfo: true,
    showStartDate: false,
    showActionButton: true,
    actionButtonText: 'Pay Outstanding Balance',
    actionButtonLink: 'https://uniqbrio.com/payment',
    showContactInfo: true,
    supportEmail: 'support@uniqbrio.com',
    supportPhone: '+1 (555) 123-4567',
    closingMessage: 'Thank you for your continued learning!',
    companySignature: 'Best regards,\\nUniqBrio Academy Team',
    urgencyLevel: 'medium',
    showUrgencyIndicator: true,
    isDefault: true
  },
  {
    id: 'one-time-installments-default',
    name: 'One-Time Installments Reminder',
    category: 'one-time-installments',
    subject: 'EMI Payment Reminder - Installment #{installmentNumber} Due',
    senderName: 'UniqBrio Academy',
    senderEmail: 'support@uniqbrio.com',
    greeting: 'Dear',
    showStudentName: true,
    mainMessage: 'This is a friendly reminder that your next EMI payment is due soon. Please ensure timely payment to continue your course.',
    showPaymentInfo: true,
    showAmountDue: true,
    showDueDate: true,
    showPaymentMethods: true,
    paymentInstructions: 'Please make your EMI payment by the due date to avoid late fees and course access interruption.',
    showCourseInfo: true,
    showCourseName: true,
    showCohortInfo: true,
    showStartDate: false,
    showActionButton: true,
    actionButtonText: 'Pay EMI Now',
    actionButtonLink: 'https://uniqbrio.com/payment',
    showContactInfo: true,
    supportEmail: 'support@uniqbrio.com',
    supportPhone: '+1 (555) 123-4567',
    closingMessage: 'Keep up the great learning!',
    companySignature: 'Best regards,\\nUniqBrio Academy Team',
    urgencyLevel: 'medium',
    showUrgencyIndicator: false,
    isDefault: true
  },
  {
    id: 'monthly-subscription-default',
    name: 'Monthly Subscription Reminder',
    category: 'monthly-subscription',
    subject: 'Monthly Subscription Renewal - {courseName}',
    senderName: 'UniqBrio Academy',
    senderEmail: 'support@uniqbrio.com',
    greeting: 'Dear',
    showStudentName: true,
    mainMessage: 'Your monthly subscription renewal is coming up. Continue your learning journey without interruption.',
    showPaymentInfo: true,
    showAmountDue: true,
    showDueDate: true,
    showPaymentMethods: true,
    paymentInstructions: 'Your subscription will auto-renew. Ensure your payment method is up to date.',
    showCourseInfo: true,
    showCourseName: true,
    showCohortInfo: false,
    showStartDate: false,
    showActionButton: true,
    actionButtonText: 'Update Payment Method',
    actionButtonLink: 'https://uniqbrio.com/payment',
    showContactInfo: true,
    supportEmail: 'support@uniqbrio.com',
    supportPhone: '+1 (555) 123-4567',
    closingMessage: 'Thank you for your continued subscription!',
    companySignature: 'Best regards,\\nUniqBrio Academy Team',
    urgencyLevel: 'low',
    showUrgencyIndicator: false,
    isDefault: true
  },
  {
    id: 'monthly-subscription-discounted-default',
    name: 'Monthly Subscription with Discounts Reminder',
    category: 'monthly-subscription-discounted',
    subject: 'Discounted Subscription Renewal - {courseName}',
    senderName: 'UniqBrio Academy',
    senderEmail: 'support@uniqbrio.com',
    greeting: 'Dear',
    showStudentName: true,
    mainMessage: 'Your discounted monthly subscription is due for renewal. Continue enjoying your special pricing and learning benefits.',
    showPaymentInfo: true,
    showAmountDue: true,
    showDueDate: true,
    showPaymentMethods: true,
    paymentInstructions: 'Your discounted subscription will auto-renew at the special rate. Lock-in period applies.',
    showCourseInfo: true,
    showCourseName: true,
    showCohortInfo: false,
    showStartDate: false,
    showActionButton: true,
    actionButtonText: 'Renew Discounted Plan',
    actionButtonLink: 'https://uniqbrio.com/payment',
    showContactInfo: true,
    supportEmail: 'support@uniqbrio.com',
    supportPhone: '+1 (555) 123-4567',
    closingMessage: 'Thank you for choosing our discounted plan!',
    companySignature: 'Best regards,\\nUniqBrio Academy Team',
    urgencyLevel: 'low',
    showUrgencyIndicator: false,
    isDefault: true
  }
];

const defaultTemplate = defaultTemplates[0];

const templateCategories = [
  { value: 'one-time-full', label: 'One-Time Full Payment', icon: DollarSign },
  { value: 'one-time-partial', label: 'One-Time Partial Payment', icon: Clock },
  { value: 'one-time-installments', label: 'One-Time with Installments', icon: Clock },
  { value: 'monthly-subscription', label: 'Monthly Subscription', icon: DollarSign },
  { value: 'monthly-subscription-discounted', label: 'Monthly Subscription with Discounts', icon: DollarSign },
  { value: 'overdue', label: 'Overdue Payment', icon: Clock },
  { value: 'welcome', label: 'Welcome Message', icon: User },
  { value: 'course-completion', label: 'Course Completion', icon: GraduationCap }
];

export default function ReminderTemplateManager() {
  const [templates, setTemplates] = useState<ReminderTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate>(defaultTemplate);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // Save template logic here
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? selectedTemplate : t
      );
      setTemplates(updatedTemplates);
      
      toast({
        title: "Template Saved",
        description: "Reminder template has been saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save reminder template.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSelectedTemplate(defaultTemplate);
    setIsEditing(false);
  };

  const createNewTemplate = () => {
    const newTemplate: ReminderTemplate = {
      ...defaultTemplate,
      id: `template-${Date.now()}`,
      name: 'New Reminder Template',
      isDefault: false
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Reminder Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage email reminder templates for payments and communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
          {previewMode ? (
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Edit Mode
            </Button>
          ) : (
            <Button onClick={() => setPreviewMode(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>
              Select a template to edit or preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => {
              const category = templateCategories.find(cat => cat.value === template.category);
              const IconComponent = category?.icon || Mail;
              
              return (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate.id === template.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="h-4 w-4 text-gray-500" />
                    <div className="font-medium">{template.name}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {category?.label || template.category}
                  </div>
                  {template.isDefault && (
                    <Badge variant="secondary" className="mt-1">Default</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {previewMode ? 'Email Preview' : 'Template Editor'}
                </CardTitle>
                <CardDescription>
                  {previewMode 
                    ? 'Preview how your email will look' 
                    : 'Customize your reminder template without coding'
                  }
                </CardDescription>
              </div>
              {!previewMode && (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {previewMode ? (
              // Preview Mode - Show how email will look
              <div className="border rounded-lg p-6 bg-white max-h-[600px] overflow-y-auto">
                <EmailPreview template={selectedTemplate} />
              </div>
            ) : (
              // Edit Mode - Show form fields
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="message">Message</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <BasicInfoEditor 
                    template={selectedTemplate} 
                    onChange={setSelectedTemplate}
                  />
                </TabsContent>

                <TabsContent value="message" className="space-y-4">
                  <MessageEditor 
                    template={selectedTemplate} 
                    onChange={setSelectedTemplate}
                  />
                </TabsContent>

                <TabsContent value="sections" className="space-y-4">
                  <SectionsEditor 
                    template={selectedTemplate} 
                    onChange={setSelectedTemplate}
                  />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <SettingsEditor 
                    template={selectedTemplate} 
                    onChange={setSelectedTemplate}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Basic Information Editor Component
function BasicInfoEditor({ 
  template, 
  onChange 
}: { 
  template: ReminderTemplate; 
  onChange: (template: ReminderTemplate) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={template.name}
          onChange={(e) => onChange({ ...template, name: e.target.value })}
          placeholder="Enter template name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-category">Reminder Category</Label>
        <Select
          value={template.category}
          onValueChange={(value: any) => onChange({ ...template, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templateCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-subject">Email Subject Line</Label>
        <Input
          id="email-subject"
          value={template.subject}
          onChange={(e) => onChange({ ...template, subject: e.target.value })}
          placeholder="e.g., Payment Reminder - {courseName}"
        />
        <p className="text-xs text-gray-500">
          You can use {'{studentName}'}, {'{courseName}'}, {'{amountDue}'} as placeholders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sender-name">Sender Name</Label>
          <Input
            id="sender-name"
            value={template.senderName}
            onChange={(e) => onChange({ ...template, senderName: e.target.value })}
            placeholder="UniqBrio Academy"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-email">Sender Email</Label>
          <Input
            id="sender-email"
            value={template.senderEmail}
            onChange={(e) => onChange({ ...template, senderEmail: e.target.value })}
            placeholder="support@uniqbrio.com"
          />
        </div>
      </div>
    </div>
  );
}

// Message Editor Component
function MessageEditor({ 
  template, 
  onChange 
}: { 
  template: ReminderTemplate; 
  onChange: (template: ReminderTemplate) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="greeting">Greeting</Label>
        <div className="flex gap-2">
          <Input
            id="greeting"
            value={template.greeting}
            onChange={(e) => onChange({ ...template, greeting: e.target.value })}
            placeholder="Dear"
            className="flex-1"
          />
          <div className="flex items-center space-x-2">
            <Switch
              checked={template.showStudentName}
              onCheckedChange={(checked) => 
                onChange({ ...template, showStudentName: checked })
              }
            />
            <Label>Show Name</Label>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Preview: "{template.greeting} {template.showStudentName ? '{Student Name}' : 'Student'},"
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="main-message">Main Message</Label>
        <Textarea
          id="main-message"
          value={template.mainMessage}
          onChange={(e) => onChange({ ...template, mainMessage: e.target.value })}
          placeholder="Write your main message here..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-instructions">Payment Instructions</Label>
        <Textarea
          id="payment-instructions"
          value={template.paymentInstructions}
          onChange={(e) => onChange({ ...template, paymentInstructions: e.target.value })}
          placeholder="Instructions for how to make payment..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="closing-message">Closing Message</Label>
        <Textarea
          id="closing-message"
          value={template.closingMessage}
          onChange={(e) => onChange({ ...template, closingMessage: e.target.value })}
          placeholder="Thank you message..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signature">Signature</Label>
        <Textarea
          id="signature"
          value={template.companySignature}
          onChange={(e) => onChange({ ...template, companySignature: e.target.value })}
          placeholder="Best regards,\nThe UniqBrio Team"
          rows={3}
        />
      </div>
    </div>
  );
}

// Sections Editor Component
function SectionsEditor({ 
  template, 
  onChange 
}: { 
  template: ReminderTemplate; 
  onChange: (template: ReminderTemplate) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Payment Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Information</CardTitle>
            <Switch
              checked={template.showPaymentInfo}
              onCheckedChange={(checked) => 
                onChange({ ...template, showPaymentInfo: checked })
              }
            />
          </div>
        </CardHeader>
        {template.showPaymentInfo && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showAmountDue}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showAmountDue: checked })
                  }
                />
                <Label>Amount Due</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showDueDate}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showDueDate: checked })
                  }
                />
                <Label>Due Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showPaymentMethods}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showPaymentMethods: checked })
                  }
                />
                <Label>Payment Methods</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Course Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Course Information</CardTitle>
            <Switch
              checked={template.showCourseInfo}
              onCheckedChange={(checked) => 
                onChange({ ...template, showCourseInfo: checked })
              }
            />
          </div>
        </CardHeader>
        {template.showCourseInfo && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showCourseName}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showCourseName: checked })
                  }
                />
                <Label>Course Name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showCohortInfo}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showCohortInfo: checked })
                  }
                />
                <Label>Cohort Information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showStartDate}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showStartDate: checked })
                  }
                />
                <Label>Start Date</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Button Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Call-to-Action Button</CardTitle>
            <Switch
              checked={template.showActionButton}
              onCheckedChange={(checked) => 
                onChange({ ...template, showActionButton: checked })
              }
            />
          </div>
        </CardHeader>
        {template.showActionButton && (
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={template.actionButtonText}
                onChange={(e) => onChange({ ...template, actionButtonText: e.target.value })}
                placeholder="Make Payment Now"
              />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input
                value={template.actionButtonLink}
                onChange={(e) => onChange({ ...template, actionButtonLink: e.target.value })}
                placeholder="https://uniqbrio.com/payment"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <Switch
              checked={template.showContactInfo}
              onCheckedChange={(checked) => 
                onChange({ ...template, showContactInfo: checked })
              }
            />
          </div>
        </CardHeader>
        {template.showContactInfo && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  value={template.supportEmail}
                  onChange={(e) => onChange({ ...template, supportEmail: e.target.value })}
                  placeholder="support@uniqbrio.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Support Phone</Label>
                <Input
                  value={template.supportPhone}
                  onChange={(e) => onChange({ ...template, supportPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Settings Editor Component
function SettingsEditor({ 
  template, 
  onChange 
}: { 
  template: ReminderTemplate; 
  onChange: (template: ReminderTemplate) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Urgency Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Urgency Level</Label>
            <Select
              value={template.urgencyLevel}
              onValueChange={(value: any) => onChange({ ...template, urgencyLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority (Urgent)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={template.showUrgencyIndicator}
              onCheckedChange={(checked) => 
                onChange({ ...template, showUrgencyIndicator: checked })
              }
            />
            <Label>Show Urgency Indicator in Subject</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Email Preview Component
function EmailPreview({ template }: { template: ReminderTemplate }) {
  const sampleData = {
    studentName: 'Shaziaaa Farheen',
    courseName: 'Chess',
    cohortName: 'Evening Batch',
    amountDue: '?10,500',
    dueDate: '25 Nov 2025',
    paymentDate: '19 Nov 2025'
  };

  const urgencyPrefix = template.showUrgencyIndicator ? {
    low: '',
    medium: '[Reminder] ',
    high: '[URGENT] '
  }[template.urgencyLevel] : '';

  return (
    <div className="bg-white border rounded-lg p-6 font-sans">
      {/* Email Header */}
      <div className="border-b pb-4 mb-6">
        <div className="text-sm text-gray-500 mb-2">
          <strong>From:</strong> {template.senderName} &lt;{template.senderEmail}&gt;
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <strong>Subject:</strong> {urgencyPrefix}{template.subject.replace('{courseName}', sampleData.courseName)}
        </div>
      </div>

      {/* Email Body */}
      <div className="space-y-4">
        {/* Greeting */}
        <p>
          {template.greeting} {template.showStudentName ? sampleData.studentName : 'Student'},
        </p>

        {/* Main Message */}
        <p>{template.mainMessage}</p>

        {/* Course Information */}
        {template.showCourseInfo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800">Course Details</h3>
            <div className="space-y-1 text-sm">
              {template.showCourseName && (
                <div><strong>Course:</strong> {sampleData.courseName}</div>
              )}
              {template.showCohortInfo && (
                <div><strong>Cohort:</strong> {sampleData.cohortName}</div>
              )}
              {template.showStartDate && (
                <div><strong>Started:</strong> {sampleData.paymentDate}</div>
              )}
            </div>
          </div>
        )}

        {/* Payment Information */}
        {template.showPaymentInfo && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-yellow-800">Payment Information</h3>
            <div className="space-y-1 text-sm">
              {template.showAmountDue && (
                <div><strong>Amount Due:</strong> {sampleData.amountDue}</div>
              )}
              {template.showDueDate && (
                <div><strong>Due Date:</strong> {sampleData.dueDate}</div>
              )}
              {template.showPaymentMethods && (
                <div><strong>Payment Methods:</strong> UPI, Credit Card, Bank Transfer</div>
              )}
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        <p>{template.paymentInstructions}</p>

        {/* Action Button */}
        {template.showActionButton && (
          <div className="text-center my-6">
            <a
              href={template.actionButtonLink}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {template.actionButtonText}
            </a>
          </div>
        )}

        {/* Contact Information */}
        {template.showContactInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <div className="text-sm space-y-1">
              <div>?? Email: {template.supportEmail}</div>
              <div>?? Phone: {template.supportPhone}</div>
            </div>
          </div>
        )}

        {/* Closing */}
        <p>{template.closingMessage}</p>

        {/* Signature */}
        <div className="whitespace-pre-line text-sm">
          {template.companySignature}
        </div>
      </div>
    </div>
  );
}
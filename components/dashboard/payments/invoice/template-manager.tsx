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
  FileText, Eye, Save, RotateCcw, Plus, 
  Building2, Phone, Mail, MapPin, Globe
} from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";

interface InvoiceTemplate {
  id: string;
  name: string;
  category: 'one-time-full' | 'partial-payment' | 'one-time-installments' | 'monthly-subscription';
  
  // Company Information
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo?: string;
  
  // Invoice Header
  invoiceTitle: string;
  showInvoiceNumber: boolean;
  showInvoiceDate: boolean;
  showDueDate: boolean;
  
  // Student Information Section
  showStudentSection: boolean;
  studentSectionTitle: string;
  showStudentId: boolean;
  showStudentName: boolean;
  showCourse: boolean;
  showCohort: boolean;
  
  // Payment Details Section
  showPaymentSection: boolean;
  paymentSectionTitle: string;
  showCourseFee: boolean;
  showRegistrationFee: boolean;
  showDiscount: boolean;
  showTotal: boolean;
  showPaidAmount: boolean;
  showBalance: boolean;
  showPaymentDate: boolean;
  showPaymentMode: boolean;
  
  // Footer Information
  footerText: string;
  showContactInfo: boolean;
  showThankYouMessage: boolean;
  
  // Styling Options
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  showBorder: boolean;
  
  isDefault: boolean;
}

const defaultTemplate: InvoiceTemplate = {
  id: 'default-invoice',
  name: 'Default Invoice Template',
  category: 'one-time-full',
  
  // Company Information
  companyName: 'UniqBrio Academy',
  companyAddress: '123 Education Street, Learning City, LC 12345',
  companyPhone: '+1 (555) 123-4567',
  companyEmail: 'support@uniqbrio.com',
  companyWebsite: 'www.uniqbrio.com',
  
  // Invoice Header
  invoiceTitle: 'Payment Invoice',
  showInvoiceNumber: true,
  showInvoiceDate: true,
  showDueDate: false,
  
  // Student Information
  showStudentSection: true,
  studentSectionTitle: 'Student Information',
  showStudentId: true,
  showStudentName: true,
  showCourse: true,
  showCohort: true,
  
  // Payment Details
  showPaymentSection: true,
  paymentSectionTitle: 'Payment Details',
  showCourseFee: true,
  showRegistrationFee: true,
  showDiscount: true,
  showTotal: true,
  showPaidAmount: true,
  showBalance: true,
  showPaymentDate: true,
  showPaymentMode: true,
  
  // Footer
  footerText: 'Thank you for choosing UniqBrio Academy!',
  showContactInfo: true,
  showThankYouMessage: true,
  
  // Styling
  primaryColor: '#3B82F6',
  fontSize: 'medium',
  showBorder: true,
  
  isDefault: true
};

export default function InvoiceTemplateManager() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([defaultTemplate]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>(defaultTemplate);
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
        description: "Invoice template has been saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save invoice template.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSelectedTemplate(defaultTemplate);
    setIsEditing(false);
  };

  const createNewTemplate = () => {
    const newTemplate: InvoiceTemplate = {
      ...defaultTemplate,
      id: `template-${Date.now()}`,
      name: 'New Invoice Template',
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
          <h1 className="text-3xl font-bold text-gray-900">Invoice Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage invoice templates for different payment types
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
              <FileText className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>
              Select a template to edit or preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate.id === template.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {template.category.replace('-', ' ')}
                </div>
                {template.isDefault && (
                  <Badge variant="secondary" className="mt-1">Default</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {previewMode ? 'Template Preview' : 'Template Editor'}
                </CardTitle>
                <CardDescription>
                  {previewMode 
                    ? 'Preview how your invoice will look' 
                    : 'Customize your invoice template without coding'
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
              // Preview Mode - Show how invoice will look
              <div className="border rounded-lg p-6 bg-white max-h-[600px] overflow-y-auto">
                <InvoicePreview template={selectedTemplate} />
              </div>
            ) : (
              // Edit Mode - Show form fields
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="company">Company</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="styling">Styling</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <BasicInfoEditor 
                    template={selectedTemplate} 
                    onChange={setSelectedTemplate}
                  />
                </TabsContent>

                <TabsContent value="company" className="space-y-4">
                  <CompanyInfoEditor 
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

                <TabsContent value="styling" className="space-y-4">
                  <StylingEditor 
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
  template: InvoiceTemplate; 
  onChange: (template: InvoiceTemplate) => void;
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
        <Label htmlFor="template-category">Payment Category</Label>
        <Select
          value={template.category}
          onValueChange={(value: any) => onChange({ ...template, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-time-full">One-Time Full Payment</SelectItem>
            <SelectItem value="partial-payment">Partial Payment</SelectItem>
            <SelectItem value="one-time-installments">One-Time with Installments</SelectItem>
            <SelectItem value="monthly-subscription">Monthly Subscription</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice-title">Invoice Title</Label>
        <Input
          id="invoice-title"
          value={template.invoiceTitle}
          onChange={(e) => onChange({ ...template, invoiceTitle: e.target.value })}
          placeholder="e.g., Payment Invoice, Fee Receipt"
        />
      </div>

      <div className="space-y-3">
        <Label>Header Information</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={template.showInvoiceNumber}
              onCheckedChange={(checked) => 
                onChange({ ...template, showInvoiceNumber: checked })
              }
            />
            <Label>Show Invoice Number</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={template.showInvoiceDate}
              onCheckedChange={(checked) => 
                onChange({ ...template, showInvoiceDate: checked })
              }
            />
            <Label>Show Invoice Date</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={template.showDueDate}
              onCheckedChange={(checked) => 
                onChange({ ...template, showDueDate: checked })
              }
            />
            <Label>Show Due Date</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Company Information Editor Component
function CompanyInfoEditor({ 
  template, 
  onChange 
}: { 
  template: InvoiceTemplate; 
  onChange: (template: InvoiceTemplate) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company-name">Company Name</Label>
        <Input
          id="company-name"
          value={template.companyName}
          onChange={(e) => onChange({ ...template, companyName: e.target.value })}
          placeholder="Your Company Name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-address">Address</Label>
        <Textarea
          id="company-address"
          value={template.companyAddress}
          onChange={(e) => onChange({ ...template, companyAddress: e.target.value })}
          placeholder="Company Address"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company-phone">Phone</Label>
          <Input
            id="company-phone"
            value={template.companyPhone}
            onChange={(e) => onChange({ ...template, companyPhone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-email">Email</Label>
          <Input
            id="company-email"
            value={template.companyEmail}
            onChange={(e) => onChange({ ...template, companyEmail: e.target.value })}
            placeholder="support@company.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-website">Website</Label>
        <Input
          id="company-website"
          value={template.companyWebsite}
          onChange={(e) => onChange({ ...template, companyWebsite: e.target.value })}
          placeholder="www.company.com"
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
  template: InvoiceTemplate; 
  onChange: (template: InvoiceTemplate) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Student Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Student Information Section</CardTitle>
            <Switch
              checked={template.showStudentSection}
              onCheckedChange={(checked) => 
                onChange({ ...template, showStudentSection: checked })
              }
            />
          </div>
        </CardHeader>
        {template.showStudentSection && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={template.studentSectionTitle}
                onChange={(e) => onChange({ ...template, studentSectionTitle: e.target.value })}
                placeholder="Student Information"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showStudentId}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showStudentId: checked })
                  }
                />
                <Label>Student ID</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showStudentName}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showStudentName: checked })
                  }
                />
                <Label>Student Name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showCourse}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showCourse: checked })
                  }
                />
                <Label>Course</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showCohort}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showCohort: checked })
                  }
                />
                <Label>Cohort</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment Details Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Details Section</CardTitle>
            <Switch
              checked={template.showPaymentSection}
              onCheckedChange={(checked) => 
                onChange({ ...template, showPaymentSection: checked })
              }
            />
          </div>
        </CardHeader>
        {template.showPaymentSection && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={template.paymentSectionTitle}
                onChange={(e) => onChange({ ...template, paymentSectionTitle: e.target.value })}
                placeholder="Payment Details"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showCourseFee}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showCourseFee: checked })
                  }
                />
                <Label>Course Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showRegistrationFee}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showRegistrationFee: checked })
                  }
                />
                <Label>Registration Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showDiscount}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showDiscount: checked })
                  }
                />
                <Label>Discount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showTotal}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showTotal: checked })
                  }
                />
                <Label>Total Amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showPaidAmount}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showPaidAmount: checked })
                  }
                />
                <Label>Paid Amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showBalance}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showBalance: checked })
                  }
                />
                <Label>Balance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showPaymentDate}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showPaymentDate: checked })
                  }
                />
                <Label>Payment Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={template.showPaymentMode}
                  onCheckedChange={(checked) => 
                    onChange({ ...template, showPaymentMode: checked })
                  }
                />
                <Label>Payment Mode</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Footer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Footer Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Footer Message</Label>
            <Textarea
              value={template.footerText}
              onChange={(e) => onChange({ ...template, footerText: e.target.value })}
              placeholder="Thank you message or additional information"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={template.showContactInfo}
                onCheckedChange={(checked) => 
                  onChange({ ...template, showContactInfo: checked })
                }
              />
              <Label>Show Contact Information</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={template.showThankYouMessage}
                onCheckedChange={(checked) => 
                  onChange({ ...template, showThankYouMessage: checked })
                }
              />
              <Label>Show Thank You Message</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Styling Editor Component
function StylingEditor({ 
  template, 
  onChange 
}: { 
  template: InvoiceTemplate; 
  onChange: (template: InvoiceTemplate) => void;
}) {
  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Gray', value: '#6B7280' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Primary Color</Label>
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                template.primaryColor === color.value
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onChange({ ...template, primaryColor: color.value })}
            >
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Font Size</Label>
        <Select
          value={template.fontSize}
          onValueChange={(value: any) => onChange({ ...template, fontSize: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={template.showBorder}
          onCheckedChange={(checked) => 
            onChange({ ...template, showBorder: checked })
          }
        />
        <Label>Show Border</Label>
      </div>
    </div>
  );
}

// Invoice Preview Component
function InvoicePreview({ template }: { template: InvoiceTemplate }) {
  const sampleData = {
    invoiceNumber: 'INV-202511-0001',
    invoiceDate: '19 Nov 2025',
    dueDate: '19 Dec 2025',
    studentId: 'STU0008',
    studentName: 'Shaziaaa Farheen',
    courseName: 'Chess',
    cohortName: 'Evening Batch',
    courseFee: '30,000',
    registrationFee: '1,500',
    discount: '2,000',
    totalAmount: '31,500',
    paidAmount: '21,000',
    balance: '10,500',
    paymentDate: '19 Nov 2025',
    paymentMode: 'UPI'
  };

  const fontSize = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }[template.fontSize];

  return (
    <div 
      className={`${fontSize} ${template.showBorder ? 'border-2 border-gray-200' : ''} p-6 rounded-lg`}
      style={{ borderColor: template.showBorder ? template.primaryColor : undefined }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: template.primaryColor }}>
          {template.companyName}
        </h1>
        <p className="text-gray-600 mb-4">{template.companyAddress}</p>
        <h2 className="text-xl font-semibold mb-2">{template.invoiceTitle}</h2>
        <div className="flex justify-center gap-6 text-sm text-gray-600">
          {template.showInvoiceNumber && <span>Invoice #: {sampleData.invoiceNumber}</span>}
          {template.showInvoiceDate && <span>Date: {sampleData.invoiceDate}</span>}
          {template.showDueDate && <span>Due: {sampleData.dueDate}</span>}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Student Information */}
      {template.showStudentSection && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: template.primaryColor }}>
            {template.studentSectionTitle}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {template.showStudentId && (
              <div><strong>Student ID:</strong> {sampleData.studentId}</div>
            )}
            {template.showStudentName && (
              <div><strong>Name:</strong> {sampleData.studentName}</div>
            )}
            {template.showCourse && (
              <div><strong>Course:</strong> {sampleData.courseName}</div>
            )}
            {template.showCohort && (
              <div><strong>Cohort:</strong> {sampleData.cohortName}</div>
            )}
          </div>
        </div>
      )}

      {/* Payment Details */}
      {template.showPaymentSection && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: template.primaryColor }}>
            {template.paymentSectionTitle}
          </h3>
          <div className="space-y-2 text-sm">
            {template.showCourseFee && (
              <div className="flex justify-between">
                <span>Course Fee:</span>
                <span>?{sampleData.courseFee}</span>
              </div>
            )}
            {template.showRegistrationFee && (
              <div className="flex justify-between">
                <span>Registration Fee:</span>
                <span>?{sampleData.registrationFee}</span>
              </div>
            )}
            {template.showDiscount && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-?{sampleData.discount}</span>
              </div>
            )}
            {template.showTotal && (
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Amount:</span>
                <span>?{sampleData.totalAmount}</span>
              </div>
            )}
            {template.showPaidAmount && (
              <div className="flex justify-between text-green-600">
                <span>Amount Paid:</span>
                <span>?{sampleData.paidAmount}</span>
              </div>
            )}
            {template.showBalance && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Outstanding Balance:</span>
                <span>?{sampleData.balance}</span>
              </div>
            )}
            <Separator className="my-2" />
            {template.showPaymentDate && (
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <span>{sampleData.paymentDate}</span>
              </div>
            )}
            {template.showPaymentMode && (
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span>{sampleData.paymentMode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <Separator className="mb-4" />
      <div className="text-center text-sm text-gray-600">
        {template.showThankYouMessage && (
          <p className="mb-2">{template.footerText}</p>
        )}
        {template.showContactInfo && (
          <div className="space-y-1">
            <p>?? {template.companyEmail} | ?? {template.companyPhone}</p>
            <p>?? {template.companyWebsite}</p>
          </div>
        )}
      </div>
    </div>
  );
}
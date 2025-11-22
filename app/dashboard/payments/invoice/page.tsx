import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import InvoiceTemplateManager from "@/components/dashboard/payments/invoice/template-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Button } from "@/components/dashboard/ui/button";
import { FileText, Eye, Download } from "lucide-react";

export default function InvoicePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600 mt-2">
          Manage invoice templates, generate invoices, and track payment receipts
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Invoice Templates</TabsTrigger>
          <TabsTrigger value="generator">Generate Invoice</TabsTrigger>
          <TabsTrigger value="history">Invoice History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <InvoiceTemplateManager />
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-green-600" />
                <CardTitle>Generate Invoice</CardTitle>
              </div>
              <CardDescription>
                Generate new invoices for students and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                This feature will allow you to generate invoices for individual students or batch generate invoices for multiple payments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-6 w-6 text-purple-600" />
                <CardTitle>Invoice History</CardTitle>
              </div>
              <CardDescription>
                View and download previously generated invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Eye className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Access all previously generated invoices, search by student or date, and download copies for your records.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
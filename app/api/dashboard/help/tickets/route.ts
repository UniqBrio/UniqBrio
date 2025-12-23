import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { HelpTicket } from "@/models/dashboard";
import type { IHelpTicket } from "@/models/dashboard";
import { sendTicketCreationEmail } from "@/lib/dashboard/email-service";
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { logEntityCreate, logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { AuditModule, IFieldChange } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

// GET - Fetch all help tickets or filter by status/email
export async function GET(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    const ticketId = searchParams.get('ticketId');
    
    let query: any = { tenantId: session.tenantId };
    
    // Filter by specific ticketId
    if (ticketId) {
      const ticket = await HelpTicket.findOne({ ticketId, tenantId: session.tenantId }).lean();
      if (!ticket) {
        return NextResponse.json({
          success: false,
          error: "Ticket not found"
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        ticket
      });
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by email
    if (email) {
      query.customerEmail = email.toLowerCase();
    }
    
    // Fetch tickets sorted by priority (high to low) and creation date (newest first)
    const tickets = await HelpTicket.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    
        console.log(`Fetched ${tickets.length} help tickets`);
        return NextResponse.json({
          success: true,
          tickets
        });
      } catch (error) {
        let message = "Unknown error";
        if (error instanceof Error) message = error.message;
        console.error("Error fetching help tickets:", message);
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 });
      }
    }
  );
}

// POST - Create a new help ticket
export async function POST(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");
        const body = await request.json();
    
    // Validate required fields
    if (!body.customerEmail || !body.title || !body.description) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: customerEmail, title, and description are required"
      }, { status: 400 });
    }
    
    // Calculate priority from impact and urgency
    const impact = body.impact || 2;
    const urgency = body.urgency || 2;
    const priority = impact + urgency;
    
    // Generate tenant-scoped ticket ID with retry logic for duplicate handling
    const { generateTicketId } = await import('@/lib/dashboard/id-generators')
    let newTicket: any;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Generate new ticket ID for each attempt
        console.log(`🎫 Generating ticket ID (attempt ${retryCount + 1}/${maxRetries}) for tenant: ${session.tenantId}`);
        const ticketId = await generateTicketId(session.tenantId);
        console.log(`🆔 Generated ticket ID: ${ticketId}`);
        
        // Create new ticket
        newTicket = await HelpTicket.create({
          tenantId: session.tenantId,
          ticketId,
          customerEmail: body.customerEmail,
          contactType: body.contactType || 'Email',
          title: body.title,
          description: body.description,
          impact,
          urgency,
          priority,
          attachments: body.attachments || [],
          status: body.status || 'Open',
          assignedTo: body.assignedTo
        });
        
        console.log(`✅ Created new help ticket: ${ticketId}`);
        break; // Success, exit retry loop
        
      } catch (createError: any) {
        console.error(`❌ Error creating ticket (attempt ${retryCount + 1}/${maxRetries}):`, {
          code: createError.code,
          message: createError.message,
          keyPattern: createError.keyPattern,
          keyValue: createError.keyValue
        });
        
        if (createError.code === 11000 && retryCount < maxRetries - 1) {
          // Duplicate key error, retry with new ID
          retryCount++;
          console.warn(`⚠️ Duplicate ticket ID detected, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Small delay
          continue;
        } else {
          // Other error or max retries exceeded
          console.error(`🚫 Failed to create ticket after ${retryCount + 1} attempts`);
          throw createError;
        }
      }
    }
    
    if (!newTicket) {
      throw new Error('Failed to create ticket after multiple attempts');
    }
    
    // Audit log: ticket creation
    try {
      await logEntityCreate(
        AuditModule.COMMUNITY,
        newTicket.ticketId,
        newTicket.title,
        session.userId,
        session.email,
        'super_admin',
        session.tenantId,
        getClientIp(request.headers),
        getUserAgent(request.headers),
        {
          ticketId: newTicket.ticketId,
          subject: newTicket.title,
          status: newTicket.status,
          priority,
          customerEmail: newTicket.customerEmail,
          contactType: newTicket.contactType,
          impact,
          urgency
        }
      );
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }
    
    // Send confirmation email to customer
    try {
      console.log(`📧 Attempting to send ticket creation email to: ${body.customerEmail}`);
      
      const priorityLabel = priority <= 2 ? 'Critical' : priority <= 4 ? 'High' : priority <= 6 ? 'Medium' : 'Low';
      
      const emailSent = await sendTicketCreationEmail(
        body.customerEmail,
        {
          ticketId: newTicket.ticketId,
          title: newTicket.title,
          description: newTicket.description,
          priority: priorityLabel,
          status: newTicket.status,
          createdAt: newTicket.createdAt || new Date()
        }
      );
      
      if (emailSent) {
        console.log(`✅ Confirmation email sent successfully to ${body.customerEmail} for ticket ${newTicket.ticketId}`);
      } else {
        console.warn(`⚠️ Failed to send confirmation email to ${body.customerEmail} for ticket ${newTicket.ticketId}`);
        console.warn('⚠️ This could be due to missing SMTP configuration. Check SMTP_PASS environment variable.');
      }
    } catch (emailError: any) {
      // Log email error but don't fail the ticket creation
      console.error('❌ Email sending error:', emailError);
      console.error('❌ Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command
      });
    }
    
        return NextResponse.json({
          success: true,
          ticket: newTicket.toObject(),
          created: true
        }, { status: 201 });
      } catch (error) {
        let message = "Unknown error";
        if (error instanceof Error) message = error.message;
        console.error("Error creating help ticket:", message);
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 });
      }
    }
  );
}

// PUT - Update an existing help ticket
export async function PUT(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");
        const body = await request.json();
    
    if (!body.ticketId) {
      return NextResponse.json({
        success: false,
        error: "Ticket ID is required"
      }, { status: 400 });
    }
    
    // Fetch existing ticket for change tracking
    const existingTicket = await HelpTicket.findOne({ tenantId: session.tenantId, ticketId: body.ticketId });
    if (!existingTicket) {
      return NextResponse.json({
        success: false,
        error: "Ticket not found"
      }, { status: 404 });
    }
    
    // Prepare update data and track changes
    const updateData: any = {};
    const changes: IFieldChange[] = [];
    
    if (body.customerEmail && body.customerEmail !== existingTicket.customerEmail) {
      updateData.customerEmail = body.customerEmail;
      changes.push({ field: 'customerEmail', oldValue: existingTicket.customerEmail || '', newValue: body.customerEmail });
    }
    if (body.contactType && body.contactType !== existingTicket.contactType) {
      updateData.contactType = body.contactType;
      changes.push({ field: 'contactType', oldValue: existingTicket.contactType || '', newValue: body.contactType });
    }
    if (body.title && body.title !== existingTicket.title) {
      updateData.title = body.title;
      changes.push({ field: 'title', oldValue: existingTicket.title || '', newValue: body.title });
    }
    if (body.description && body.description !== existingTicket.description) {
      updateData.description = body.description;
      changes.push({ field: 'description', oldValue: existingTicket.description || '', newValue: body.description });
    }
    if (body.impact !== undefined && body.impact !== existingTicket.impact) {
      updateData.impact = body.impact;
      changes.push({ field: 'impact', oldValue: String(existingTicket.impact), newValue: String(body.impact) });
    }
    if (body.urgency !== undefined && body.urgency !== existingTicket.urgency) {
      updateData.urgency = body.urgency;
      changes.push({ field: 'urgency', oldValue: String(existingTicket.urgency), newValue: String(body.urgency) });
    }
    if (body.attachments !== undefined) {
      updateData.attachments = body.attachments;
      changes.push({ field: 'attachments', oldValue: JSON.stringify(existingTicket.attachments), newValue: JSON.stringify(body.attachments) });
    }
    if (body.status && body.status !== existingTicket.status) {
      updateData.status = body.status;
      changes.push({ field: 'status', oldValue: existingTicket.status || '', newValue: body.status });
    }
    if (body.assignedTo !== undefined && body.assignedTo !== existingTicket.assignedTo) {
      updateData.assignedTo = body.assignedTo;
      changes.push({ field: 'assignedTo', oldValue: existingTicket.assignedTo || '', newValue: body.assignedTo || '' });
    }
    
    // Recalculate priority if impact or urgency changed
    if (body.impact !== undefined || body.urgency !== undefined) {
      const newImpact = body.impact !== undefined ? body.impact : existingTicket.impact;
      const newUrgency = body.urgency !== undefined ? body.urgency : existingTicket.urgency;
      const newPriority = newImpact + newUrgency;
      if (newPriority !== existingTicket.priority) {
        updateData.priority = newPriority;
        changes.push({ field: 'priority', oldValue: String(existingTicket.priority), newValue: String(newPriority) });
      }
    }
    
    // Update resolved timestamp if status changed to Resolved or Closed
    if (body.status === 'Resolved' || body.status === 'Closed') {
      updateData.resolvedAt = new Date();
    }
    
    const updatedTicket = await HelpTicket.findOneAndUpdate(
      { tenantId: session.tenantId, ticketId: body.ticketId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedTicket) {
      return NextResponse.json({
        success: false,
        error: "Ticket not found"
      }, { status: 404 });
    }
    
        console.log(`Updated help ticket: ${body.ticketId}`);
        
        // Audit log: ticket update
        try {
          await logEntityUpdate(
            AuditModule.COMMUNITY,
            updatedTicket.ticketId,
            updatedTicket.title,
            changes,
            session.userId,
            session.email || 'Unknown User',
            'super_admin',
            session.tenantId,
            getClientIp(request.headers),
            getUserAgent(request.headers)
          );
        } catch (auditError) {
          console.error('Audit logging error:', auditError);
        }
        return NextResponse.json({
          success: true,
          ticket: updatedTicket.toObject(),
          updated: true
        });
      } catch (error) {
        let message = "Unknown error";
        if (error instanceof Error) message = error.message;
        console.error("Error updating help ticket:", message);
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 });
      }
    }
  );
}

// DELETE - Delete a help ticket
export async function DELETE(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");
        const body = await request.json();
        
        if (!body.ticketId) {
          return NextResponse.json({
            success: false,
            error: "Ticket ID is required"
          }, { status: 400 });
        }
        
        // Fetch ticket before deletion for audit logging
        const ticketToDelete = await HelpTicket.findOne({ ticketId: body.ticketId, tenantId: session.tenantId });
        
        if (!ticketToDelete) {
          return NextResponse.json({
            success: false,
            error: "Ticket not found"
          }, { status: 404 });
        }
        
        const result = await HelpTicket.deleteOne({ ticketId: body.ticketId });
        
        if (result.deletedCount === 0) {
          return NextResponse.json({
            success: false,
            error: "Ticket not found"
          }, { status: 404 });
        }
        
        console.log(`Deleted help ticket: ${body.ticketId}`);
        
        // Audit log: ticket deletion
        try {
          await logEntityDelete(
            AuditModule.COMMUNITY,
            ticketToDelete.ticketId,
            ticketToDelete.title,
            session.userId,
            session.email || 'Unknown User',
            'super_admin',
            session.tenantId,
            getClientIp(request.headers),
            getUserAgent(request.headers),
            {
              ticketId: ticketToDelete.ticketId,
              subject: ticketToDelete.title,
              status: ticketToDelete.status,
              priority: ticketToDelete.priority,
              customerEmail: ticketToDelete.customerEmail
            }
          );
        } catch (auditError) {
          console.error('Audit logging error:', auditError);
        }
        return NextResponse.json({
          success: true,
          deleted: true
        });
      } catch (error) {
        let message = "Unknown error";
        if (error instanceof Error) message = error.message;
        console.error("Error deleting help ticket:", message);
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 });
      }
    }
  );
}

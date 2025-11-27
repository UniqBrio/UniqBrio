import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { HelpTicket } from "@/models/dashboard";
import type { IHelpTicket } from "@/models/dashboard";
import { sendTicketCreationEmail } from "@/lib/dashboard/email-service";
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { logEntityCreate, logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { AuditModule } from '@/models/AuditLog';

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
    
    // Generate tenant-scoped ticket ID
    const { generateTicketId } = await import('@/lib/dashboard/id-generators')
    const ticketId = await generateTicketId(session.tenantId)
    
    // Create new ticket
    const newTicket = await HelpTicket.create({
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
    
    console.log(`Created new help ticket: ${ticketId}`);
    
    // Audit log: ticket creation
    try {
      await logEntityCreate({
        module: AuditModule.COMMUNITY,
        action: 'ticket_create',
        entityType: 'help_ticket',
        entityId: newTicket.ticketId,
        entityName: newTicket.title,
        details: {
          ticketId: newTicket.ticketId,
          subject: newTicket.title,
          status: newTicket.status,
          priority,
          customerEmail: newTicket.customerEmail,
          contactType: newTicket.contactType,
          impact,
          urgency
        },
        userId: session.userId,
        userEmail: session.email,
        userRole: 'super_admin',
        tenantId: session.tenantId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers)
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }
    
    // Send confirmation email to customer
    try {
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
        console.log(`✅ Confirmation email sent to ${body.customerEmail} for ticket ${ticketId}`);
      } else {
        console.warn(`⚠️ Failed to send confirmation email to ${body.customerEmail} for ticket ${ticketId}`);
      }
    } catch (emailError) {
      // Log email error but don't fail the ticket creation
      console.error('Email sending error:', emailError);
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
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    
    if (body.customerEmail && body.customerEmail !== existingTicket.customerEmail) {
      updateData.customerEmail = body.customerEmail;
      changes.customerEmail = { oldValue: existingTicket.customerEmail, newValue: body.customerEmail };
    }
    if (body.contactType && body.contactType !== existingTicket.contactType) {
      updateData.contactType = body.contactType;
      changes.contactType = { oldValue: existingTicket.contactType, newValue: body.contactType };
    }
    if (body.title && body.title !== existingTicket.title) {
      updateData.title = body.title;
      changes.title = { oldValue: existingTicket.title, newValue: body.title };
    }
    if (body.description && body.description !== existingTicket.description) {
      updateData.description = body.description;
      changes.description = { oldValue: existingTicket.description, newValue: body.description };
    }
    if (body.impact !== undefined && body.impact !== existingTicket.impact) {
      updateData.impact = body.impact;
      changes.impact = { oldValue: existingTicket.impact, newValue: body.impact };
    }
    if (body.urgency !== undefined && body.urgency !== existingTicket.urgency) {
      updateData.urgency = body.urgency;
      changes.urgency = { oldValue: existingTicket.urgency, newValue: body.urgency };
    }
    if (body.attachments !== undefined) {
      updateData.attachments = body.attachments;
      changes.attachments = { oldValue: existingTicket.attachments, newValue: body.attachments };
    }
    if (body.status && body.status !== existingTicket.status) {
      updateData.status = body.status;
      changes.status = { oldValue: existingTicket.status, newValue: body.status };
    }
    if (body.assignedTo !== undefined && body.assignedTo !== existingTicket.assignedTo) {
      updateData.assignedTo = body.assignedTo;
      changes.assignedTo = { oldValue: existingTicket.assignedTo, newValue: body.assignedTo };
    }
    
    // Recalculate priority if impact or urgency changed
    if (body.impact !== undefined || body.urgency !== undefined) {
      const newImpact = body.impact !== undefined ? body.impact : existingTicket.impact;
      const newUrgency = body.urgency !== undefined ? body.urgency : existingTicket.urgency;
      const newPriority = newImpact + newUrgency;
      if (newPriority !== existingTicket.priority) {
        updateData.priority = newPriority;
        changes.priority = { oldValue: existingTicket.priority, newValue: newPriority };
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
          await logEntityUpdate({
            module: AuditModule.COMMUNITY,
            action: 'ticket_update',
            entityType: 'help_ticket',
            entityId: updatedTicket.ticketId,
            entityName: updatedTicket.title,
            changes,
            details: {
              ticketId: updatedTicket.ticketId,
              subject: updatedTicket.title,
              status: updatedTicket.status,
              priority: updatedTicket.priority
            },
            userId: session.userId,
            userEmail: session.email,
            userRole: 'super_admin',
            tenantId: session.tenantId,
            ipAddress: getClientIp(request.headers),
            userAgent: getUserAgent(request.headers)
          });
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
          await logEntityDelete({
            module: AuditModule.COMMUNITY,
            action: 'ticket_delete',
            entityType: 'help_ticket',
            entityId: ticketToDelete.ticketId,
            entityName: ticketToDelete.title,
            details: {
              ticketId: ticketToDelete.ticketId,
              subject: ticketToDelete.title,
              status: ticketToDelete.status,
              priority: ticketToDelete.priority,
              customerEmail: ticketToDelete.customerEmail
            },
            userId: session.userId,
            userEmail: session.email,
            userRole: 'super_admin',
            tenantId: session.tenantId,
            ipAddress: getClientIp(request.headers),
            userAgent: getUserAgent(request.headers)
          });
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

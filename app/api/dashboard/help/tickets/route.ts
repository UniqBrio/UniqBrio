import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { HelpTicket } from "@/models/dashboard";
import type { IHelpTicket } from "@/models/dashboard";
import { sendTicketCreationEmail } from "@/lib/dashboard/email-service";
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

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
      const ticket = await HelpTicket.findOne({ ticketId }).lean();
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
    
    // Generate unique ticket ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const ticketId = `UB-${timestamp}${random}`;
    
    // Create new ticket
    const newTicket = new HelpTicket({
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
    
    await newTicket.save();
    
    console.log(`Created new help ticket: ${ticketId}`);
    
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
    
    // Prepare update data
    const updateData: any = {};
    if (body.customerEmail) updateData.customerEmail = body.customerEmail;
    if (body.contactType) updateData.contactType = body.contactType;
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.impact !== undefined) updateData.impact = body.impact;
    if (body.urgency !== undefined) updateData.urgency = body.urgency;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    if (body.status) updateData.status = body.status;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    
    // Recalculate priority if impact or urgency changed
    if (body.impact !== undefined || body.urgency !== undefined) {
      const ticket = await HelpTicket.findOne({ tenantId: session.tenantId, ticketId: body.ticketId });
      if (ticket) {
        const newImpact = body.impact !== undefined ? body.impact : ticket.impact;
        const newUrgency = body.urgency !== undefined ? body.urgency : ticket.urgency;
        updateData.priority = newImpact + newUrgency;
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
        
        const result = await HelpTicket.deleteOne({ ticketId: body.ticketId });
        
        if (result.deletedCount === 0) {
          return NextResponse.json({
            success: false,
            error: "Ticket not found"
          }, { status: 404 });
        }
        
        console.log(`Deleted help ticket: ${body.ticketId}`);
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

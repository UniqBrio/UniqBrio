import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import DemoBooking from "@/models/DemoBooking";
import { sendEmail } from "@/lib/dashboard/email-service";

export async function POST(req: Request) {
  try {
    // Connect to database
    await dbConnect();

    const body = await req.json();
    const { name, email, phone, academyType, numStudents } = body;

    // Validate required fields
    if (!name || !email || !phone || !academyType) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, phone, academyType" },
        { status: 400 }
      );
    }

    // Create demo booking in database
    const demoBooking = await DemoBooking.create({
      name,
      email,
      phone,
      academyType,
      numStudents: numStudents || undefined,
      status: "pending",
    });

    console.log("✅ Demo booking created:", demoBooking._id);

    // Send notification email to admin
    const adminEmail = "smilehappy2212@gmail.com";
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea; }
          .details-box h3 { margin-top: 0; color: #9333ea; }
          .details-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .details-row:last-child { border-bottom: none; }
          .details-label { font-weight: bold; width: 150px; color: #6b7280; }
          .details-value { flex: 1; color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; margin-top: 20px; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 New Demo Booking!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone just booked a demo on UniqBrio</p>
          </div>
          
          <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge">NEW BOOKING</span>
            </div>
            
            <div class="details-box">
              <h3>📋 Booking Details</h3>
              <div class="details-row">
                <div class="details-label">Academy Name:</div>
                <div class="details-value">${name}</div>
              </div>
              <div class="details-row">
                <div class="details-label">Email:</div>
                <div class="details-value"><a href="mailto:${email}" style="color: #9333ea; text-decoration: none;">${email}</a></div>
              </div>
              <div class="details-row">
                <div class="details-label">Phone:</div>
                <div class="details-value"><a href="tel:${phone}" style="color: #9333ea; text-decoration: none;">${phone}</a></div>
              </div>
              <div class="details-row">
                <div class="details-label">Academy Type:</div>
                <div class="details-value">${academyType}</div>
              </div>
              ${numStudents ? `
              <div class="details-row">
                <div class="details-label">Number of Students:</div>
                <div class="details-value">${numStudents}</div>
              </div>
              ` : ''}
              <div class="details-row">
                <div class="details-label">Booking ID:</div>
                <div class="details-value">#${demoBooking._id}</div>
              </div>
              <div class="details-row">
                <div class="details-label">Submitted:</div>
                <div class="details-value">${new Date().toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}</div>
              </div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #9333ea; margin-top: 0;">📞 Next Steps</h3>
              <ol style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 10px;">Contact the academy owner within 24 hours</li>
                <li style="margin-bottom: 10px;">Schedule a personalized 30-minute demo</li>
                <li style="margin-bottom: 10px;">Update booking status in admin panel</li>
                <li>Follow up after demo session</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin/collections/demo-bookings" 
                 style="display: inline-block; background: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View in Admin Panel
              </a>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">This is an automated notification from UniqBrio Demo Booking System</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
New Demo Booking Received!

Academy Name: ${name}
Email: ${email}
Phone: ${phone}
Academy Type: ${academyType}
${numStudents ? `Number of Students: ${numStudents}\n` : ''}
Booking ID: #${demoBooking._id}
Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Next Steps:
1. Contact the academy owner within 24 hours
2. Schedule a personalized 30-minute demo
3. Update booking status in admin panel
4. Follow up after demo session

View in admin panel: ${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin/collections/demo-bookings

---
This is an automated notification from UniqBrio Demo Booking System
© ${new Date().getFullYear()} UniqBrio. All rights reserved.
    `;

    // Send notification email
    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `🎉 New Demo Booking from ${name}`,
      html: emailHtml,
      text: emailText,
    });

    if (emailSent) {
      console.log("✅ Notification email sent to admin");
    } else {
      console.warn("⚠️ Failed to send notification email");
    }

    return NextResponse.json({
      success: true,
      message: "Demo booking created successfully",
      bookingId: demoBooking._id,
    });

  } catch (error) {
    console.error("❌ Error creating demo booking:", error);
    return NextResponse.json(
      { 
        error: "Failed to create demo booking",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

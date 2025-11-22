import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { HelpChat } from "@/models/dashboard";
import type { IHelpChat, IChatMessage } from "@/models/dashboard";

// GET - Fetch all chats or a specific chat by ID
export async function GET(request: Request) {
  try {
    await dbConnect("uniqbrio");
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    
    // Fetch specific chat by ID
    if (chatId) {
      const chat = await HelpChat.findOne({ chatId }).lean();
      if (!chat) {
        return NextResponse.json({
          success: false,
          error: "Chat not found"
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        chat
      });
    }
    
    // Build query
    let query: any = {};
    if (userId) {
      query.userId = userId;
    }
    
    // Fetch chats sorted by last message date (newest first)
    let chatQuery = HelpChat.find(query).sort({ lastMessageAt: -1 });
    
    if (limit) {
      chatQuery = chatQuery.limit(parseInt(limit));
    }
    
    const chats = await chatQuery.lean();
    
    console.log(`Fetched ${chats.length} help chats`);
    return NextResponse.json({
      success: true,
      chats
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error fetching help chats:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}

// POST - Create a new chat or add a message to existing chat
export async function POST(request: Request) {
  try {
    await dbConnect("uniqbrio");
    const body = await request.json();
    
    // If chatId is provided, add message to existing chat
    if (body.chatId) {
      const chat = await HelpChat.findOne({ chatId: body.chatId });
      
      if (!chat) {
        return NextResponse.json({
          success: false,
          error: "Chat not found"
        }, { status: 404 });
      }
      
      // Validate message data
      if (!body.message || !body.message.role || !body.message.content) {
        return NextResponse.json({
          success: false,
          error: "Invalid message data. Required: role and content"
        }, { status: 400 });
      }
      
      // Add message to chat
      const newMessage: IChatMessage = {
        role: body.message.role,
        content: body.message.content,
        timestamp: new Date()
      };
      
      chat.messages.push(newMessage);
      chat.lastMessageAt = newMessage.timestamp;
      
      // Auto-generate name from first user message if still default
      if (chat.name === 'New Conversation' && chat.messages.length > 0) {
        const firstUserMessage = chat.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          chat.name = firstUserMessage.content.substring(0, 50) + 
                      (firstUserMessage.content.length > 50 ? '...' : '');
        }
      }
      
      await chat.save();
      
      console.log(`Added message to chat: ${body.chatId}`);
      return NextResponse.json({
        success: true,
        chat: chat.toObject(),
        messageAdded: true
      });
    }
    
    // Create new chat
    // Generate unique chat ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const chatId = `CHAT-${timestamp}${random}`;
    
    // Prepare initial messages array
    const initialMessages: IChatMessage[] = [];
    if (body.message && body.message.role && body.message.content) {
      initialMessages.push({
        role: body.message.role,
        content: body.message.content,
        timestamp: new Date()
      });
    }
    
    // Auto-generate name from first user message
    let chatName = body.name || 'New Conversation';
    if (chatName === 'New Conversation' && initialMessages.length > 0) {
      const firstUserMessage = initialMessages.find(m => m.role === 'user');
      if (firstUserMessage) {
        chatName = firstUserMessage.content.substring(0, 50) + 
                   (firstUserMessage.content.length > 50 ? '...' : '');
      }
    }
    
    const newChat = new HelpChat({
      chatId,
      name: chatName,
      userId: body.userId,
      messages: initialMessages,
      lastMessageAt: initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].timestamp : new Date()
    });
    
    await newChat.save();
    
    console.log(`Created new help chat: ${chatId}`);
    return NextResponse.json({
      success: true,
      chat: newChat.toObject(),
      created: true
    }, { status: 201 });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error creating/updating help chat:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}

// PUT - Update chat name or other properties
export async function PUT(request: Request) {
  try {
    await dbConnect("uniqbrio");
    const body = await request.json();
    
    if (!body.chatId) {
      return NextResponse.json({
        success: false,
        error: "Chat ID is required"
      }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.userId !== undefined) updateData.userId = body.userId;
    
    const updatedChat = await HelpChat.findOneAndUpdate(
      { chatId: body.chatId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedChat) {
      return NextResponse.json({
        success: false,
        error: "Chat not found"
      }, { status: 404 });
    }
    
    console.log(`Updated help chat: ${body.chatId}`);
    return NextResponse.json({
      success: true,
      chat: updatedChat.toObject(),
      updated: true
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error updating help chat:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}

// DELETE - Delete a chat
export async function DELETE(request: Request) {
  try {
    await dbConnect("uniqbrio");
    const body = await request.json();
    
    if (!body.chatId) {
      return NextResponse.json({
        success: false,
        error: "Chat ID is required"
      }, { status: 400 });
    }
    
    const result = await HelpChat.deleteOne({ chatId: body.chatId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Chat not found"
      }, { status: 404 });
    }
    
    console.log(`Deleted help chat: ${body.chatId}`);
    return NextResponse.json({
      success: true,
      deleted: true
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error deleting help chat:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}

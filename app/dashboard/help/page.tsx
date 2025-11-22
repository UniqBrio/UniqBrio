"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Badge } from "@/components/dashboard/ui/badge"
import { AlertCircle, Bot, HelpCircle, Send, Sparkles, History, ArrowLeft, Edit, Trash2, Plus, Paperclip, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { useToast } from "@/hooks/dashboard/use-toast"

export default function HelpPage() {
  const { toast } = useToast()
  const [customerEmail, setCustomerEmail] = useState("")
  const [ticketTitle, setTicketTitle] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [aiQuery, setAiQuery] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [currentConversation, setCurrentConversation] = useState<Array<{ role: string; message: string; time: string }>>([])
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null)
  const [chats, setChats] = useState([
    {
      id: "CHAT-001",
      question: "How do I reset my password?",
      preview: "You can reset your password by clicking on 'Forgot Password'...",
      date: "18-Jan-2024",
      time: "10:30 AM",
      messages: [
        { role: "user", message: "How do I reset my password?", time: "10:30 AM" },
        { role: "ai", message: "You can reset your password by clicking on 'Forgot Password' on the login page. You'll receive an email with a reset link. Click the link and follow the instructions to create a new password. The link is valid for 24 hours.", time: "10:30 AM" },
        { role: "user", message: "What if I don't receive the email?", time: "10:32 AM" },
        { role: "ai", message: "If you don't receive the email within 5 minutes, please check your spam folder. You can also contact support at support@uniqbrio.com or try requesting another reset link.", time: "10:32 AM" }
      ]
    },
    {
      id: "CHAT-002",
      question: "What are the different user roles?",
      preview: "The platform has four main roles: Super Admin, Admin...",
      date: "17-Jan-2024",
      time: "2:15 PM",
      messages: [
        { role: "user", message: "What are the different user roles?", time: "2:15 PM" },
        { role: "ai", message: "The platform has four main roles:\n\n1. Super Admin - Full system access and configuration\n2. Admin - Manage courses, users, and content\n3. Instructor - Teach classes and grade students\n4. Student - Access enrolled courses and materials\n\nEach role has specific permissions and capabilities.", time: "2:15 PM" },
        { role: "user", message: "Can an instructor create new courses?", time: "2:17 PM" },
        { role: "ai", message: "By default, instructors cannot create new courses. Only Admins and Super Admins have this permission. However, an Admin can grant course creation permissions to specific instructors if needed.", time: "2:17 PM" }
      ]
    },
    {
      id: "CHAT-003",
      question: "How to schedule a recurring class?",
      preview: "To schedule a recurring class, go to Schedule page and...",
      date: "16-Jan-2024",
      time: "4:45 PM",
      messages: [
        { role: "user", message: "How to schedule a recurring class?", time: "4:45 PM" },
        { role: "ai", message: "To schedule a recurring class, go to the Schedule page and click 'Add Session'. Fill in the class details, then check the 'Recurring' option. You can set the frequency (daily, weekly, monthly) and end date. The system will automatically create all sessions based on your pattern.", time: "4:45 PM" }
      ]
    },
    {
      id: "CHAT-004",
      question: "How to export student reports?",
      preview: "Navigate to Analytics section and click the Export button...",
      date: "15-Jan-2024",
      time: "11:20 AM",
      messages: [
        { role: "user", message: "How to export student reports?", time: "11:20 AM" },
        { role: "ai", message: "Navigate to the Analytics section and click the Export button. You can choose between CSV or PDF format. Select the date range and students you want to include in the report. The file will be downloaded to your device automatically.", time: "11:20 AM" },
        { role: "user", message: "Can I schedule automatic exports?", time: "11:22 AM" },
        { role: "ai", message: "Yes! In the Analytics section, go to Settings > Scheduled Reports. You can set up automatic exports to be sent via email daily, weekly, or monthly. Choose your preferred format and recipients.", time: "11:22 AM" }
      ]
    }
  ])
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editedChatName, setEditedChatName] = useState("")
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [viewingTicket, setViewingTicket] = useState<any>(null)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(false)

  // Fetch tickets from backend on component mount
  useEffect(() => {
    fetchTickets()
  }, [])

  // Fetch chats from backend on component mount
  useEffect(() => {
    fetchChats()
  }, [])

  const fetchTickets = async () => {
    setIsLoadingTickets(true)
    try {
      const response = await fetch('/api/dashboard/help/tickets')
      const data = await response.json()
      if (data.success) {
        // Transform backend data to frontend format
        const transformedTickets = data.tickets.map((ticket: any) => {
          const date = new Date(ticket.createdAt);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`;
          return {
            id: ticket.ticketId,
            title: ticket.title,
            status: ticket.status,
            priority: getPriorityLabel(ticket.priority),
            date: formattedDate,
            customerEmail: ticket.customerEmail,
            contactType: ticket.contactType,
            description: ticket.description,
            impact: `${ticket.impact} - ${getImpactLabel(ticket.impact)}`,
            urgency: `${ticket.urgency} - ${getUrgencyLabel(ticket.urgency)}`,
            calculatedPriority: `Priority ${ticket.priority}`,
            attachments: ticket.attachments.map((att: any) => att.name)
          };
        }).sort((a: any, b: any) => {
          // Sort so that Resolved tickets appear last
          if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
          if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
          return 0;
        })
        setTickets(transformedTickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setIsLoadingTickets(false)
    }
  }

  const fetchChats = async () => {
    setIsLoadingChats(true)
    try {
      const response = await fetch('/api/dashboard/help/chats')
      const data = await response.json()
      if (data.success) {
        // Transform backend data to frontend format
        const transformedChats = data.chats.map((chat: any) => {
          const firstUserMessage = chat.messages.find((m: any) => m.role === 'user')
          const preview = chat.messages.length > 1 
            ? chat.messages[1].content.substring(0, 60) + '...'
            : 'No messages yet'
          
          const createdDate = new Date(chat.createdAt);
          const formattedDate = `${createdDate.getDate().toString().padStart(2, '0')}-${createdDate.toLocaleString('en-US', { month: 'short' })}-${createdDate.getFullYear()}`;
          
          return {
            id: chat.chatId,
            question: chat.name,
            preview,
            date: formattedDate,
            time: new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: chat.messages.map((m: any) => ({
              role: m.role,
              message: m.content,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
          }
        })
        setChats(transformedChats)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const getImpactLabel = (impact: number) => {
    switch (impact) {
      case 1: return 'Critical'
      case 2: return 'High'
      case 3: return 'Medium'
      case 4: return 'Low'
      default: return 'Unknown'
    }
  }

  const getUrgencyLabel = (urgency: number) => {
    switch (urgency) {
      case 1: return 'Critical'
      case 2: return 'High'
      case 3: return 'Medium'
      case 4: return 'Low'
      default: return 'Unknown'
    }
  }

  const getPriorityLabel = (priority: number) => {
    if (priority <= 2) return 'Critical'
    if (priority <= 4) return 'High'
    if (priority <= 6) return 'Medium'
    return 'Low'
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/csv', 'video/mp4']
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.csv', '.mp4']
      
      const newFiles = Array.from(e.target.files).filter(file => {
        const isTypeAllowed = allowedTypes.includes(file.type)
        const hasAllowedExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        
        if (!isTypeAllowed && !hasAllowedExtension) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not allowed. Only PNG, JPG, JPEG, CSV, and MP4 files are accepted.`,
            variant: "destructive",
            duration: 3000,
          })
          return false
        }
        return true
      })
      
      if (newFiles.length > 0) {
        setAttachments(prev => [...prev, ...newFiles])
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Prepare attachments data (file metadata)
      const attachmentsData = attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))

      const response = await fetch('/api/dashboard/help/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail,
          title: ticketTitle,
          description: ticketDescription,
          attachments: attachmentsData
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('Ticket created successfully:', data.ticket)
        
        // Show success toast
        toast({
          title: "✅ Ticket Created Successfully!",
          description: `Your ticket ${data.ticket.ticketId} has been created. We'll get back to you soon.`,
          duration: 5000,
        })
        
        // Refresh tickets list
        await fetchTickets()
        
        // Highlight the new ticket
        setHighlightedTicketId(data.ticket.ticketId)
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedTicketId(null)
        }, 3000)
        
        // Reset form
        setCustomerEmail("")
        setTicketTitle("")
        setTicketDescription("")
        setAttachments([])
        setCreatingTicket(false)
      } else {
        console.error('Error creating ticket:', data.error)
        toast({
          title: "❌ Failed to Create Ticket",
          description: data.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast({
        title: "❌ Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return
    
    setIsAiLoading(true)

    try {
      // If viewing a chat, add message to existing chat
      if (selectedChatId) {
        const userMessage = { role: "user", message: aiQuery, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        setCurrentConversation(prev => [...prev, userMessage])
        
        // Add message to backend
        const response = await fetch('/api/dashboard/help/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: selectedChatId,
            message: {
              role: 'user',
              content: aiQuery
            }
          })
        })

        const data = await response.json()

        if (data.success) {
          // Simulate AI response
          setTimeout(async () => {
            const aiResponseText = `Based on your query "${aiQuery}", here's what I can help you with:\n\nI understand you're asking about ${aiQuery}. Let me provide you with some helpful information and guidance to resolve your issue or answer your question.\n\nWould you like me to create a ticket for further assistance?`
            
            const aiMessage = { 
              role: "ai", 
              message: aiResponseText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            setCurrentConversation(prev => [...prev, aiMessage])
            
            // Add AI response to backend
            await fetch('/api/dashboard/help/chats', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chatId: selectedChatId,
                message: {
                  role: 'assistant',
                  content: aiResponseText
                }
              })
            })
            
            setAiQuery("")
            setIsAiLoading(false)
            fetchChats() // Refresh chat list
          }, 1500)
        } else {
          console.error('Error adding message:', data.error)
          setIsAiLoading(false)
        }
      } else {
        // Create new chat
        const response = await fetch('/api/dashboard/help/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              role: 'user',
              content: aiQuery
            }
          })
        })

        const data = await response.json()

        if (data.success) {
          // Simulate AI response
          setTimeout(async () => {
            const aiResponseText = `Based on your query "${aiQuery}", here's what I can help you with:\n\nI understand you're asking about ${aiQuery}. Let me provide you with some helpful information and guidance to resolve your issue or answer your question.\n\nWould you like me to create a support ticket for further assistance?`
            
            setAiResponse(aiResponseText)
            
            // Add AI response to the new chat
            await fetch('/api/dashboard/help/chats', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chatId: data.chat.chatId,
                message: {
                  role: 'assistant',
                  content: aiResponseText
                }
              })
            })
            
            setIsAiLoading(false)
            fetchChats() // Refresh chat list
          }, 1500)
        } else {
          console.error('Error creating chat:', data.error)
          setIsAiLoading(false)
        }
      }
    } catch (error) {
      console.error('Error processing AI query:', error)
      setIsAiLoading(false)
      alert('Failed to process your query. Please try again.')
    }
  }

  const handleViewChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setSelectedChatId(chatId)
      setCurrentConversation(chat.messages)
      setAiQuery("")
      setAiResponse("")
    }
  }

  const handleBackToNew = () => {
    setSelectedChatId(null)
    setCurrentConversation([])
    setAiQuery("")
    setAiResponse("")
  }

  const handleEditChatName = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setEditingChatId(chatId)
      setEditedChatName(chat.question)
    }
  }

  const handleSaveEditedName = async () => {
    if (editingChatId && editedChatName.trim()) {
      try {
        const response = await fetch('/api/dashboard/help/chats', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: editingChatId,
            name: editedChatName.trim()
          })
        })

        const data = await response.json()

        if (data.success) {
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === editingChatId 
                ? { ...chat, question: editedChatName.trim() }
                : chat
            )
          )
          setEditingChatId(null)
          setEditedChatName("")
        } else {
          console.error('Error updating chat name:', data.error)
          alert('Failed to update chat name: ' + data.error)
        }
      } catch (error) {
        console.error('Error saving chat name:', error)
        alert('Failed to save chat name. Please try again.')
      }
    }
  }

  const handleDeleteChat = (chatId: string) => {
    setDeletingChatId(chatId)
  }

  const confirmDeleteChat = async () => {
    if (deletingChatId) {
      try {
        const response = await fetch('/api/dashboard/help/chats', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: deletingChatId
          })
        })

        const data = await response.json()

        if (data.success) {
          setChats(prevChats => prevChats.filter(chat => chat.id !== deletingChatId))
          if (selectedChatId === deletingChatId) {
            handleBackToNew()
          }
          setDeletingChatId(null)
        } else {
          console.error('Error deleting chat:', data.error)
          alert('Failed to delete chat: ' + data.error)
          setDeletingChatId(null)
        }
      } catch (error) {
        console.error('Error deleting chat:', error)
        alert('Failed to delete chat. Please try again.')
        setDeletingChatId(null)
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-500"
      case "High": return "bg-orange-500"
      case "Medium": return "bg-yellow-500"
      case "Low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-500"
      case "In Progress": return "bg-yellow-500"
      case "Resolved": return "bg-green-500"
      case "Closed": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
                <HelpCircle className="h-8 w-8" />
                Help Center
              </h1>
              <p className="text-gray-500 mt-1">
                Create support tickets and get AI-powered assistance
              </p>
            </div>
           
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="tickets" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger
                value="tickets"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
              >
                <AlertCircle className="h-4 w-4" />
                Tickets
              </TabsTrigger>
              <TabsTrigger
                value="ai-assistant"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 font-medium rounded-md 
                  data-[state=active]:bg-muted data-[state=active]:text-muted-foreground data-[state=active]:border-border hover:data-[state=active]:bg-muted/80
                  data-[state=inactive]:bg-background data-[state=inactive]:text-foreground data-[state=inactive]:border-border data-[state=inactive]:hover:bg-accent"
              >
                <Bot className="h-4 w-4" />
                <span className="inline-flex items-center gap-1">AI Assistant <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" /></span>
              </TabsTrigger>
            </TabsList>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="space-y-6">
              {/* Tickets List Table */}
              <Card className="border-purple-200">
                <CardHeader className="border-b border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-purple-700">Your Tickets</CardTitle>
                      <CardDescription>
                        View and track all your submitted tickets
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setCreatingTicket(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Ticket
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingTickets ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading tickets...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No tickets found. Create your first ticket!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-purple-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ticket ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket) => (
                            <tr 
                              key={ticket.id}
                              onClick={() => setViewingTicket(ticket)}
                              className={`border-b border-gray-200 hover:bg-purple-50 transition-colors cursor-pointer ${
                                highlightedTicketId === ticket.id ? 'bg-purple-100' : ''
                              }`}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{ticket.id}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{ticket.title}</td>
                              <td className="px-4 py-3">
                                <Badge className={`${getStatusColor(ticket.status)} text-white text-xs`}>
                                  {ticket.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={`${getPriorityColor(ticket.priority)} text-white text-xs`}>
                                  {ticket.priority}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{ticket.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai-assistant" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 opacity-50 pointer-events-none">
                {/* AI Chat Interface */}
                <Card className="border-purple-200">
                  <CardHeader className="border-b border-purple-200 bg-gradient-to-br from-purple-50 via-purple-100 to-blue-50">
                    <div className="flex items-center gap-3">
                      {selectedChatId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToNew}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-purple-700">
                          {selectedChatId ? chats.find(c => c.id === selectedChatId)?.question : "AI Assistant"}
                        </CardTitle>
                        <CardDescription>
                          {selectedChatId ? "Continue your conversation" : "Get instant answers and personalized help powered by AI"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Conversation History */}
                      {selectedChatId && currentConversation.length > 0 && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                          {currentConversation.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user' 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-white border border-purple-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {msg.role === 'ai' && <Bot className="h-4 w-4 text-purple-600" />}
                                  <span className={`text-xs ${
                                    msg.role === 'user' ? 'text-purple-100' : 'text-muted-foreground'
                                  }`}>
                                    {msg.time}
                                  </span>
                                </div>
                                <p className={`text-sm whitespace-pre-line ${
                                  msg.role === 'user' ? 'text-white' : 'text-gray-700'
                                }`}>
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Query Input */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {selectedChatId ? "Continue conversation" : "Ask me anything"}
                          </label>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="e.g., How do I create a new course? What are the payment options? How to manage student enrollments?"
                              className="min-h-[100px] flex-1"
                              value={aiQuery}
                              onChange={(e) => setAiQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleAiQuery} 
                          disabled={!aiQuery.trim() || isAiLoading}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isAiLoading ? "Thinking..." : "Ask AI Assistant"}
                        </Button>
                      </div>

                      {/* AI Response for new conversations */}
                      {!selectedChatId && aiResponse && (
                        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                          <CardHeader>
                            <CardTitle className="text-purple-700 flex items-center gap-2">
                              <Bot className="h-5 w-5" />
                              AI Response
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{aiResponse}</p>
                            <div className="mt-4 flex gap-2">
                              <Button variant="outline" size="sm" className="border-purple-400 text-purple-600 hover:bg-purple-50">
                                Was this helpful?
                              </Button>
                            <Button variant="outline" size="sm" className="border-orange-400 text-orange-600 hover:bg-orange-50">
                              Create Ticket
                            </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Suggested Questions - only show for new conversations */}
                      {!selectedChatId && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3 text-purple-700">Suggested Questions</h3>
                          <div className="grid gap-2">
                            {[
                              "How do I reset my password?",
                              "What are the different user roles?",
                              "How to schedule a recurring class?",
                              "How to export student reports?",
                              "What payment methods are supported?"
                            ].map((question, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                className="justify-start text-left h-auto py-3 px-4 border-orange-400 text-orange-600 hover:bg-orange-50"
                                onClick={() => setAiQuery(question)}
                              >
                                <Bot className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm">{question}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Chat History */}
                <Card className="border-purple-200">
                  <CardHeader className="border-b border-purple-200 bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-orange-700 flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Chat History
                        </CardTitle>
                        <CardDescription>
                          View your previous conversations with AI
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleBackToNew}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Chat
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3 max-h-[600px] overflow-y-auto" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#a78bfa #ede9fe'
                    }}>
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          width: 8px;
                        }
                        div::-webkit-scrollbar-track {
                          background: #ede9fe;
                          border-radius: 10px;
                        }
                        div::-webkit-scrollbar-thumb {
                          background: #a78bfa;
                          border-radius: 10px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background: #8b5cf6;
                        }
                      `}</style>
                      {chats.map((chat) => (
                        <Card 
                          key={chat.id} 
                          className="border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                          onClick={() => handleViewChat(chat.id)}
                        >
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1">
                                  {chat.question}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-purple-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditChatName(chat.id)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 text-purple-600" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-red-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteChat(chat.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {chat.preview}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                <span>{chat.date}</span>
                                <span>•</span>
                                <span>{chat.time}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

      {/* Edit Chat Name Dialog */}
      <Dialog open={editingChatId !== null} onOpenChange={(open) => !open && setEditingChatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Give this conversation a new name to help you find it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedChatName}
              onChange={(e) => setEditedChatName(e.target.value)}
              placeholder="Enter conversation name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEditedName()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChatId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedName} className="bg-purple-600 hover:bg-purple-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={deletingChatId !== null} onOpenChange={(open) => !open && setDeletingChatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingChatId(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteChat} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={creatingTicket} onOpenChange={setCreatingTicket}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-700">Create New Ticket</DialogTitle>
            <DialogDescription>
              Submit a new ticket or issue you're experiencing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTicket} className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Email <span className="text-red-600">*</span></label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title <span className="text-red-600">*</span></label>
              <Input
                placeholder="Brief description of the issue"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description <span className="text-red-600">*</span></label>
              <Textarea
                placeholder="Provide detailed information about the ticket..."
                className="min-h-[120px]"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attachments</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.csv,.mp4,image/png,image/jpeg,image/jpg,text/csv,video/mp4"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors w-full"
                  >
                    <Paperclip className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Click to attach files (PNG, JPG, JPEG, CSV, MP4)</span>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreatingTicket(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Submit Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Ticket Details Dialog */}
      <Dialog open={viewingTicket !== null} onOpenChange={(open) => !open && setViewingTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-purple-700">{viewingTicket?.id}</span>
              <Badge className={`${getPriorityColor(viewingTicket?.priority || '')} text-white`}>
                {viewingTicket?.priority}
              </Badge>
              <Badge className={`${getStatusColor(viewingTicket?.status || '')} text-white`}>
                {viewingTicket?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Ticket details and information
            </DialogDescription>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Title</label>
                <p className="text-sm text-gray-900 mt-1">{viewingTicket.title}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Customer Email</label>
                <p className="text-sm text-gray-900 mt-1">{viewingTicket.customerEmail}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Contact Type</label>
                <p className="text-sm text-gray-900 mt-1">{viewingTicket.contactType}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1">{viewingTicket.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Impact</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingTicket.impact}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Urgency</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingTicket.urgency}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Calculated Priority</label>
                <div className="mt-1">
                  <Badge className="bg-purple-600 text-white">{viewingTicket.calculatedPriority}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Date Submitted</label>
                <p className="text-sm text-gray-900 mt-1">{viewingTicket.date}</p>
              </div>
              {viewingTicket.attachments && viewingTicket.attachments.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Attachments</label>
                  <div className="mt-2 space-y-2">
                    {viewingTicket.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingTicket(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  MessageCircle,
  FileText,
  Wrench,
  CreditCard,
  HelpCircle,
  Send,
  Bot,
  User,
  Loader2,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  agentName?: string
}

interface StoreInfo {
  propertyName: string
  tenantName: string
  unitNumber: string
  floor: string
  areaSqft: string
  leaseEnd: string
}

const quickActions = [
  {
    icon: Wrench,
    label: "Report Issue",
    description: "Submit a maintenance request",
    prompt: "I need to report a maintenance issue in my store",
  },
  {
    icon: CreditCard,
    label: "Payment Query",
    description: "Check invoice or payment status",
    prompt: "What is my current outstanding balance?",
  },
  {
    icon: FileText,
    label: "Lease Info",
    description: "View lease details",
    prompt: "Can you show me my lease details?",
  },
  {
    icon: HelpCircle,
    label: "Get Help",
    description: "General assistance",
    prompt: "I need help with something",
  },
]

const recentUpdates = [
  {
    type: "maintenance",
    title: "AC Repair Completed",
    description: "Work order #WO-2024-123 has been resolved",
    time: "2 hours ago",
    status: "success",
  },
  {
    type: "invoice",
    title: "Invoice Generated",
    description: "January 2026 rent invoice is now available",
    time: "1 day ago",
    status: "info",
  },
  {
    type: "notice",
    title: "Mall Hours Update",
    description: "Extended hours for Republic Day weekend",
    time: "3 days ago",
    status: "info",
  },
]

export default function TenantPortalPage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [storeInfo, setStoreInfo] = React.useState<StoreInfo | null>(null)
  const [isLoadingStore, setIsLoadingStore] = React.useState(true)

  // Fetch tenant store info
  React.useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        // In a real app, this would fetch the tenant's info based on their session
        const response = await fetch("/api/portal/store-info")
        if (response.ok) {
          const data = await response.json()
          setStoreInfo(data)
        }
      } catch (error) {
        console.error("Error fetching store info:", error)
      } finally {
        setIsLoadingStore(false)
      }
    }
    fetchStoreInfo()
  }, [])

  // Initialize messages on client side to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your Tenant Relations Assistant. How can I help you today? You can ask me about maintenance requests, lease information, payment queries, or any other concerns.",
        timestamp: new Date(),
        agentName: "Tenant Relations",
      },
    ])
  }, [])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: "portal-session",
          tenantId: "demo-tenant",
          propertyId: "demo-property",
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
        agentName: "Tenant Relations",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again or contact mall management directly.",
        timestamp: new Date(),
        agentName: "Tenant Relations",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt)
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenant Portal</h1>
            {isLoadingStore ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <p className="text-muted-foreground">
                {storeInfo?.propertyName || "Your Store"} - {storeInfo?.tenantName || "Retail"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Store Open
          </Badge>
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="flex h-[700px] flex-col overflow-hidden border-0 shadow-xl">
            {/* Chat Header */}
            <div className="border-b bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-white/30">
                    <AvatarImage src="/agent-avatar.png" />
                    <AvatarFallback className="bg-white/20">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-500 bg-green-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Tenant Relations Assistant</h2>
                  <p className="text-sm text-white/80">Always here to help</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <Avatar className={cn(
                      "h-8 w-8 shrink-0",
                      message.role === "assistant" && "bg-emerald-100"
                    )}>
                      {message.role === "assistant" ? (
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-slate-100 text-slate-700">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        message.role === "assistant"
                          ? "bg-slate-100 dark:bg-slate-800"
                          : "bg-emerald-500 text-white"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {mounted && (
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          message.role === "assistant"
                            ? "text-muted-foreground"
                            : "text-white/70"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0 bg-emerald-100">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="border-t bg-slate-50/50 px-4 py-3 dark:bg-slate-900/50">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="shrink-0 gap-2 whitespace-nowrap"
                    disabled={isLoading}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 dark:bg-slate-800"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Store Info Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  {isLoadingStore ? (
                    <>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{storeInfo?.tenantName || "Your Store"}</p>
                      <p className="text-xs text-muted-foreground">
                        {storeInfo?.unitNumber || "N/A"}, {storeInfo?.floor || "N/A"}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Area</p>
                  {isLoadingStore ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <p className="font-medium">{storeInfo?.areaSqft || "N/A"} sq ft</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Lease Ends</p>
                  {isLoadingStore ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <p className="font-medium">
                      {storeInfo?.leaseEnd 
                        ? new Date(storeInfo.leaseEnd).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                        : "N/A"
                      }
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUpdates.map((update, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn(
                    "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    update.status === "success" && "bg-green-100 text-green-600",
                    update.status === "info" && "bg-blue-100 text-blue-600"
                  )}>
                    {update.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{update.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {update.description}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {update.time}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full gap-2 text-sm">
                View All Updates
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Need Immediate Help?</CardTitle>
              <CardDescription className="text-slate-300">
                Our team is available 24/7
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 transition hover:bg-white/20"
              >
                <Phone className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">+91 98765 43210</p>
                  <p className="text-xs text-slate-300">Emergency Helpline</p>
                </div>
              </a>
              <a
                href="mailto:support@phoenixmall.com"
                className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 transition hover:bg-white/20"
              >
                <Mail className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">support@phoenixmall.com</p>
                  <p className="text-xs text-slate-300">Email Support</p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


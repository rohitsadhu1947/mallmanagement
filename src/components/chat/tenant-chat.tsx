"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfidenceMeter } from "@/components/agents/confidence-meter"
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  confidence?: number
  pendingApproval?: boolean
  actionTaken?: string
}

interface TenantChatProps {
  tenantId?: string
  tenantName?: string
  propertyId?: string
}

// Mock messages for demo
const mockMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Hi, the AC in my store (Unit 203) is not working properly. It's getting very hot and affecting our customers.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: "2",
    role: "assistant",
    content: "I understand the urgency of your AC issue in Unit 203. I've immediately created a high-priority work order (WO-2024-0847) for HVAC repair. Given the summer season and impact on your customers, I've assigned this to our fastest-responding HVAC technician.\n\n**Work Order Details:**\n- Priority: High\n- Category: HVAC\n- Estimated Response: Within 2 hours\n- Technician: Rajesh Kumar (4.8★ rating)\n\nI'll keep you updated on the technician's arrival. Is there anything else I can help you with?",
    timestamp: new Date(Date.now() - 9 * 60 * 1000),
    confidence: 0.92,
    actionTaken: "Work order created",
  },
  {
    id: "3",
    role: "user",
    content: "Thanks! Also, I wanted to ask about renewing my lease. It's expiring in 3 months.",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "4",
    role: "assistant",
    content: "Great question about your lease renewal! I've pulled up your lease details:\n\n**Current Lease Summary:**\n- Unit: 203 (1,200 sq ft)\n- Current Rent: ₹1,50,000/month\n- Expiry: April 15, 2024\n- Tenure: 3 years\n\nBased on your store's excellent performance (₹1,250/sq ft - 4% above mall average) and consistent rent payments, I'd like to recommend a renewal with favorable terms.\n\n**Proposed Renewal Options:**\n1. **3-year term**: 5% rent increase, 2 months rent-free\n2. **5-year term**: 3% rent increase, 3 months rent-free\n\nI can schedule a meeting with our leasing team to discuss these options. Would you prefer a call or in-person meeting?",
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    confidence: 0.78,
    pendingApproval: true,
  },
]

export function TenantChat({
  tenantName = "Lifestyle Fashion",
}: TenantChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(mockMessages)
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response - will be replaced with actual API call
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm processing your request. This is a demo response - the actual AI agent will provide intelligent, context-aware responses based on your mall data and history.",
        timestamp: new Date(),
        confidence: 0.85,
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder-store.png" />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tenantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{tenantName}</CardTitle>
              <p className="text-xs text-muted-foreground">Unit 203 • Active Tenant</p>
            </div>
          </div>
          <Badge variant="success" className="gap-1">
            <Bot className="h-3 w-3" />
            AI Assisted
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] space-y-2",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(message.timestamp)}
                    </span>

                    {message.role === "assistant" && message.confidence && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <ConfidenceMeter confidence={message.confidence} size="sm" />
                      </>
                    )}

                    {message.actionTaken && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="success" className="h-5 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {message.actionTaken}
                        </Badge>
                      </>
                    )}

                    {message.pendingApproval && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="warning" className="h-5 gap-1 text-[10px]">
                          <Clock className="h-3 w-3" />
                          Pending Approval
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-green-100 text-green-700">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Tenant Relations is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="pr-10"
              disabled={isTyping}
            />
            <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Powered by Tenant Relations AI Agent • Responses are AI-generated
        </p>
      </div>
    </Card>
  )
}


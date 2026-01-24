"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HelpCircle,
  Search,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Video,
  BookOpen,
  ExternalLink,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const faqs = [
  {
    question: "How do I add a new tenant?",
    answer: "Navigate to Tenants from the sidebar, click 'Add Tenant', fill in the comprehensive form with business details, contact information, tax & compliance details, banking information, and registered address. Click 'Create Tenant' when done.",
    category: "Tenants",
  },
  {
    question: "How do I create a lease agreement?",
    answer: "Go to Leases from the sidebar, click 'Create Lease'. Select a property and tenant, fill in unit details (unit number, floor, area), financial terms (rent, CAM charges, deposit), and lease terms (start/end date, lock-in period). Submit to create the lease.",
    category: "Leases",
  },
  {
    question: "How do I generate an invoice?",
    answer: "Navigate to Financials, click 'Create Invoice'. Select an active lease from the dropdown, choose invoice type (Rent, CAM, Utility), set the billing period and due date, enter the amount, and create the invoice.",
    category: "Financials",
  },
  {
    question: "How does property filtering work?",
    answer: "Use the property selector in the header to choose which property's data you want to view. All lists (tenants, leases, invoices, work orders) will automatically filter to show only data for the selected property.",
    category: "General",
  },
  {
    question: "How do I create a work order?",
    answer: "Go to Maintenance/Work Orders, click 'Create Work Order'. Select the category (HVAC, Plumbing, etc.), priority level, add a title and description, specify the location, and submit. You can also optionally link it to a tenant.",
    category: "Maintenance",
  },
  {
    question: "How do I record a payment?",
    answer: "In Financials, find the invoice and click the three-dot menu, then 'Record Payment'. Enter the payment amount, date, method, and reference number. The invoice status will update to 'Paid' when the full amount is received.",
    category: "Financials",
  },
  {
    question: "What user roles are available?",
    answer: "The system has several roles: Super Admin (full access), Organization Admin (org-level management), Property Manager (property operations), Accountant (financial operations), Maintenance Staff (work orders), Tenant User (self-service portal), and Viewer (read-only).",
    category: "Administration",
  },
  {
    question: "How do I manage compliance requirements?",
    answer: "Navigate to Compliance from the sidebar. Add new requirements with title, authority, due dates, and risk level. The system will track status and send reminders for upcoming deadlines.",
    category: "Compliance",
  },
]

const quickLinks = [
  { title: "User Guide", description: "Complete documentation", icon: BookOpen, href: "#" },
  { title: "Video Tutorials", description: "Step-by-step walkthroughs", icon: Video, href: "#" },
  { title: "API Documentation", description: "Developer resources", icon: FileText, href: "#" },
  { title: "Release Notes", description: "Latest updates", icon: ExternalLink, href: "#" },
]

export default function HelpPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [contactForm, setContactForm] = React.useState({
    subject: "",
    message: "",
  })

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: "Message Sent",
      description: "Our support team will get back to you within 24 hours.",
    })
    
    setContactForm({ subject: "", message: "" })
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers, get help, and contact our support team
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help topics..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Common questions and answers about using the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No FAQs match your search. Try different keywords.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="shrink-0">
                            {faq.category}
                          </Badge>
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Additional documentation and tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{link.title}</div>
                      <div className="text-sm text-muted-foreground">{link.description}</div>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Send us a message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">support@mallmanagement.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">+91 1800-XXX-XXXX</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Support Hours</div>
                  <div className="font-medium">Mon-Sat, 9 AM - 6 PM IST</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-medium text-emerald-800">System Status</div>
                  <div className="text-sm text-emerald-600">All systems operational</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


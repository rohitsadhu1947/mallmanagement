import { format } from "date-fns"

interface LeaseTerms {
  lockInPeriod?: number | null
  fitOutPeriod?: number | null
  rentFreePeriod?: number | null
  terminationNoticeDays?: number | null
  maintenanceCharges?: number | string | null
}

interface LeaseData {
  id: string
  unitNumber: string
  floor: number | null
  areaSqft: string | null
  baseRent: string | null
  maintenanceCharges: string | null
  camCharges: string | null
  securityDeposit: string | null
  startDate: string
  endDate: string
  status: string | null
  escalationRate: string | null
  escalationFrequency: string | null
  leaseType: string | null
  terms: LeaseTerms | null
}

interface TenantData {
  businessName: string
  legalEntityName: string | null
  contactPerson: string | null
  email: string | null
  phone: string | null
  gstin: string | null
  pan: string | null
  registeredAddress: string | null
  registeredCity: string | null
  registeredState: string | null
  registeredPincode: string | null
}

interface PropertyData {
  name: string
  address: string | null
  city: string | null
  state: string | null
}

interface LeaseDocumentOptions {
  lease: LeaseData
  tenant: TenantData
  property: PropertyData
  organizationName?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (num === 0) return 'Zero'
  if (num < 0) return 'Minus ' + numberToWords(Math.abs(num))

  let words = ''

  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore '
    num %= 10000000
  }

  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh '
    num %= 100000
  }

  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand '
    num %= 1000
  }

  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + ' Hundred '
    num %= 100
  }

  if (num > 0) {
    if (words !== '') words += 'and '
    if (num < 20) words += ones[num]
    else {
      words += tens[Math.floor(num / 10)]
      if (num % 10 > 0) words += '-' + ones[num % 10]
    }
  }

  return words.trim()
}

export function generateLeaseDocument(options: LeaseDocumentOptions): string {
  const { lease, tenant, property, organizationName = "Mall Management Pvt. Ltd." } = options
  
  const baseRent = parseFloat(lease.baseRent || "0")
  const maintenance = parseFloat(
    lease.maintenanceCharges || 
    lease.camCharges || 
    String(lease.terms?.maintenanceCharges || 0)
  )
  const securityDeposit = parseFloat(lease.securityDeposit || "0")
  const totalMonthly = baseRent + maintenance
  const escalationRate = lease.escalationRate || "5"
  const lockInPeriod = lease.terms?.lockInPeriod || 12
  const noticePeriod = lease.terms?.terminationNoticeDays || 90
  const fitOutPeriod = lease.terms?.fitOutPeriod || 0
  const rentFreePeriod = lease.terms?.rentFreePeriod || 0
  
  const startDate = new Date(lease.startDate)
  const endDate = new Date(lease.endDate)
  const leaseDurationMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const leaseDurationYears = Math.floor(leaseDurationMonths / 12)

  const documentDate = format(new Date(), "do MMMM yyyy")
  const agreementNumber = `LA/${new Date().getFullYear()}/${lease.id.slice(0, 8).toUpperCase()}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lease Agreement - ${tenant.businessName} - Unit ${lease.unitNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Crimson Text', Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
    }
    
    .document {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
    }
    
    .page {
      padding: 20mm 25mm;
      min-height: 297mm;
      page-break-after: always;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px double #2c3e50;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: 700;
      color: #2c3e50;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .header .subtitle {
      font-size: 14pt;
      color: #666;
      font-style: italic;
    }
    
    .agreement-number {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #666;
      margin-top: 10px;
    }
    
    .parties {
      margin: 30px 0;
    }
    
    .party {
      margin-bottom: 25px;
    }
    
    .party-title {
      font-weight: 600;
      font-size: 11pt;
      color: #2c3e50;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .party-details {
      padding-left: 20px;
      border-left: 3px solid #3498db;
    }
    
    .party-name {
      font-size: 14pt;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .party-info {
      font-size: 11pt;
      color: #444;
    }
    
    .section {
      margin: 25px 0;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #2c3e50;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    
    .clause {
      margin-bottom: 15px;
      text-align: justify;
    }
    
    .clause-number {
      font-weight: 600;
      color: #2c3e50;
    }
    
    .highlight {
      background: #f8f9fa;
      padding: 15px 20px;
      border-radius: 5px;
      margin: 15px 0;
    }
    
    .highlight-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .highlight-item {
      display: flex;
      flex-direction: column;
    }
    
    .highlight-label {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .highlight-value {
      font-size: 14pt;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .financial-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .financial-table th,
    .financial-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .financial-table th {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      font-weight: 600;
      color: #2c3e50;
      background: #f8f9fa;
    }
    
    .financial-table .amount {
      text-align: right;
      font-weight: 600;
    }
    
    .financial-table .total-row {
      background: #2c3e50;
      color: #fff;
    }
    
    .financial-table .total-row td {
      border-bottom: none;
      font-weight: 600;
    }
    
    .terms-list {
      list-style: none;
      padding: 0;
    }
    
    .terms-list li {
      margin-bottom: 12px;
      padding-left: 25px;
      position: relative;
    }
    
    .terms-list li::before {
      content: "•";
      position: absolute;
      left: 8px;
      color: #3498db;
      font-weight: bold;
    }
    
    .signature-section {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 50px;
      margin-top: 30px;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #1a1a1a;
      margin-top: 80px;
      padding-top: 10px;
    }
    
    .signature-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .signature-title {
      font-size: 10pt;
      color: #666;
    }
    
    .witness-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #ddd;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100pt;
      color: rgba(0,0,0,0.03);
      font-weight: bold;
      pointer-events: none;
      z-index: -1;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .document {
        max-width: none;
      }
      .page {
        padding: 15mm 20mm;
      }
      .no-print {
        display: none;
      }
    }
    
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #2c3e50;
      color: #fff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .print-btn:hover {
      background: #34495e;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  
  <div class="document">
    <div class="watermark">LEASE</div>
    
    <div class="page">
      <!-- Header -->
      <div class="header">
        <h1>LEASE AGREEMENT</h1>
        <div class="subtitle">Commercial Premises</div>
        <div class="agreement-number">Agreement No: ${agreementNumber}</div>
      </div>
      
      <!-- Preamble -->
      <p class="clause">
        This <strong>Lease Agreement</strong> ("Agreement") is executed on this <strong>${documentDate}</strong> 
        at ${property.city || "___________"}, ${property.state || "India"}.
      </p>
      
      <!-- Parties -->
      <div class="parties">
        <div class="party">
          <div class="party-title">Lessor (First Party)</div>
          <div class="party-details">
            <div class="party-name">${organizationName}</div>
            <div class="party-info">
              Owner/Operator of ${property.name}<br>
              ${property.address || ""}<br>
              ${property.city || ""}, ${property.state || "India"}
            </div>
          </div>
        </div>
        
        <div class="party">
          <div class="party-title">Lessee (Second Party)</div>
          <div class="party-details">
            <div class="party-name">${tenant.legalEntityName || tenant.businessName}</div>
            <div class="party-info">
              ${tenant.registeredAddress || ""}<br>
              ${tenant.registeredCity || ""}, ${tenant.registeredState || ""} ${tenant.registeredPincode || ""}<br>
              ${tenant.gstin ? `GSTIN: ${tenant.gstin}` : ""} ${tenant.pan ? `| PAN: ${tenant.pan}` : ""}<br>
              Contact: ${tenant.contactPerson || ""} | ${tenant.phone || ""} | ${tenant.email || ""}
            </div>
          </div>
        </div>
      </div>
      
      <p class="clause">
        <strong>WHEREAS</strong> the Lessor is the owner/operator of the commercial property known as 
        <strong>"${property.name}"</strong> and the Lessee is desirous of taking on lease certain premises 
        in the said property for commercial purposes;
      </p>
      
      <p class="clause">
        <strong>NOW THEREFORE</strong>, in consideration of the mutual covenants and agreements herein contained, 
        and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, 
        the parties agree as follows:
      </p>
      
      <!-- Property Details -->
      <div class="section">
        <div class="section-title">1. Demised Premises</div>
        
        <div class="highlight">
          <div class="highlight-grid">
            <div class="highlight-item">
              <span class="highlight-label">Unit Number</span>
              <span class="highlight-value">${lease.unitNumber}</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Floor</span>
              <span class="highlight-value">${lease.floor ?? "Ground"} Floor</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Carpet Area</span>
              <span class="highlight-value">${lease.areaSqft ? parseFloat(lease.areaSqft).toLocaleString() : "___"} sq.ft.</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Property</span>
              <span class="highlight-value">${property.name}</span>
            </div>
          </div>
        </div>
        
        <p class="clause">
          The Lessor hereby demises and leases to the Lessee, and the Lessee hereby takes on lease from 
          the Lessor, the above-described premises ("Demised Premises") for the purpose of conducting 
          ${tenant.businessName}'s business operations, subject to the terms and conditions hereinafter set forth.
        </p>
      </div>
      
      <!-- Lease Term -->
      <div class="section">
        <div class="section-title">2. Lease Term</div>
        
        <div class="highlight">
          <div class="highlight-grid">
            <div class="highlight-item">
              <span class="highlight-label">Commencement Date</span>
              <span class="highlight-value">${format(startDate, "dd MMMM yyyy")}</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Expiry Date</span>
              <span class="highlight-value">${format(endDate, "dd MMMM yyyy")}</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Total Duration</span>
              <span class="highlight-value">${leaseDurationYears > 0 ? `${leaseDurationYears} Year(s)` : ""} ${leaseDurationMonths % 12} Month(s)</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Lock-in Period</span>
              <span class="highlight-value">${lockInPeriod} Months</span>
            </div>
          </div>
        </div>
        
        <p class="clause">
          <span class="clause-number">2.1</span> The lease shall commence on <strong>${format(startDate, "dd MMMM yyyy")}</strong> 
          and shall continue for a period of ${leaseDurationYears > 0 ? `${leaseDurationYears} (${numberToWords(leaseDurationYears)}) year(s)` : ""} 
          ${leaseDurationMonths % 12 > 0 ? `${leaseDurationMonths % 12} (${numberToWords(leaseDurationMonths % 12)}) month(s)` : ""}, 
          expiring on <strong>${format(endDate, "dd MMMM yyyy")}</strong>, unless sooner terminated in accordance with the provisions hereof.
        </p>
        
        ${fitOutPeriod > 0 ? `
        <p class="clause">
          <span class="clause-number">2.2</span> The Lessee shall be entitled to a fit-out period of 
          <strong>${fitOutPeriod} (${numberToWords(fitOutPeriod)}) days</strong> from the commencement date for 
          interior works and setup, during which period no rent shall be payable.
        </p>
        ` : ""}
        
        ${rentFreePeriod > 0 ? `
        <p class="clause">
          <span class="clause-number">2.3</span> In addition to the fit-out period, the Lessee shall be entitled to a 
          rent-free period of <strong>${rentFreePeriod} (${numberToWords(rentFreePeriod)}) days</strong>.
        </p>
        ` : ""}
      </div>
    </div>
    
    <div class="page">
      <!-- Financial Terms -->
      <div class="section">
        <div class="section-title">3. Rent & Financial Terms</div>
        
        <table class="financial-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (Monthly)</th>
              <th>Amount (Annual)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base Rent</td>
              <td class="amount">${formatCurrency(baseRent)}</td>
              <td class="amount">${formatCurrency(baseRent * 12)}</td>
            </tr>
            <tr>
              <td>Common Area Maintenance (CAM) Charges</td>
              <td class="amount">${formatCurrency(maintenance)}</td>
              <td class="amount">${formatCurrency(maintenance * 12)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Monthly Payment</td>
              <td class="amount">${formatCurrency(totalMonthly)}</td>
              <td class="amount">${formatCurrency(totalMonthly * 12)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="highlight">
          <div class="highlight-grid">
            <div class="highlight-item">
              <span class="highlight-label">Security Deposit</span>
              <span class="highlight-value">${formatCurrency(securityDeposit)}</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Annual Escalation</span>
              <span class="highlight-value">${escalationRate}% per annum</span>
            </div>
          </div>
        </div>
        
        <p class="clause">
          <span class="clause-number">3.1</span> The Lessee agrees to pay to the Lessor a monthly rent of 
          <strong>${formatCurrency(baseRent)}</strong> (Rupees ${numberToWords(baseRent)} Only) plus applicable 
          maintenance charges of <strong>${formatCurrency(maintenance)}</strong>, totaling 
          <strong>${formatCurrency(totalMonthly)}</strong> per month, exclusive of GST and other applicable taxes.
        </p>
        
        <p class="clause">
          <span class="clause-number">3.2</span> The rent shall be payable in advance on or before the 
          <strong>7th day</strong> of each calendar month. If the rent or any part thereof remains unpaid for more 
          than <strong>fifteen (15) days</strong> after its due date, the Lessee shall pay interest at the rate of 
          <strong>18% per annum</strong> on the outstanding amount.
        </p>
        
        <p class="clause">
          <span class="clause-number">3.3</span> The rent shall be escalated by <strong>${escalationRate}%</strong> 
          per annum, effective from each anniversary of the commencement date.
        </p>
        
        <p class="clause">
          <span class="clause-number">3.4</span> The Lessee has deposited a sum of <strong>${formatCurrency(securityDeposit)}</strong> 
          (Rupees ${numberToWords(securityDeposit)} Only) as interest-free security deposit, which shall be refundable 
          upon expiry or earlier termination of this lease, subject to deductions for any outstanding dues or damages.
        </p>
      </div>
      
      <!-- Terms & Conditions -->
      <div class="section">
        <div class="section-title">4. Terms & Conditions</div>
        
        <ul class="terms-list">
          <li>
            <strong>Permitted Use:</strong> The Demised Premises shall be used exclusively for lawful 
            commercial/retail purposes as approved by the Lessor. Any change in use requires prior written consent.
          </li>
          <li>
            <strong>Maintenance:</strong> The Lessee shall maintain the Demised Premises in good condition 
            and shall not make any structural alterations without prior written approval from the Lessor.
          </li>
          <li>
            <strong>Operating Hours:</strong> The Lessee agrees to operate during the mall's standard 
            operating hours and comply with all mall regulations and guidelines.
          </li>
          <li>
            <strong>Insurance:</strong> The Lessee shall maintain adequate insurance coverage for the 
            contents and operations within the Demised Premises.
          </li>
          <li>
            <strong>Utilities:</strong> The Lessee shall be responsible for payment of all utilities 
            including electricity, water, and any other services consumed within the Demised Premises.
          </li>
          <li>
            <strong>Compliance:</strong> The Lessee shall comply with all applicable laws, rules, and 
            regulations, including fire safety, health, and sanitation requirements.
          </li>
          <li>
            <strong>Signage:</strong> All signage must conform to mall guidelines and require prior 
            approval from mall management.
          </li>
          <li>
            <strong>Assignment:</strong> The Lessee shall not assign, sublet, or transfer this lease 
            or any interest therein without the prior written consent of the Lessor.
          </li>
        </ul>
      </div>
    </div>
    
    <div class="page">
      <!-- Termination -->
      <div class="section">
        <div class="section-title">5. Termination</div>
        
        <p class="clause">
          <span class="clause-number">5.1</span> <strong>Lock-in Period:</strong> Neither party may terminate 
          this lease during the initial lock-in period of <strong>${lockInPeriod} (${numberToWords(lockInPeriod)}) months</strong> 
          from the commencement date, except in case of material breach.
        </p>
        
        <p class="clause">
          <span class="clause-number">5.2</span> <strong>Termination by Notice:</strong> After the lock-in period, 
          either party may terminate this lease by providing <strong>${noticePeriod} (${numberToWords(noticePeriod)}) days</strong> 
          prior written notice to the other party.
        </p>
        
        <p class="clause">
          <span class="clause-number">5.3</span> <strong>Termination for Breach:</strong> The Lessor may terminate 
          this lease immediately upon written notice if the Lessee: (a) fails to pay rent for more than 30 days; 
          (b) commits a material breach of any term hereof; (c) becomes insolvent or files for bankruptcy.
        </p>
        
        <p class="clause">
          <span class="clause-number">5.4</span> <strong>Surrender:</strong> Upon termination, the Lessee shall 
          peacefully vacate and surrender the Demised Premises in good condition, subject to normal wear and tear.
        </p>
      </div>
      
      <!-- Dispute Resolution -->
      <div class="section">
        <div class="section-title">6. Dispute Resolution</div>
        
        <p class="clause">
          <span class="clause-number">6.1</span> Any dispute arising out of or in connection with this Agreement 
          shall first be attempted to be resolved through amicable negotiations between the parties.
        </p>
        
        <p class="clause">
          <span class="clause-number">6.2</span> If the dispute cannot be resolved within thirty (30) days, 
          it shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The arbitration 
          shall be conducted in ${property.city || "New Delhi"}, India.
        </p>
        
        <p class="clause">
          <span class="clause-number">6.3</span> This Agreement shall be governed by and construed in accordance 
          with the laws of India. The courts of ${property.city || "New Delhi"} shall have exclusive jurisdiction.
        </p>
      </div>
      
      <!-- General -->
      <div class="section">
        <div class="section-title">7. General Provisions</div>
        
        <p class="clause">
          <span class="clause-number">7.1</span> This Agreement constitutes the entire agreement between the 
          parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter.
        </p>
        
        <p class="clause">
          <span class="clause-number">7.2</span> Any amendment or modification to this Agreement shall be 
          valid only if made in writing and signed by both parties.
        </p>
        
        <p class="clause">
          <span class="clause-number">7.3</span> All notices under this Agreement shall be in writing and 
          delivered by registered post, courier, or email to the addresses mentioned above.
        </p>
      </div>
      
      <!-- Signatures -->
      <div class="signature-section">
        <p><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Lease Agreement as of the date first above written.</p>
        
        <div class="signature-grid">
          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-name">For ${organizationName}</div>
              <div class="signature-title">Lessor / Authorized Signatory</div>
            </div>
          </div>
          
          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-name">For ${tenant.legalEntityName || tenant.businessName}</div>
              <div class="signature-title">Lessee / Authorized Signatory</div>
            </div>
          </div>
        </div>
        
        <div class="witness-section">
          <p><strong>WITNESSES:</strong></p>
          <div class="signature-grid">
            <div class="signature-block">
              <div class="signature-line">
                <div class="signature-title">Witness 1: Name, Address & Signature</div>
              </div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line">
                <div class="signature-title">Witness 2: Name, Address & Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This is a computer-generated document. Generated on ${format(new Date(), "dd MMM yyyy 'at' HH:mm")}</p>
        <p>Agreement Reference: ${agreementNumber}</p>
      </div>
    </div>
  </div>
  
  <script>
    // Auto-focus print button hint
    console.log('Press Ctrl/Cmd + P to print or save as PDF');
  </script>
</body>
</html>
`
}

export function openLeaseDocument(options: LeaseDocumentOptions): void {
  const html = generateLeaseDocument(options)
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const newWindow = window.open(url, "_blank")
  
  // Clean up after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}


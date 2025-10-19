# Quote Builder Prompt

Use this prompt to transform conversation data into a structured quote.

## Quote Structure

### Header Information
```json
{
  "client_name": "Full Name",
  "client_email": "email@example.com",
  "company_name": "Company Name",
  "project_title": "Descriptive Project Title",
  "quote_date": "YYYY-MM-DD",
  "quote_id": "Q-{timestamp}"
}
```

### Project Overview
Create a compelling 2-3 sentence summary that:
- Restates their business challenge
- Explains the automation solution
- Highlights the expected impact

**Example**: 
"Your e-commerce business is spending 15+ hours per week manually processing orders and updating inventory. We'll build an automated system that connects Shopify, your inventory database, and accounting software, reducing manual work by 80% and eliminating data entry errors."

### Deliverables
List 3-6 specific deliverables with clear descriptions:

```json
{
  "deliverables": [
    {
      "item": "Automated Order Processing",
      "desc": "Seamless order flow from Shopify to fulfillment with automatic inventory updates"
    },
    {
      "item": "Real-time Inventory Sync",
      "desc": "Two-way sync between warehouse management and online store"
    },
    {
      "item": "Custom Dashboard",
      "desc": "Visual analytics showing order status, inventory levels, and performance metrics"
    }
  ]
}
```

### Timeline Estimation

**Simple Projects** (1-2 weeks):
- Single tool integration
- Basic automation workflow
- Minimal customization

**Medium Projects** (2-4 weeks):
- Multiple tool integrations
- Custom logic and conditions
- Dashboard or reporting

**Complex Projects** (1-3 months):
- Enterprise-level integrations
- AI/ML components
- Custom application development
- Ongoing support and training

### Budget Calculation

**Factors to Consider**:
1. **Complexity**: Number of tools, custom logic, AI features
2. **Integrations**: APIs available? Custom connectors needed?
3. **Data Volume**: How much data to process?
4. **Customization**: Pre-built vs custom solutions
5. **Support**: Training, documentation, maintenance

**Pricing Tiers**:
- **Micro Automation**: $500 - $1,500
  - Single workflow
  - 2-3 tools
  - Zapier/Make.com based

- **Standard Automation**: $1,500 - $5,000
  - Multiple workflows
  - 3-5 tools
  - Custom scripting
  - Basic dashboard

- **Professional System**: $5,000 - $15,000
  - Complex workflows
  - 5+ integrations
  - AI components
  - Custom app/dashboard
  - Training included

- **Enterprise Solution**: $15,000+
  - Full-stack development
  - Advanced AI/ML
  - Dedicated support
  - Ongoing maintenance

## Quote Generation Process

1. **Analyze Conversation**: Extract key information from chat history
2. **Determine Complexity**: Assess project scope and requirements
3. **Calculate Timeline**: Based on deliverables and complexity
4. **Estimate Investment**: Select appropriate pricing tier
5. **Format Quote Data**: Structure for PDF generation
6. **Generate PDF**: Use quote template
7. **Send Email**: Deliver quote to client

## Example Quote Data

```json
{
  "client_name": "Sarah Johnson",
  "client_email": "sarah@example.com",
  "company_name": "TechStart Solutions",
  "project_title": "Customer Onboarding Automation",
  "summary": "TechStart is manually onboarding 20+ customers per week, spending 2 hours per customer on repetitive data entry, email sequences, and account setup. We'll build an intelligent onboarding system that automates account creation, personalizes welcome sequences, and integrates with your CRM, reducing onboarding time by 90%.",
  "deliverables": [
    {
      "item": "Automated Account Provisioning",
      "desc": "Instant account creation with custom permissions based on customer tier"
    },
    {
      "item": "Smart Email Sequences",
      "desc": "Personalized onboarding emails triggered by customer actions and milestones"
    },
    {
      "item": "CRM Integration",
      "desc": "Seamless sync with HubSpot for complete customer lifecycle tracking"
    },
    {
      "item": "Analytics Dashboard",
      "desc": "Real-time insights into onboarding completion rates and bottlenecks"
    }
  ],
  "timeline": "3-4 weeks",
  "budget": "AUD 4,500 - 6,000"
}
```


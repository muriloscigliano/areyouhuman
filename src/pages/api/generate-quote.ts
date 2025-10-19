import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { sendQuoteEmail } from '../../lib/sendEmail';

interface LeadData {
  name: string;
  email: string;
  business: string;
  role?: string;
  project_summary: string;
  project_title?: string;
  budget?: string;
  timeline?: string;
  deliverables?: Array<{ item: string; desc: string }>;
}

interface QuoteRequest {
  lead: LeadData;
  leadId?: string;
  conversationId?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: QuoteRequest = await request.json();
    const { lead, leadId, conversationId } = body;

    // Validate required fields
    if (!lead.name || !lead.email || !lead.business) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: name, email, and business are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Generating quote for:', lead.name);

    // Step 1: Save or update lead in Supabase
    let currentLeadId = leadId;
    
    if (isSupabaseConfigured()) {
      try {
        const leadData = {
          name: lead.name,
          email: lead.email,
          company: lead.business,
          role: lead.role || null,
          problem_text: lead.project_summary,
          budget_range: lead.budget || null,
          urgency: lead.timeline || null,
          status: 'quote_sent',
          source: 'chat'
        };

        if (currentLeadId) {
          // Update existing lead
          const { error } = await supabase
            .from('leads')
            .update(leadData)
            .eq('id', currentLeadId);

          if (error) {
            console.error('Error updating lead:', error);
          } else {
            console.log('✅ Lead updated in Supabase');
          }
        } else {
          // Create new lead
          const { data, error } = await supabase
            .from('leads')
            .insert([leadData])
            .select('id')
            .single();

          if (error) {
            console.error('Error creating lead:', error);
          } else if (data) {
            currentLeadId = data.id;
            console.log('✅ Lead created in Supabase:', currentLeadId);
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB fails
      }
    } else {
      console.warn('⚠️ Supabase not configured - skipping lead storage');
    }

    // Step 2: Prepare quote data
    const quoteData = {
      client_name: lead.name,
      project_title: lead.project_title || `${lead.business} Automation Project`,
      summary: lead.project_summary,
      deliverables: lead.deliverables || [
        { 
          item: 'Initial Consultation & Strategy', 
          desc: 'In-depth discovery session to map your automation goals' 
        },
        { 
          item: 'Custom Automation Design', 
          desc: 'Tailored workflow design using best-in-class tools' 
        },
        { 
          item: 'Implementation & Integration', 
          desc: 'Full setup, testing, and integration with your existing systems' 
        },
        { 
          item: 'Training & Documentation', 
          desc: 'Team training and comprehensive system documentation' 
        }
      ],
      timeline: lead.timeline || '4-6 weeks',
      budget: lead.budget || 'Custom quote based on scope',
      quote_date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      quote_id: `Q-${Date.now()}`
    };

    // Step 3: Generate PDF
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateQuotePDF(quoteData);
      console.log('✅ PDF generated');
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Continue without PDF for now
    }

    // Step 4: Upload PDF to Supabase Storage (if configured)
    let pdfUrl: string | undefined;
    
    if (pdfBuffer && isSupabaseConfigured()) {
      try {
        const fileName = `quote-${currentLeadId || Date.now()}-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('quote-files')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase
            .storage
            .from('quote-files')
            .getPublicUrl(fileName);
          
          pdfUrl = urlData.publicUrl;
          console.log('✅ PDF uploaded to storage:', pdfUrl);
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Continue without URL
      }
    }

    // Step 5: Save quote record to database
    if (currentLeadId && isSupabaseConfigured()) {
      try {
        await supabase
          .from('quotes')
          .insert([{
            lead_id: currentLeadId,
            quote_data: quoteData,
            pdf_url: pdfUrl || null,
            status: 'sent',
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }]);
        
        console.log('✅ Quote record saved to database');
      } catch (quoteError) {
        console.error('Error saving quote:', quoteError);
        // Continue even if this fails
      }
    }

    // Step 6: Send email with PDF
    try {
      await sendQuoteEmail(
        lead.email,
        {
          clientName: lead.name,
          projectTitle: quoteData.project_title,
          quoteUrl: pdfUrl
        },
        pdfBuffer
      );
      console.log('✅ Quote email sent to:', lead.email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Return success even if email fails (user still has the quote)
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Quote sent to ${lead.email}`,
        leadId: currentLeadId,
        quoteUrl: pdfUrl,
        quoteData
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Generate quote error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate quote',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};


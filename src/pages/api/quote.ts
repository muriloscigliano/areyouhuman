import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { sendQuoteEmail } from '../../lib/sendEmail';

/**
 * Quote Generation API
 * 
 * POST /api/quote
 * 
 * Creates a PDF quote from structured data and optionally emails it
 * 
 * Request body:
 * {
 *   lead_id: string,
 *   client_name: string,
 *   client_email: string,
 *   project_title: string,
 *   summary: string,
 *   deliverables: [{ item: string, desc: string }],
 *   timeline: string,
 *   budget: string,
 *   send_email: boolean (optional)
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    console.log('📄 Generating quote for:', data.project_title);
    
    // Validate required fields
    const required = ['client_name', 'project_title', 'summary', 'deliverables', 'timeline', 'budget'];
    for (const field of required) {
      if (!data[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Generate PDF
    const pdfBuffer = await generateQuotePDF({
      client_name: data.client_name,
      project_title: data.project_title,
      summary: data.summary,
      deliverables: data.deliverables,
      timeline: data.timeline,
      budget: data.budget
    });
    
    let pdfUrl = null;
    let quoteId = null;
    
    // Upload to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      try {
        const filename = `quote-${Date.now()}-${data.project_title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        const filePath = `quotes/${filename}`;
        
        // Upload PDF to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('quote-files')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('quote-files')
            .getPublicUrl(filePath);
          
          pdfUrl = urlData.publicUrl;
          console.log('✅ PDF uploaded:', pdfUrl);
        }
        
        // Save quote record to database
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .insert([{
            lead_id: data.lead_id,
            project_title: data.project_title,
            quote_data: {
              client_name: data.client_name,
              summary: data.summary,
              deliverables: data.deliverables,
              timeline: data.timeline,
              budget: data.budget
            },
            pdf_url: pdfUrl,
            status: 'sent'
          }])
          .select()
          .single();
        
        if (quoteError) {
          console.error('Error saving quote:', quoteError);
        } else {
          quoteId = quoteData.id;
          console.log('✅ Quote saved to database:', quoteId);
        }
      } catch (error) {
        console.error('Supabase operation failed:', error);
      }
    }
    
    // Send email if requested
    if (data.send_email && data.client_email) {
      try {
        await sendQuoteEmail(
          data.client_email,
          {
            clientName: data.client_name,
            projectTitle: data.project_title,
            quoteUrl: pdfUrl
          },
          pdfUrl ? undefined : pdfBuffer // Attach PDF if no URL available
        );
        console.log('✅ Email sent to:', data.client_email);
      } catch (error) {
        console.error('Email sending failed:', error);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        quote_id: quoteId,
        pdf_url: pdfUrl,
        message: 'Quote generated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Quote generation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate quote',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * GET /api/quote/:id
 * Retrieve a quote by ID
 */
export const GET: APIRoute = async ({ params, url }) => {
  const quoteId = url.searchParams.get('id');
  
  if (!quoteId) {
    return new Response(
      JSON.stringify({ error: 'Quote ID required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (!isSupabaseConfigured()) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (error) throw error;
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


import { ref } from 'vue';
import { supabase } from '../lib/supabase';

/**
 * Composable for Supabase operations
 * Handles database interactions for leads, conversations, and quotes
 */
export function useSupabase() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * Create a new lead in the database
   * @param {Object} leadData - Lead information
   * @returns {Promise<Object>} Created lead
   */
  async function createLead(leadData) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: dbError } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating lead:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Save a conversation message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Saved message
   */
  async function saveMessage(messageData) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: dbError } = await supabase
        .from('conversations')
        .insert([messageData])
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error saving message:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a quote record
   * @param {Object} quoteData - Quote information
   * @returns {Promise<Object>} Created quote
   */
  async function createQuote(quoteData) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: dbError } = await supabase
        .from('quotes')
        .insert([quoteData])
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating quote:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get lead by email
   * @param {string} email - Lead email
   * @returns {Promise<Object>} Lead data
   */
  async function getLeadByEmail(email) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: dbError } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .single();

      if (dbError && dbError.code !== 'PGRST116') throw dbError; // Ignore "not found" errors
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching lead:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Upload file to Supabase Storage
   * @param {string} bucket - Storage bucket name
   * @param {string} path - File path
   * @param {File|Blob} file - File to upload
   * @returns {Promise<Object>} Upload result with public URL
   */
  async function uploadFile(bucket, path, file) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        path: data.path,
        publicUrl: urlData.publicUrl
      };
    } catch (err) {
      error.value = err.message;
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    createLead,
    saveMessage,
    createQuote,
    getLeadByEmail,
    uploadFile
  };
}


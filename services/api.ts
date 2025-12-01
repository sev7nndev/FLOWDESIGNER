import { getSupabase } from "./supabaseClient";
import { LandingImage } from "../types";

const BACKEND_URL = "/api";

export const api = {
  // ... (other methods)

  getLandingImages: async (): Promise<LandingImage[]> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");

    // RLS is set to public read access, so no session is strictly needed for SELECT,
    // but we use the client for simplicity.
    const { data, error } = await supabase
      .from('landing_carousel_images')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error("Error fetching landing images:", error);
      throw new Error(error.message || "Falha ao carregar imagens da Landing Page.");
    }

    // The image_url stored is the path in the storage bucket. We need to generate the public URL.
    const { data: { publicUrl } } = supabase.storage.from('landing-carousel').getPublicUrl('placeholder');
    const baseUrl = publicUrl.replace('/placeholder', '');

    const imagesWithUrls: LandingImage[] = data.map(img => ({
      id: img.id,
      url: `${baseUrl}${img.image_url}`, // Construct the full public URL
      sortOrder: img.sort_order,
    }));

    return imagesWithUrls;
  },

  uploadLandingImage: async (file: File, userId: string): Promise<LandingImage> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para fazer upload.");

    const fileExtension = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExtension}`; // Path is just the filename for this bucket

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('landing-carousel')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(uploadError.message || "Falha ao fazer upload para o armazenamento.");
    }

    // 2. Insert record into DB
    const { data: newImage, error: dbError } = await supabase
      .from('landing_carousel_images')
      .insert({
        image_url: filePath, // Store the path
        created_by: userId,
      })
      .select()
      .single();

    if (dbError) {
      // Attempt to clean up the file if DB insert fails
      await supabase.storage.from('landing-carousel').remove([filePath]);
      throw new Error(dbError.message || "Falha ao registrar a imagem no banco de dados.");
    }

    // 3. Return the full object with public URL
    const { data: { publicUrl } } = supabase.storage.from('landing-carousel').getPublicUrl(filePath);

    return {
      id: newImage.id,
      url: publicUrl,
      sortOrder: newImage.sort_order,
    };
  },

  deleteLandingImage: async (id: string): Promise<void> => { // imagePath parameter removed
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Faça login para deletar imagens.");

    try {
        const response = await fetch(`${BACKEND_URL}/admin/landing-images/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}` 
            },
            // CRITICAL FIX: Removed body, backend will fetch path securely
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Falha ao deletar imagem da landing page: Status ${response.status}`);
        }
    } catch (error) {
        console.error("Error deleting landing image via backend:", error);
        throw error;
    }
  },
};
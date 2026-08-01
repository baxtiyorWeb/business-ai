import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface CollaborationProject {
  id: string | number;
  title: string;
  description: string;
  status: string;
  progress: number;
  comments_count: number;
  team: string[];
  updated_at?: string;
}

export function useCollaborations() {
  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("Barchasi");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);


  // Ma'lumotlarni bazadan optimallashtirilgan holda olish
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("collaborations").select("*");

      if (activeTab !== "Barchasi") {
        query = query.eq("status", activeTab);
      }

      if (searchQuery.trim() !== "") {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query.order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      toast.error("Hamkorlik loyihalarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Yangi loyiha qo'shish funksiyasi
  const createNewProject = async () => {
    try {
      setIsCreating(true);
      const newSample = {
        title: "Yangi Hamkorlik Loyihasi",
        description: "Sun'iy intellekt va dizayn integratsiyasi bo'yicha hamkorlik.",
        status: "Jarayonda",
        progress: 10,
        comments_count: 0,
        team: [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        ],
      };

      const { data, error } = await supabase
        .from("collaborations")
        .insert([newSample])
        .select();

      if (error) throw error;
      if (data) {
        setProjects((prev) => [data[0], ...prev]);
        toast.success("Yangi loyiha muvaffaqiyatli qo'shildi!");
      }
    } catch (error) {
      toast.error("Loyiha yaratishda xatolik yuz berdi");
    } finally {
      setIsCreating(false);
    }
  };

  return {
    projects,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    createNewProject,
    isCreating,
  };
}
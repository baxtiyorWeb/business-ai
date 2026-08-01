import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface DiscoverItem {
  id: string | number;
  title: string;
  author: string;
  category: string;
  likes: number;
  image: string;
}

export function useDiscover() {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("Barchasi");
  const [actionLoading, setActionLoading] = useState<string | number | null>(
    null,
  );


  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("discover_items").select("*");

      if (activeCategory !== "Barchasi") {
        query = query.eq("category", activeCategory);
      }

      if (search.trim() !== "") {
        query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Like bosish funksiyasi (Optimistik yangilanish bilan)
  const handleLike = async (id: string | number, currentLikes: number) => {
    try {
      setActionLoading(id);
      const newLikes = currentLikes + 1;

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, likes: newLikes } : item,
        ),
      );

      const { error } = await supabase
        .from("discover_items")
        .update({ likes: newLikes })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      toast.error("Like bosishda xatolik");
      fetchItems();
    } finally {
      setActionLoading(null);
    }
  };

  return {
    items,
    loading,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    handleLike,
    actionLoading,
  };
}

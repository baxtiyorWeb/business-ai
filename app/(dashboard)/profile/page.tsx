"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Camera,
  Save,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Trash2,
  Briefcase,
  Loader2,
  Globe,
  Lock,
  Image as ImageIcon,
  Grid,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, uploadAvatar, updatePassword, deleteAccount } = useProfile();
  
  const [uploading, setUploading] = useState(false);
  const [creations, setCreations] = useState<any[]>([]);
  const [loadingCreations, setLoadingCreations] = useState(false);
  const [activeTab, setActiveTab] = useState<"creations" | "settings">("creations");

  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "",
    bio: "",
  });

  // Password and Account Delete modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        role: profile.role || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  // Load user designs from DB
  useEffect(() => {
    if (user) {
      fetchUserCreations(user.id);
    }
  }, [user]);

  const fetchUserCreations = async (userId: string) => {
    try {
      setLoadingCreations(true);
      const { data, error } = await supabase
        .from("ai_creations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreations(data || []);
    } catch (err: any) {
      console.error("Error loading creations:", err.message);
    } finally {
      setLoadingCreations(false);
    }
  };

  // Toggle Public / Private status
  const handleTogglePublic = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("ai_creations")
        .update({ is_public: newStatus })
        .eq("id", id);

      if (error) throw error;

      setCreations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_public: newStatus } : item))
      );
      toast.success(newStatus ? "Design set to Public" : "Design set to Private");
    } catch (err: any) {
      toast.error("Failed to update design status");
    }
  };

  // Delete Design
  const handleDeleteCreation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_creations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCreations((prev) => prev.filter((item) => item.id !== id));
      toast.success("Design deleted successfully");
    } catch (err: any) {
      toast.error("Error deleting design");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);

      const promise = uploadAvatar(file);

      toast.promise(promise, {
        loading: "Uploading avatar...",
        success: "Avatar updated successfully!",
        error: (err) => `Error: ${err?.error || "Upload failed"}`,
      });

      await promise;
    } catch (err: any) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promise = updateProfile({
      full_name: formData.full_name,
      role: formData.role,
      bio: formData.bio,
    });

    toast.promise(promise, {
      loading: "Saving...",
      success: "Profile updated successfully!",
      error: "Error saving profile!",
    });

    const res = await promise;
    if (!res.error) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    const promise = updatePassword(newPassword);

    toast.promise(promise, {
      loading: "Updating password...",
      success: () => {
        setIsPasswordModalOpen(false);
        setNewPassword("");
        return "Password updated successfully!";
      },
      error: (err) => `Error: ${err}`,
    });
  };

  const handleDeleteAccountConfirm = async () => {
    const promise = deleteAccount();

    toast.promise(promise, {
      loading: "Deleting account...",
      success: () => {
        setIsDeleteModalOpen(false);
        window.location.href = "/login";
        return "Your account has been permanently deleted.";
      },
      error: (err) => `Error: ${err}`,
    });
  };

  if (loading && !profile) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-300 text-slate-100">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2.5">
            <User className="h-5 w-5 text-indigo-400" />
            User Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your personal details and generated AI designs.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#121215] border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("creations")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === "creations"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Grid className="h-3.5 w-3.5" />
            My Designs ({creations.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Settings & Security
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile Card (Always visible) */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-6 flex flex-col items-center text-center shadow-xl">
            <div className="relative group mb-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/10">
                <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-3xl font-bold text-white overflow-hidden relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Avatar"}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{formData.full_name ? formData.full_name.charAt(0).toUpperCase() : "U"}</span>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>

              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-5 w-5 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>

            <h2 className="text-base font-semibold text-white">
              {formData.full_name || "User"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{formData.email}</p>
            <p className="text-xs text-indigo-400 font-medium mt-1.5">
              {formData.role || "Role not specified"}
            </p>

            <div className="w-full mt-6 pt-6 border-t border-slate-800/60 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total designs</span>
                <span className="font-semibold text-white">{creations.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Account Type</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 font-medium text-indigo-400">
                  <Sparkles className="h-3 w-3" />
                  Free Plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: MY DESIGNS */}
          {activeTab === "creations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  My Auto-saved AI Designs
                </h3>
                <span className="text-xs text-slate-500">Manage as Public or Private</span>
              </div>

              {loadingCreations ? (
                <div className="w-full h-64 flex items-center justify-center rounded-xl border border-slate-800 bg-[#0f0f12]">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : creations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 rounded-xl border border-slate-800/80 bg-[#0f0f12] space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">No designs yet</p>
                    <p className="text-xs text-slate-500 mt-1">Create an image in the AI Studio, and it will automatically appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {creations.map((item) => (
                    <div 
                      key={item.id}
                      className="group relative rounded-xl border border-slate-800/80 bg-[#0f0f12] overflow-hidden flex flex-col shadow-md transition-all hover:border-slate-700"
                    >
                      {/* Image part */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                        <img 
                          src={item.image_url} 
                          alt={item.prompt} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Status badge */}
                        <div className="absolute top-2 left-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-md border shadow",
                            item.is_public 
                              ? "bg-indigo-950/80 border-indigo-500/30 text-indigo-300" 
                              : "bg-amber-950/80 border-amber-500/30 text-amber-300"
                          )}>
                            {item.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {item.is_public ? "Public" : "Private"}
                          </span>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-200 line-clamp-2">{item.prompt}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">{item.style}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">{item.ratio}</span>
                          </div>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                          <button
                            onClick={() => handleTogglePublic(item.id, item.is_public)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            {item.is_public ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                            {item.is_public ? "Make Private" : "Make Public"}
                          </button>

                          <button
                            onClick={() => handleDeleteCreation(item.id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE SETTINGS AND SECURITY */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              {/* Edit Details */}
              <form
                onSubmit={handleSave}
                className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-6 sm:p-8 space-y-5 shadow-xl"
              >
                <h3 className="text-sm font-medium text-white border-b border-slate-800/60 pb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" />
                  Edit Profile Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Full Name</label>
                    <Input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="h-10 border-slate-800 bg-[#121215] text-sm text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Email Address</label>
                    <Input
                      name="email"
                      type="email"
                      disabled
                      value={formData.email}
                      className="h-10 border-slate-800 bg-[#121215]/50 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Job Title / Role</label>
                  <Input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g., UI/UX Designer"
                    className="h-10 border-slate-800 bg-[#121215] text-sm text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">About Yourself (Bio)</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Briefly about yourself..."
                    className="w-full rounded-md border border-slate-800 bg-[#121215] p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  {isSaved ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Saved!</span>
                    </div>
                  ) : <div />}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-5 text-xs shadow-lg"
                  >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    Save Changes
                  </Button>
                </div>
              </form>

              {/* Security section */}
              <div className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-6 sm:p-8 space-y-5 shadow-xl">
                <h3 className="text-sm font-medium text-white border-b border-slate-800/60 pb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  Security & Privacy
                </h3>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm text-slate-200 font-medium">Change Password</p>
                    <p className="text-xs text-slate-400">Update your password to keep your account secure.</p>
                  </div>
                  <Button
                    onClick={() => setIsPasswordModalOpen(true)}
                    variant="outline"
                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs h-9"
                  >
                    <KeyRound className="mr-2 h-3.5 w-3.5" />
                    Change
                  </Button>
                </div>

                <div className="border-t border-slate-800/40 pt-4 flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm text-rose-400 font-medium">Delete Account</p>
                    <p className="text-xs text-slate-400">All your data and designs will be permanently deleted.</p>
                  </div>
                  <Button
                    onClick={() => setIsDeleteModalOpen(true)}
                    variant="destructive"
                    className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs h-9"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="bg-[#0f0f12] border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a new secure password (at least 6 characters).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="password"
              placeholder="New password..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-slate-800 bg-[#121215] text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="border-slate-800 bg-slate-900 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handlePasswordUpdate} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#0f0f12] border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-400">Are you sure you want to delete your account?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This action cannot be undone. All your generated designs and profile info will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="border-slate-800 bg-slate-900 text-slate-300">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccountConfirm} className="bg-rose-600 hover:bg-rose-500 text-white">
              Yes, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
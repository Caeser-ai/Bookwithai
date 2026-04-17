"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Edit2, Save, X } from "lucide-react";
import { z } from "zod";

const travelInfoSchema = z.object({
  passport_number: z.string().max(50).optional().or(z.literal("")),
  passport_expiry: z.string().optional().or(z.literal("")),
  tsa_number: z.string().max(50).optional().or(z.literal("")),
});
type TravelInfoValues = z.infer<typeof travelInfoSchema>;

interface TravelInformationProps {
  userId?: string;
}

const inputClass =
  "flex h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition-colors";

export function TravelInformation({ userId }: TravelInformationProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, isDirty },
  } = useForm<TravelInfoValues>({
    resolver: zodResolver(travelInfoSchema),
    defaultValues: {
      passport_number: "",
      passport_expiry: "",
      tsa_number: "",
    },
  });

  // Load travel document data
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/user/profile?user_id=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        const doc = data.documents;
        if (doc) {
          reset({
            passport_number: doc.passport_number ?? "",
            passport_expiry: doc.passport_expiry ?? "",
            tsa_number: doc.tsa_number ?? "",
          });
        }
      } catch {
        // Non-fatal
      }
    };
    load();
  }, [userId, reset]);

  const onSave = async (values: TravelInfoValues) => {
    if (!userId) {
      toast.error("Cannot save — user ID is missing.");
      return;
    }
    const toastId = toast.loading("Saving travel information…");
    try {
      const res = await fetch(`/api/user/profile?user_id=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passport_number: values.passport_number || null,
          passport_expiry: values.passport_expiry || null,
          tsa_number: values.tsa_number || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Save failed");
      toast.success("Travel information saved!", { id: toastId });
      setIsEditing(false);
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save travel information.",
        { id: toastId }
      );
    }
  };

  const passportExpiry = watch("passport_expiry");

  return (
    <div className="mb-8">
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[#0A2140] text-base font-semibold">
            Travel Documents
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-[#0B5FFF] hover:text-[#0047CC] hover:bg-[#F0F4FF] gap-1.5 sm:gap-2 h-8 sm:h-9 text-sm px-3 rounded-md transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          ) : (
            <div className="flex gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => { reset(); setIsEditing(false); }}
                className="flex items-center text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB] h-8 sm:h-9 text-sm px-2 sm:px-3 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSave)}
                disabled={isSubmitting || !isDirty}
                className={`flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 text-sm px-2 sm:px-3 rounded-md transition-colors text-white ${
                  isSubmitting || !isDirty
                    ? "bg-[#93C5FD] cursor-default"
                    : "bg-[#0B5FFF] hover:bg-[#0047CC] cursor-pointer"
                }`}
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isSubmitting ? "Saving…" : "Save"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSave)} noValidate className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="space-y-4 sm:space-y-5">
            <Row label="Passport Number">
              {isEditing ? (
                <input {...register("passport_number")} className={inputClass} placeholder="e.g. US123456789" />
              ) : (
                <Display value={watch("passport_number")} />
              )}
            </Row>

            <div className="border-t border-[#F3F4F6]" />

            <Row label="Passport Expiry">
              {isEditing ? (
                <input {...register("passport_expiry")} type="date" className={inputClass} />
              ) : (
                <Display
                  value={
                    passportExpiry
                      ? new Date(passportExpiry).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : undefined
                  }
                />
              )}
            </Row>

            <div className="border-t border-[#F3F4F6]" />

            <Row label="TSA Known Traveler #">
              {isEditing ? (
                <input {...register("tsa_number")} className={inputClass} placeholder="e.g. TTP987654321" />
              ) : (
                <Display value={watch("tsa_number")} />
              )}
            </Row>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-[#0A2140] sm:text-[#9CA3AF] text-[13px] font-medium">{label}</p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Display({ value }: { value?: string | null }) {
  return (
    <p className={`text-[13px] font-medium ${value ? "text-[#0A2140]" : "text-[#9CA3AF]"}`}>
      {value || "—"}
    </p>
  );
}

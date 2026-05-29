"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Test / trening seansidan chiqish tugmasi. `confirm` true bo'lsa (seans davom
 * etayotganda) — saqlanmagan natija yo'qolishidan oldin tasdiq so'raydi.
 * Bola yoki shifokor tasodifan bosib qo'yishidan himoya qiladi.
 */
export function ConfirmExitButton({
  onConfirm,
  confirm = true,
  className,
}: {
  onConfirm: () => void;
  confirm?: boolean;
  className?: string;
}) {
  const t = useTranslations("Common");
  const [open, setOpen] = useState(false);

  const handle = () => {
    if (confirm) setOpen(true);
    else onConfirm();
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={handle} className={className}>
        <X className="h-3.5 w-3.5" />
        {t("exit")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="grid place-items-center h-8 w-8 rounded-lg bg-warn-bg text-amber-700 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5" />
              </span>
              {t("exitTitle")}
            </DialogTitle>
            <DialogDescription>{t("exitBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              className="bg-err text-white border-transparent hover:bg-err/90"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              <X className="h-4 w-4" />
              {t("exit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

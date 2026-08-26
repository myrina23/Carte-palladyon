import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MorphingContextValue = { isOpen: boolean; setOpen: (open: boolean) => void; id: string };
const MorphingContext = createContext<MorphingContextValue | null>(null);

export function AtlasMorphingPopover({ children, open, onOpenChange, className }: { children: ReactNode; open: boolean; onOpenChange: (open: boolean) => void; className?: string }) {
  const id = useId();
  return <MorphingContext.Provider value={{ isOpen: open, setOpen: onOpenChange, id }}><div className={cn("atlas-morphing-popover", className)}>{children}</div></MorphingContext.Provider>;
}

export function AtlasMorphingTrigger({ children, className }: { children: ReactNode; className?: string }) { const context = useContext(MorphingContext); if (!context) throw new Error("AtlasMorphingTrigger doit être utilisé dans AtlasMorphingPopover"); return <motion.button type="button" layoutId={`atlas-morph-trigger-${context.id}`} className={className} onClick={() => context.setOpen(true)} aria-expanded={context.isOpen} aria-controls={`atlas-morph-content-${context.id}`}>{children}</motion.button>; }

export function AtlasMorphingContent({ children, className }: { children: ReactNode; className?: string }) { const context = useContext(MorphingContext); const ref = useRef<HTMLDivElement>(null); if (!context) throw new Error("AtlasMorphingContent doit être utilisé dans AtlasMorphingPopover"); useEffect(() => { if (!context.isOpen) return; const onPointerDown = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) context.setOpen(false); }; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") context.setOpen(false); }; document.addEventListener("pointerdown", onPointerDown); document.addEventListener("keydown", onKeyDown); return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); }; }, [context]); return <AnimatePresence>{context.isOpen && <motion.div ref={ref} id={`atlas-morph-content-${context.id}`} role="dialog" aria-modal="false" layoutId={`atlas-morph-trigger-${context.id}`} initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className={cn("atlas-morph-content", className)}>{children}</motion.div>}</AnimatePresence>;
}

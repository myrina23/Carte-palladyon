import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue, type SpringOptions } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DockContextValue = { mouseX: MotionValue<number>; spring: SpringOptions; magnification: number; distance: number };
const DockContext = createContext<DockContextValue | null>(null);

export function AtlasDock({ children, className, distance = 130, magnification = 62, panelHeight = 58 }: { children: ReactNode; className?: string; distance?: number; magnification?: number; panelHeight?: number }) {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);
  const hovered = useMotionValue(0);
  const spring = { mass: 0.12, stiffness: 190, damping: 16 };
  const height = useSpring(useTransform(hovered, [0, 1], [panelHeight, panelHeight + 16]), spring);
  return <motion.div style={{ height }} className="atlas-dock-shell"><motion.div onMouseMove={(event) => { hovered.set(1); mouseX.set(event.pageX); }} onMouseLeave={() => { hovered.set(0); mouseX.set(Number.POSITIVE_INFINITY); }} className={cn("atlas-dock-panel", className)} style={{ height: panelHeight }} role="toolbar" aria-label="Actions cartographiques"><DockContext.Provider value={{ mouseX, spring, magnification, distance }}>{children}</DockContext.Provider></motion.div></motion.div>;
}

export function AtlasDockItem({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  const context = useContext(DockContext);
  if (!context) throw new Error("AtlasDockItem doit être utilisé dans AtlasDock");
  const ref = useRef<HTMLButtonElement>(null);
  const isHovered = useMotionValue(0);
  const mouseDistance = useTransform(context.mouseX, (value) => { const box = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }; return value - box.x - box.width / 2; });
  const width = useSpring(useTransform(mouseDistance, [-context.distance, 0, context.distance], [40, context.magnification, 40]), context.spring);
  const [showLabel, setShowLabel] = useState(false);
  useEffect(() => { const unsubscribe = isHovered.on("change", (value) => setShowLabel(value === 1)); return unsubscribe; }, [isHovered]);
  return <motion.button ref={ref} type="button" style={{ width }} onHoverStart={() => isHovered.set(1)} onHoverEnd={() => isHovered.set(0)} onFocus={() => isHovered.set(1)} onBlur={() => isHovered.set(0)} onClick={onClick} className="atlas-dock-item" aria-label={label}>{children}<AnimatePresence>{showLabel && <motion.span initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: -7 }} exit={{ opacity: 0, y: 2 }} transition={{ duration: 0.16 }} className="atlas-dock-label" role="tooltip">{label}</motion.span>}</AnimatePresence></motion.button>;
}

export function AtlasDockIcon({ children, width }: { children: ReactNode; width?: MotionValue<number> }) { const iconWidth = useTransform(width ?? useMotionValue(40), (value) => value / 2); return <motion.span style={{ width: iconWidth }} className="atlas-dock-icon">{children}</motion.span>; }

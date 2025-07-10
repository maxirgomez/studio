'use client'
import { useSpinner } from "./SpinnerProvider";
import { motion, AnimatePresence } from "framer-motion";

const overlayVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 30 } },
  exit: { y: "-100%", opacity: 0, transition: { type: "spring", stiffness: 200, damping: 30 } },
};

export default function SpinnerOverlay() {
  const { visible } = useSpinner();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <svg className="animate-spin h-12 w-12 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
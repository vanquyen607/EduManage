import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-dark/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-lg max-h-[85vh] bg-card rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.2)] z-[101] overflow-hidden flex flex-col border border-hairline"
          >
            <div className="px-8 py-6 border-b border-hairline flex items-center justify-between shrink-0 bg-accent-light/50">
              <h3 className=" font-bold text-xl text-ink tracking-tight">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-card hover:shadow-sm rounded-xl text-muted hover:text-ink transition-all active:scale-95 border border-transparent hover:border-hairline"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

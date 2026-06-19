// ModernAccordion.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  description: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

const ModernAccordion = ({ items }: AccordionProps): JSX.Element => {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100"
        >
          <button
            onClick={() => handleToggle(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between bg-[#14263A] text-white hover:bg-[#14263A]/95 transition-colors duration-200"
          >
            <span className="font-medium text-left">{item.title}</span>
            <motion.div
              animate={{ rotate: openId === item.id ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-6 text-gray-600 bg-white">
                  {item.description}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default ModernAccordion;

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@renderer/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';
import ModernAccordion from './Accordion';
import Questions from "./Questions";

interface FAQItem {
  id: string;
  title: string;
  description: string;
}

const FAQ = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedItems, setDisplayedItems] = useState<FAQItem[]>(Questions.slice(0, 4));
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = Questions.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplayedItems(filtered.slice(0, 4));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[90vh] bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-[#14263A] mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 text-lg">
            Get to know more about ready-to-use SiA and how it can help streamline your social media management
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search your question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#14263A]/20 focus:border-[#14263A]"
            />
          </div>
        </motion.div>

        <motion.div
          className="w-full max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {displayedItems.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                key="faq-list"
              >
                {displayedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ originY: 0 }}
                  >
                    <div className="mb-4">
                      <ModernAccordion items={[item]} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
                key="no-results"
              >
                <p className="text-gray-500 text-lg">No matching questions found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;

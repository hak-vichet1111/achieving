import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'kh', name: 'ភាសាខ្មែរ', flag: '🇰🇭' }
];

const LanguageSelection = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    
    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
    
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    }
    
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-border bg-card hover:bg-card/80 text-foreground transition-all"
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="flex items-center gap-2">
            <span className="text-lg mr-1">{currentLanguage.flag}</span>
            <span className="text-sm font-medium">{currentLanguage.name}</span>
          </span>
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg"
          >
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-lg mr-2">{language.flag}</span>
                  <span className="flex-1">{language.name}</span>
                  {language.code === i18n.language && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
}

export default LanguageSelection
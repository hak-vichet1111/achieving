import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isKh = i18n.language === 'kh'

  const setLang = (lng: 'en' | 'kh') => i18n.changeLanguage(lng)

  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden">
      <button
        className={`px-2 py-2 text-sm flex items-center gap-1 ${!isKh ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}
        onClick={() => setLang('en')}
        aria-label="Switch to English"
        aria-pressed={!isKh}
        title="English"
      >
        <span role="img" aria-label="United States flag">🇺🇸</span>
        <span className="font-medium">EN</span>
      </button>
      <button
        className={`px-2 py-2 text-sm flex items-center gap-1 ${isKh ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}
        onClick={() => setLang('kh')}
        aria-label="ប្តូរទៅភាសាខ្មែរ"
        aria-pressed={isKh}
        title="ភាសាខ្មែរ"
      >
        <span role="img" aria-label="Cambodia flag">🇰🇭</span>
        <span className="font-medium">KH</span>
      </button>
    </div>
  )
}
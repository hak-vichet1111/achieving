import React from 'react'
import { useTranslation } from 'react-i18next';

const LanguageSelection = () => {
    const { t, i18n } = useTranslation();
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    }
  return (
    <div className='flex justify-end gap-3'>
      <button onClick={() => changeLanguage('en')} className='text-sm text-secondary bg-primary rounded-md p-2'>English</button>
      <button onClick={() => changeLanguage('kh')} className='text-sm text-secondary bg-secondary-foreground rounded-md p-2'>ភាសាខ្មែរ</button>
    </div>
  )
}

export default LanguageSelection
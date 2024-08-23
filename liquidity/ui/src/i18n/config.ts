import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translation from './ua/translation.json';

i18next.use(initReactI18next).init({
  lng: 'en', // if you're using a language detector, do not define the lng option
  resources: {
    ua: {
      translation,
    },
  },
});

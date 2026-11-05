/**
 * NACC PSW Curriculum Standard Categories & Ukrainian Translations
 */
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Ethics, Legislation & Professional Practice': 'Етика, законодавство та професійна практика',
  'Dementia & Cognitive Care': 'Деменція та когнітивний догляд',
  'Growth, Pediatrics & Family Support': 'Розвиток, педіатрія та підтримка сім’ї',
  'Vital Signs & Cardiopulmonary': 'Життєві показники та серцево-легенева допомога',
  'Nutrition, Elimination & Personal Care': 'Харчування, виділення та особиста гігієна',
  'Safety, Mobility & Wound Care': 'Безпека, мобільність та догляд за ранами',
  'Palliative & End-of-Life': 'Паліативний догляд та кінець життя',
  'Medications & Pharmacology': 'Ліки та фармакологія',
  'Infection Control & Hygiene': 'Інфекційний контроль та гігієна',
};

export function getCategoryTranslation(category: string): string {
  return CATEGORY_TRANSLATIONS[category] || category;
}

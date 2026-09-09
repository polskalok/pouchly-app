import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'pl';

export const LANGUAGE_OPTIONS: { key: Language; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'pl', label: 'Polski' },
];

const translations = {
  en: {
    // Tabs
    home: 'Home',
    history: 'History',
    places: 'Places',
    add: 'Add',
    back: 'Back',

    // Home screen
    today: 'Today',
    thisMonth: 'This month',
    noExpensesYet: 'No expenses yet. Add your first one.',

    // Budgets
    budgets: 'Budgets',
    manage: 'Manage',
    overall: 'Overall',
    noBudgetsSet: 'No budgets set. Tap Manage to add one.',
    monthlyBudgets: 'Monthly budgets',
    noLimit: 'No limit',
    done: 'Done',

    // History filters
    timeField: 'Time',
    categoryField: 'Category',
    all: 'All',
    rangeToday: 'Today',
    rangeYesterday: 'Yesterday',
    rangeWeek: 'Week',
    range2Weeks: '2 Weeks',
    rangeMonth: 'Month',
    range3Months: '3 Months',
    range6Months: '6 Months',
    rangeYear: 'Year',
    rangeAllTime: 'All time',
    rangeCustom: 'Custom',
    from: 'From',
    to: 'To',
    amountRange: 'Amount range',
    minAmount: 'Min $',
    maxAmount: 'Max $',
    total: 'Total',
    avgPerTransaction: 'Avg / transaction',
    chart: 'Chart',
    chartColumn: 'Column',
    chartPoints: 'Points',
    chartPie: 'Pie',
    transactions: 'Transactions',
    noExpensesInRange: 'No expenses in this range.',
    addSampleData: '+ Add sample data (dev only)',

    // Charts
    tapPointForTotal: 'Tap a point to see its total',
    tapSliceToFilter: 'Tap a slice (or a row below) to filter by that category',
    tapAgainToClear: ' — tap again to clear',
    pieDetail: '{emoji} {label}: {amount} ({percent}%, {count})',
    transactionCount_one: '{count} transaction',
    transactionCount_other: '{count} transactions',

    // Places
    noLocatedExpenses:
      'No located expenses yet. New expenses capture your location automatically — add one to see it here.',
    calloutTotal: 'Total:',
    calloutVisits: 'Visits:',
    calloutAvg: 'Avg:',
    tapForDetails: 'Tap for details →',
    noTransactionsHere: 'No transactions here yet.',
    placeSummary: '{total} total · {visits} · {avg} avg',
    visitCount_one: '{count} visit',
    visitCount_other: '{count} visits',

    // Expense form
    newExpense: 'New expense',
    editExpense: 'Edit expense',
    amount: 'Amount',
    newCategoryChip: '+ New',
    longPressHint: 'Long-press a category to edit or delete it.',
    noteOptional: 'Note (optional)',
    notePlaceholder: 'e.g. Coffee with Alex',
    location: 'Location',
    noLocationSet: 'No location set',
    useCurrentLocation: '📍 Use current',
    pointOnMap: '🗺️ Point on map',
    clear: 'Clear',
    locationHint: "GPS can guess the wrong address — edit the name, or point on the map to fix it.",
    couldntGetLocation: 'Couldn’t get location',
    checkLocationPermission: 'Check that location permission is granted and try again.',
    saveExpense: 'Save expense',
    saveChanges: 'Save changes',
    saving: 'Saving…',
    deleteExpense: 'Delete expense',
    cantDelete: 'Can’t delete',
    needOneCategory: 'You need at least one category.',
    deleteCategoryTitle: 'Delete category',
    deleteCategoryMessage: 'Delete "{label}"? Existing expenses keep their record.',
    cancel: 'Cancel',
    delete: 'Delete',
    cannotBeUndone: 'This can’t be undone.',

    // Category editor
    editCategory: 'Edit category',
    newCategory: 'New category',
    categoryNamePlaceholder: 'Category name',
    pickIcon: 'Pick an icon',
    save: 'Save',

    // Transaction detail
    date: 'Date',
    note: 'Note',
    showOnMaps: 'Show on Maps',
    edit: 'Edit',

    // Location picker
    pointOnMapHint: 'Tap the map or drag the pin to set where you paid',
    confirmLocation: 'Confirm location',

    // Settings
    settings: 'Settings',
    expenseTitle: 'Expense',
    placeTitle: 'Place',
    pickLocationTitle: 'Pick location',
    about: 'About',
    version: 'Version {version}',
    aboutTagline: 'A simple, private spending tracker.',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    themeWood: 'Wood',
    themeDay: 'Day',
    themeNight: 'Night',
    appearance: 'Appearance',
    glassClearance: 'Glass clearance',
    preview: 'Preview',
    data: 'Data',
    exportCsv: 'Export CSV',
    support: 'Support',
    sendBugReport: 'Send bug report',
    bugReportPrompt: 'How would you like to contact support?',
    openMail: 'Open mail',
    copyEmail: 'Copy email',
    copied: 'Copied',
    emailCopiedMessage: '{email} copied to clipboard.',
  },
  pl: {
    // Tabs
    home: 'Główna',
    history: 'Historia',
    places: 'Miejsca',
    add: 'Dodaj',
    back: 'Wstecz',

    // Home screen
    today: 'Dziś',
    thisMonth: 'Ten miesiąc',
    noExpensesYet: 'Brak wydatków. Dodaj swój pierwszy.',

    // Budgets
    budgets: 'Budżety',
    manage: 'Zarządzaj',
    overall: 'Ogółem',
    noBudgetsSet: 'Brak ustawionych budżetów. Dotknij „Zarządzaj”, aby dodać.',
    monthlyBudgets: 'Budżety miesięczne',
    noLimit: 'Bez limitu',
    done: 'Gotowe',

    // History filters
    timeField: 'Okres',
    categoryField: 'Kategoria',
    all: 'Wszystkie',
    rangeToday: 'Dziś',
    rangeYesterday: 'Wczoraj',
    rangeWeek: 'Tydzień',
    range2Weeks: '2 tygodnie',
    rangeMonth: 'Miesiąc',
    range3Months: '3 miesiące',
    range6Months: '6 miesięcy',
    rangeYear: 'Rok',
    rangeAllTime: 'Cały czas',
    rangeCustom: 'Niestandardowy',
    from: 'Od',
    to: 'Do',
    amountRange: 'Zakres kwoty',
    minAmount: 'Min $',
    maxAmount: 'Maks $',
    total: 'Suma',
    avgPerTransaction: 'Śr. / transakcję',
    chart: 'Wykres',
    chartColumn: 'Słupkowy',
    chartPoints: 'Punktowy',
    chartPie: 'Kołowy',
    transactions: 'Transakcje',
    noExpensesInRange: 'Brak wydatków w tym okresie.',
    addSampleData: '+ Dodaj przykładowe dane (tylko dev)',

    // Charts
    tapPointForTotal: 'Dotknij punktu, aby zobaczyć sumę',
    tapSliceToFilter: 'Dotknij wycinka (lub wiersza poniżej), aby filtrować wg kategorii',
    tapAgainToClear: ' — dotknij ponownie, aby wyczyścić',
    pieDetail: '{emoji} {label}: {amount} ({percent}%, {count})',
    transactionCount_one: '{count} transakcja',
    transactionCount_few: '{count} transakcje',
    transactionCount_other: '{count} transakcji',

    // Places
    noLocatedExpenses:
      'Brak wydatków z lokalizacją. Nowe wydatki zapisują lokalizację automatycznie — dodaj jeden, aby zobaczyć go tutaj.',
    calloutTotal: 'Suma:',
    calloutVisits: 'Wizyty:',
    calloutAvg: 'Śr.:',
    tapForDetails: 'Dotknij, aby zobaczyć szczegóły →',
    noTransactionsHere: 'Brak transakcji w tym miejscu.',
    placeSummary: '{total} łącznie · {visits} · śr. {avg}',
    visitCount_one: '{count} wizyta',
    visitCount_few: '{count} wizyty',
    visitCount_other: '{count} wizyt',

    // Expense form
    newExpense: 'Nowy wydatek',
    editExpense: 'Edytuj wydatek',
    amount: 'Kwota',
    newCategoryChip: '+ Nowa',
    longPressHint: 'Przytrzymaj kategorię, aby ją edytować lub usunąć.',
    noteOptional: 'Notatka (opcjonalnie)',
    notePlaceholder: 'np. Kawa z Anią',
    location: 'Lokalizacja',
    noLocationSet: 'Brak ustawionej lokalizacji',
    useCurrentLocation: '📍 Użyj bieżącej',
    pointOnMap: '🗺️ Wskaż na mapie',
    clear: 'Wyczyść',
    locationHint: 'GPS może wskazać zły adres — popraw nazwę lub wskaż lokalizację na mapie.',
    couldntGetLocation: 'Nie udało się pobrać lokalizacji',
    checkLocationPermission: 'Sprawdź, czy dostęp do lokalizacji jest włączony, i spróbuj ponownie.',
    saveExpense: 'Zapisz wydatek',
    saveChanges: 'Zapisz zmiany',
    saving: 'Zapisywanie…',
    deleteExpense: 'Usuń wydatek',
    cantDelete: 'Nie można usunąć',
    needOneCategory: 'Musisz mieć co najmniej jedną kategorię.',
    deleteCategoryTitle: 'Usuń kategorię',
    deleteCategoryMessage: 'Usunąć „{label}”? Istniejące wydatki zachowają swój wpis.',
    cancel: 'Anuluj',
    delete: 'Usuń',
    cannotBeUndone: 'Tej operacji nie można cofnąć.',

    // Category editor
    editCategory: 'Edytuj kategorię',
    newCategory: 'Nowa kategoria',
    categoryNamePlaceholder: 'Nazwa kategorii',
    pickIcon: 'Wybierz ikonę',
    save: 'Zapisz',

    // Transaction detail
    date: 'Data',
    note: 'Notatka',
    showOnMaps: 'Pokaż na mapie',
    edit: 'Edytuj',

    // Location picker
    pointOnMapHint: 'Dotknij mapy lub przeciągnij pinezkę, aby ustawić miejsce płatności',
    confirmLocation: 'Potwierdź lokalizację',

    // Settings
    settings: 'Ustawienia',
    expenseTitle: 'Wydatek',
    placeTitle: 'Miejsce',
    pickLocationTitle: 'Wybierz lokalizację',
    about: 'O aplikacji',
    version: 'Wersja {version}',
    aboutTagline: 'Prosty, prywatny tracker wydatków.',
    preferences: 'Preferencje',
    language: 'Język',
    theme: 'Motyw',
    themeWood: 'Drewno',
    themeDay: 'Dzień',
    themeNight: 'Noc',
    appearance: 'Wygląd',
    glassClearance: 'Przezroczystość szkła',
    preview: 'Podgląd',
    data: 'Dane',
    exportCsv: 'Eksportuj CSV',
    support: 'Wsparcie',
    sendBugReport: 'Zgłoś błąd',
    bugReportPrompt: 'Jak chcesz skontaktować się z pomocą?',
    openMail: 'Otwórz pocztę',
    copyEmail: 'Kopiuj e-mail',
    copied: 'Skopiowano',
    emailCopiedMessage: '{email} skopiowano do schowka.',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];

const STORAGE_KEY = 'pouchly:language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  plural: (key: 'transactionCount' | 'visitCount', count: number) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

function polishPluralForm(count: number): 'one' | 'few' | 'other' {
  if (count === 1) return 'one';
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) return 'few';
  return 'other';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'en' || value === 'pl') {
        setLanguageState(value);
      }
      setLoaded(true);
    });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = translations[language] as Record<string, string>;
      const template = dict[key] ?? translations.en[key];
      return interpolate(template, vars);
    },
    [language]
  );

  const plural = useCallback(
    (key: 'transactionCount' | 'visitCount', count: number) => {
      const dict = translations[language] as Record<string, string>;
      const form = language === 'pl' ? polishPluralForm(count) : count === 1 ? 'one' : 'other';
      const template = dict[`${key}_${form}`] ?? dict[`${key}_other`] ?? translations.en[`${key}_other` as TranslationKey];
      return interpolate(template, { count });
    },
    [language]
  );

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, plural }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

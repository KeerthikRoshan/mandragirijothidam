/**
 * Localization dictionary for Mandhragiri Jothidam (மந்திரகிரி ஜோதிடம்)
 * Primary: Tamil (தமிழ்)
 * Secondary: English
 */

export type Language = 'ta' | 'en';

export interface Translations {
  heading: string;
  mobileNumber: string;
  mobilePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  submit: string;
  footer: string;
  showPassword: string;
  hidePassword: string;
  forgotPasswordTitle: string;
  forgotPasswordMessage: string;
  ok: string;
  toggleLabel: string;
  errors: {
    mobileRequired: string;
    mobileInvalidLength: string;
    mobileInvalidStart: string;
    passwordRequired: string;
    passwordTooShort: string;
    generalErrorTitle: string;
    generalErrorMessage: string;
    alertErrorTitle: string;
  };
  devNotice: string;
}

export const translations: Record<Language, Translations> = {
  ta: {
    heading: 'உள்நுழையவும்',
    mobileNumber: 'மொபைல் எண்',
    mobilePlaceholder: '98765 43210',
    password: 'கடவுச்சொல்',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    submit: 'உள்நுழை',
    footer: 'Mandhragiri Jothidam',
    showPassword: 'கடவுச்சொல்லைக் காட்டவும்',
    hidePassword: 'கடவுச்சொல்லை மறைக்கவும்',
    forgotPasswordTitle: 'கடவுச்சொல் மீட்பு',
    forgotPasswordMessage:
      'கடவுச்சொல் மீட்பு வசதி பின்தள API இணைக்கப்பட்ட பின் செயல்படுத்தப்படும்.',
    ok: 'சரி',
    toggleLabel: 'மொழியை மாற்றவும்',
    errors: {
      mobileRequired: 'மொபைல் எண்ணை உள்ளிடவும்',
      mobileInvalidLength: 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்',
      mobileInvalidStart: 'மொபைல் எண் 6, 7, 8 அல்லது 9 இல் தொடங்க வேண்டும்',
      passwordRequired: 'கடவுச்சொல்லை உள்ளிடவும்',
      passwordTooShort: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்',
      generalErrorTitle: 'தொடர்பு பிழை',
      generalErrorMessage:
        'உள்நுழைவில் எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
      alertErrorTitle: 'பிழை',
    },
    devNotice:
      'வளர்ச்சி நிலை: பின்தள அங்கீகார API (Backend Auth API) இன்னும் இணைக்கப்படவில்லை. பின்தள முகவரி மற்றும் API விவரங்கள் வழங்கப்பட்டவுடன் உண்மையான உள்நுழைவு செயல்படுத்தப்படும்.',
  },
  en: {
    heading: 'Sign In',
    mobileNumber: 'Mobile Number',
    mobilePlaceholder: '98765 43210',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot Password?',
    submit: 'Sign In',
    footer: 'Mandhragiri Jothidam',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    forgotPasswordTitle: 'Password Recovery',
    forgotPasswordMessage:
      'Password recovery will be available once the backend API is connected.',
    ok: 'OK',
    toggleLabel: 'Switch language',
    errors: {
      mobileRequired: 'Please enter your mobile number',
      mobileInvalidLength: 'Please enter a valid 10-digit mobile number',
      mobileInvalidStart: 'Mobile number must start with 6, 7, 8, or 9',
      passwordRequired: 'Please enter your password',
      passwordTooShort: 'Password must be at least 6 characters',
      generalErrorTitle: 'Connection Error',
      generalErrorMessage:
        'An unexpected error occurred during sign in. Please try again.',
      alertErrorTitle: 'Error',
    },
    devNotice:
      'Development Mode: Backend authentication API is not connected yet. Real authentication will be enabled once the backend service is configured.',
  },
};

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        // General
        chooseLanguage: "Choose Language",
        continue: "Continue",
        hello: "Hello, welcome!",

        // Homepage
        homepageTitle: "Welcome To Intramuros!",

        // Profile Page
        account: "Account",
        birthday: "Birthday",
        gender: "Gender",
        country: "Country",
        language: "Language",
        welcome: "Mabuhay!",
        guest: "Guest",
        logout: "Log out",
        intramurosAdmin: "Intramuros Administration",

        // Account Page
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        newPassword: "New Password",
        confirmNewPassword: "Confirm New Password",
        changePassword: "Change Password",
        saveChanges: "Save Changes",
        saving: "Saving...",
        enterNewEmailFirst: "Please enter a new email first",
        otpSentToNewEmail: "OTP sent to your new email",
        otpSendFailed: "Failed to send OTP",
        enterFullOtp: "Please enter the full OTP",
        emailVerified: "Email verified successfully!",
        otpVerificationFailed: "OTP verification failed",
        emailUpdateFailed: "Failed to update email",
        firstNameRequired: "First name is required",
        lastNameRequired: "Last name is required",
        emailRequired: "Email is required",
        invalidEmail: "Invalid email",
        passwordRequired: "Password is required",
        passwordFormat:
          "At least 8 chars, 1 uppercase, 1 number, 1 special character",
        confirmPasswordRequired: "Please confirm your password",
        passwordsDoNotMatch: "Passwords do not match",
        googleAccountNotice:
          "This account uses Google login. Email and Password cannot be changed here.",

        // Birthday Page
        dobQuestion: "What's your date of birth?",
        month: "Month",
        date: "Date",
        year: "Year",
        save: "Save",
        notLoggedIn: "Not logged in!",
        completeAllFields: "Please complete all fields.",
        birthdaySavedSuccess: "Birthday saved successfully!",
        birthdaySaveFailed: "Failed to save birthday.",

        // Gender Page
        genderQuestion: "Choose Your Gender",
        male: "Male",
        female: "Female",
        other: "Other",
        genderSavedSuccess: "Gender saved successfully!",
        genderSaveFailed: "Error saving gender",

        // Country Page
        changeCountry: "Change Country",
        search: "Search",
        selectedCountry: "Selected Country",
        none: "None",
        selectCountryFirst: "Please select a country before saving.",
        countrySavedSuccess: "Country saved successfully!",
        countrySaveFailed: "Failed to save country",

        //  Button.jsx
        startTour: "Start Tour",
        explore: "Explore Intramuros",

        // SideButtons
        home: "Home",
        tourMap: "Tour Map",
        createItinerary: "Create Itinerary",
        photobooth: "Photobooth",
        hotlines: "Hotlines",
        profile: "Profile",
        tripArchives: "Trip Archives",
      },
    },
    tl: {
      translation: {
        // General
        chooseLanguage: "Pumili ng Wika",
        continue: "Magpatuloy",
        hello: "Kamusta, maligayang pagdating!",

        // Homepage
        homepageTitle: "Maligayang Pagdating sa Intramuros!",

        // Profile Page
        account: "Account",
        birthday: "Kaarawan",
        gender: "Kasarian",
        country: "Bansa",
        language: "Wika",
        welcome: "Mabuhay!",
        guest: "Bisita",
        logout: "Mag-logout",
        intramurosAdmin: "Intramuros Administration",

        // Account Page
        firstName: "Pangalan",
        lastName: "Apelyido",
        email: "Email",
        newPassword: "Bagong Password",
        confirmNewPassword: "Kumpirmahin ang Bagong Password",
        changePassword: "Palitan ang Password",
        saveChanges: "I-save ang Mga Pagbabago",
        saving: "Ise-save...",
        enterNewEmailFirst: "Pakilagay muna ang bagong email",
        otpSentToNewEmail: "Naipadala na ang OTP sa bagong email",
        otpSendFailed: "Nabigong magpadala ng OTP",
        enterFullOtp: "Pakilagay ang buong OTP",
        emailVerified: "Matagumpay na nakumpirma ang email!",
        otpVerificationFailed: "Nabigong kumpirmahin ang OTP",
        emailUpdateFailed: "Nabigong i-update ang email",
        firstNameRequired: "Kinakailangan ang pangalan",
        lastNameRequired: "Kinakailangan ang apelyido",
        emailRequired: "Kinakailangan ang email",
        invalidEmail: "Di-wastong email",
        passwordRequired: "Kinakailangan ang password",
        passwordFormat:
          "Hindi bababa sa 8 karakter, 1 malaking letra, 1 numero, 1 espesyal na karakter",
        confirmPasswordRequired: "Pakikumpirma ang password",
        passwordsDoNotMatch: "Hindi magkatugma ang mga password",
        googleAccountNotice:
          "Gumagamit ang account na ito ng Google login. Hindi maaaring baguhin ang Email at Password dito.",

        // Birthday Page
        dobQuestion: "Kailan ang iyong kaarawan?",
        month: "Buwan",
        date: "Araw",
        year: "Taon",
        save: "I-save",
        notLoggedIn: "Hindi naka-login!",
        completeAllFields: "Pakikumpleto ang lahat ng field.",
        birthdaySavedSuccess: "Matagumpay na na-save ang kaarawan!",
        birthdaySaveFailed: "Nabigong i-save ang kaarawan.",

        // Gender Page
        genderQuestion: "Pumili ng Kasarian",
        male: "Lalaki",
        female: "Babae",
        other: "Iba",
        genderSavedSuccess: "Matagumpay na na-save ang kasarian!",
        genderSaveFailed: "Nabigong i-save ang kasarian",

        // Country Page
        changeCountry: "Palitan ang Bansa",
        search: "Hanapin",
        selectedCountry: "Napiling Bansa",
        none: "Wala",
        selectCountryFirst: "Pakipili muna ang bansa bago mag-save.",
        countrySavedSuccess: "Matagumpay na na-save ang bansa!",
        countrySaveFailed: "Nabigong i-save ang bansa",

        //  Button.jsx
        startTour: "Simulan ang Tour",
        explore: "Tuklasin ang Intramuros",

        home: "Tahanan",
        tourMap: "Mapa ng Tour",
        createItinerary: "Gumawa ng Itinerary",
        photobooth: "Photobooth",
        hotlines: "Mga Hotline",
        profile: "Profile",
        tripArchives: "Mga Tala ng Biyahe",
      },
    },
  },
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

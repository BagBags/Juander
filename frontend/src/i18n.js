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
        greetings: "Greetings!",
        guest: "Guest",
        logout: "Log out",
        createAccount: "Create an Account",
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

        // TTS Messages
        tts_welcome: "Welcome to Intramuros.",
        tts_tourMapLoaded: "Tour map loaded. Click on any site to explore.",
        tts_createItinerary: "Create itinerary page. Select sites to build your custom tour.",
        tts_emergencyPage: "Emergency hotlines page. Important contact numbers for assistance.",
        tts_profilePage: "Profile page. Manage your account settings.",
        tts_voiceEnabled: "Voice guidance enabled",
        tts_voiceDisabled: "Voice guidance disabled",
        tts_viewingDetails: "Viewing details for",
        tts_openingAR: "Opening augmented reality mode",
        tts_navigatingNext: "Navigating to next site",
        tts_youAreNearby: "You are nearby",
        tts_headingTo: "Heading to",
        tts_kilometersAway: "kilometers away",
        tts_youHaveArrived: "You have arrived at",
        tts_tapToView: "Tap to view details",
        tts_step: "Step",
        tts_of: "of",
        tts_distance: "Distance",
        tts_kilometers: "kilometers",
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
        greetings: "Mabuhay!",
        guest: "Bisita",
        logout: "Mag-logout",
        createAccount: "Gumawa ng Account",
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
        selectCountryFirst: "Pakipili muna ang bansa bago mag-save.",
        countrySavedSuccess: "Matagumpay na na-save ang bansa!",
        countrySaveFailed: "Nabigong i-save ang bansa",

        //  Button.jsx
        startTour: "Simulan ang Tour",
        explore: "Tuklasin ang Intramuros",

        home: "Home",
        tourMap: "Tour Map",
        createItinerary: "Create Itinerary",
        photobooth: "Photobooth",
        hotlines: "Hotlines",
        profile: "Profile",
        tripArchives: "Trip Archives",

        // TTS Messages
        tts_welcome: "Maligayang pagdating sa Intramuros.",
        tts_tourMapLoaded: "Naka-load na ang tour map. I-click ang kahit anong site para tuklasin.",
        tts_createItinerary: "Create itinerary page. Pumili ng mga site para sa iyong custom tour.",
        tts_emergencyPage: "Emergency hotlines page. Mahalagang contact numbers para sa tulong.",
        tts_profilePage: "Profile page. Pamahalaan ang iyong account settings.",
        tts_voiceEnabled: "Voice guidance ay naka-enable na",
        tts_voiceDisabled: "Voice guidance ay naka-disable na",
        tts_viewingDetails: "Tinitingnan ang detalye para sa",
        tts_openingAR: "Binubuksan ang augmented reality mode",
        tts_navigatingNext: "Pumupunta sa susunod na site",
        tts_youAreNearby: "Malapit ka na",
        tts_headingTo: "Papunta sa",
        tts_kilometersAway: "kilometro ang layo",
        tts_youHaveArrived: "Nakarating ka na sa",
        tts_tapToView: "I-tap para tingnan ang detalye",
        tts_step: "Hakbang",
        tts_of: "ng",
        tts_distance: "Distansya",
        tts_kilometers: "kilometro",
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

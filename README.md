
# Strategic Information Center (SIC)

**Strategic Information Center (SIC)** is a mobile discovery platform built with React Native and a scalable backend. It aggregates structured information about restaurants, tiffin services, and events, presented in a familiar, user-friendly UI.

*Note: Phase 1 focuses purely on discovery. Transactional features like ordering, payments, and event ticketing are purposefully excluded and will be introduced in future phases.*

## 🚀 Product Goals
- Provide a unified platform to view restaurant offerings, explore tiffin meal plans, and discover local events.
- Allow users to easily browse and view detailed information before making any transaction.
- Enable direct navigation to venues via Google Maps integration.

## 🛠 Tech Stack

### Mobile App Core
- **Framework:** React Native (Expo Managed Workflow)
- **Language:** TypeScript
- **Engine:** Hermes JavaScript Engine

### Navigation & UI
- **Routing:** React Navigation (Native Stack Navigator, Bottom Tabs)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Animations:** React Native Reanimated, React Native Gesture Handler

### State Management & Data
- **Global UI State:** Redux Toolkit
- **Server State & Caching:** TanStack Query / React Query
- **HTTP Client:** Axios
- **Local Storage:** AsyncStorage (Preferences, Feature Flags)

## 📱 App Flow & Architecture (Phase 1)

**1. Splash Screen & Initialization**
- Loads Hermes, Redux, React Query, and AsyncStorage.
- Determines Feature Flags for what is enabled (e.g. `enableOrdering = false`).

**2. Discovery Modules**
- **Restaurants:** List of restaurants with filters (veg, cuisine, price). Detail views include menus, operating hours, and a navigate button.
- **Tiffin Services:** List of providers. Detail views show meal schedules, plans, pricing, and coverage map.
- **Events:** List of upcoming events filtered by date/category. Detail views show venue, time, and pricing.

**3. Deep Linking**
Navigate directly to entities using the `sic://` scheme:
- `sic://restaurant/{id}`
- `sic://tiffin/{id}`
- `sic://event/{id}`

## 🛣 Future Roadmap (Phase 2+)
- **In-App Transactions:** Ordering food and integrating payment gateways.
- **Event Ticketing:** Direct purchasing of event tickets.
- **User Accounts:** Profiles, reviews, and ratings.
- **Distance Sorting:** Location-based recommendations.

## 🏃‍♂️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed along with `npm` or `yarn`.

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Press `a` to open in Android emulator, `i` to open in iOS simulator, or scan the QR code using the Expo Go app.

## 📄 License & Credits
- **Product Lead:** Manik Pandey
- **Engineering Lead:** Sushant Kumar Yadav
- **UX Lead:** Anisha

# Project Name: EmpowerMe - A Voice-Powered Website Explaining Laws in Simple Terms

## Problem Statement:
Many individuals struggle to understand their legal rights and navigate complex legal systems. Legal language is often difficult to understand, leaving users confused, overwhelmed, and unsure of what actions to take. EmpowerMe solves this problem by providing a simple and accessible platform where users can type or speak their legal concerns and receive clear explanations, guidance, and actionable next steps.

## Live Demo
Deployed link: Not deployed yet  
Run locally using the steps below.

## Features
- Voice-powered and text-based input for user convenience
- Simplified explanations of laws and legal rights
- Guidance on possible actions such as filing complaints or seeking legal support
- Real-time speech recognition using Google Cloud Speech-to-Text API
- Smart search and filtering for relevant legal information
- User-friendly and accessible interface

## Tech Stack
- HTML, CSS, JavaScript
- API used: Google Cloud Speech-to-Text API  
  https://cloud.google.com/speech-to-text

## How to Run Locally
1. Clone the repository:
```bash
git clone https://github.com/empowerme-project/empowerme-web.git
```

2. Navigate to the project folder:
```bash
cd empowerme-web
```

3. Install dependencies and start the development server:
```bash
npm install && npm start
```

## JavaScript Concepts Used
- **fetch + async/await:** Used in `speech-to-text.js` to make asynchronous API calls to the Google Cloud Speech-to-Text API.
- **Events:** The `input` event in `index.js` captures user input and triggers speech recognition functionality.
- **HOFs (map/filter/find):** Used in `search.js` to filter and organize search results efficiently.
- **Error Handling:** Implemented in `error-handler.js` to handle API failures, invalid input, and unexpected user actions.

### Bonus Topics
- **Debouncing:** Implemented in `speech-to-text.js` to reduce unnecessary API calls while users type quickly.
- **Throttling:** Not implemented yet, but can be added to control API request frequency.
- **Pagination:** Planned for future implementation to organize large search result sets.
- **Infinite Scroll:** Can be implemented to dynamically load additional results as users scroll.

## Team Members
- John Doe — Designed and implemented the user interface and overall user experience.
- Jane Smith — Developed backend APIs and integrated frontend functionality.
- Bob Johnson — Implemented speech recognition using the Google Cloud Speech-to-Text API.

## Future Improvements
- Integrate additional legal and government APIs for broader legal coverage
- Develop a mobile application version for Android and iOS
- Add multilingual support for regional accessibility
- Integrate legal aid organizations and support services
- Implement pagination and infinite scrolling for better user experience
- Improve AI-based recommendations and legal guidance accuracy

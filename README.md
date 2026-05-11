# EmpowerMe - Legal Rights Platform

A comprehensive web platform for Indian citizens to understand their legal rights, ask queries, and get guided action steps.

## Features

✅ **User Authentication**
- Secure signup with form validation
- Login with credential verification
- Password confirmation
- User data stored locally (localStorage)

✅ **Smooth Page Transitions**
- Fade-out animation when navigating between pages
- 600ms transition duration for smooth UX
- Auto-redirect on successful signup/login

✅ **Comprehensive Pages**
1. **Home** - Hero section, search, features, rights preview, CTA
2. **Signup** - Full registration form with validation
3. **Login** - Credentials-based login
4. **Agreement** - Terms of Service & Privacy Policy
5. **Dashboard** - User greeting, quick stats, recent queries, quick actions
6. **History** - Query archive with timeline view and filters
7. **Basic Rights** - 6 fundamental rights with detailed explanations
8. **Next Steps** - 5 scenario guides (Tenancy, Workplace, Consumer, Police, RTI)
9. **About Us** - Mission, team info, contact form

✅ **Interactive Features**
- AI-powered legal query results
- Voice input for search queries
- Dynamic scenario selector with step-by-step guides
- Filter buttons for history
- Mobile-responsive design

## File Structure

```
EmpowerMe/
├── empowerme.html          # Main HTML file (all pages)
├── empowerme.js            # JavaScript for forms, navigation, validation
├── signup.html             # Standalone signup (optional)
├── signup.js               # Signup form handler (optional)
├── login.html              # Standalone login (optional)
├── login.js                # Login form handler (optional)
└── README.md               # Documentation
```

## Setup Instructions

### 1. Open in Browser
Simply open `empowerme.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

### 2. File Dependencies
- `empowerme.html` - Main page
- `empowerme.js` - Linked automatically via script tag

No server or build tools required. Works with local file system.

## How It Works

### Signup Flow
1. User fills out signup form (First Name, Last Name, Email, Phone, State, Password)
2. Form validates all fields
3. Checks if email already exists in localStorage
4. Stores user data in localStorage
5. Fades out page (600ms animation)
6. Redirects to Agreement page

### Login Flow
1. User enters email and password
2. Form validates both fields
3. Retrieves stored user data from localStorage
4. Verifies email and password match
5. On success:
   - Sets `isLoggedIn` flag to `true`
   - Stores current user email
   - Fades out page (600ms animation)
   - Redirects to Dashboard with personalized greeting

### Data Storage (localStorage)

**User Data:**
```json
{
  "firstName": "Ishika",
  "lastName": "Jain",
  "fullName": "Ishika Jain",
  "email": "ishika@example.com",
  "phone": "+91 9876543210",
  "state": "Karnataka",
  "password": "securepassword",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Session Data:**
```
isLoggedIn: "true"
currentUser: "ishika@example.com"
```

## Form Validation

### Signup Form
- ✓ First Name - Required, min 2 characters
- ✓ Last Name - Required, min 2 characters
- ✓ Email - Valid email format
- ✓ Phone - At least 10 digits
- ✓ State - Must select from dropdown
- ✓ Password - Minimum 8 characters
- ✓ Confirm Password - Must match password
- ✓ Terms - Must accept checkbox

### Login Form
- ✓ Email - Valid email format required
- ✓ Password - Non-empty required
- ✓ Credential verification against stored data

## Page Navigation

Click on nav items or use `goTo()` function:
- `goTo('home')` → Home page
- `goTo('signup')` → Sign up page
- `goTo('login')` → Login page
- `goTo('dashboard')` → Dashboard
- `goTo('history')` → Query history
- `goTo('rights')` → Fundamental rights
- `goTo('nextsteps')` → Action guide
- `goTo('about')` → About us
- `goTo('agreement')` → Terms & conditions

## Animations & Transitions

### Page Transitions
- **Fade In**: `fadeUp` animation (400ms) when page becomes active
- **Fade Out**: `fadeOut` animation (600ms) when navigating away
- Smooth scroll to top with `behavior: 'smooth'`

### Hover Effects
- Cards lift up on hover with `translateY(-2px)`
- Buttons change color and shadow on hover
- Links underline and change color on hover

## Mobile Responsive

Fully responsive design with media queries:
- Mobile: Stack navigation menu vertically
- Tablet: Adjust grid layouts
- Desktop: Full multi-column layouts

Breakpoints:
- `max-width: 768px` - Tablet
- `max-width: 480px` - Mobile

## Browser Compatibility

✅ Modern browsers (2020+):
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Color Scheme

```css
--navy: #0D1B40              (Dark blue)
--gold: #D4AC0D              (Accent color)
--teal: #0F8B6C              (Secondary accent)
--white: #FFFFFF             (Background)
--text-primary: #0D1B40      (Dark text)
--text-secondary: #4A5B8C    (Medium text)
```

## Fonts

- **Display**: Playfair Display (serif) - Headings
- **Body**: DM Sans (sans-serif) - All text

## JavaScript Functions

### Navigation
- `goTo(page)` - Switch between pages with animation
- `toggleMenu()` - Toggle mobile menu
- `checkLoginStatus()` - Check if user is logged in

### Form Handling
- `handleSearch(e)` - Search on Enter key press
- `handleDashSearch(e)` - Dashboard query on Enter
- `handleDashSearchBtn()` - Dashboard query on button click
- `toggleMic()` - Simulate voice input
- `isValidEmail(email)` - Validate email format
- `showError(fieldId, message)` - Display field error

### AI & Modals
- `openAIResult(query)` - Open legal insight modal
- `closeAI()` - Close modal
- `closeAIResult(e)` - Close modal on overlay click

### Scenarios
- `setScenario(btn, key)` - Load scenario steps
- Scenarios: tenancy, workplace, consumer, police, rti

## Testing Credentials

Test the login with:
```
Email: test@example.com
Password: Test12345
```

(Note: First create an account via signup, then login)

## Security Notes

⚠️ **Important**: This is a frontend demonstration. For production:
- Implement server-side authentication
- Use HTTPS encryption
- Never store passwords in localStorage
- Use secure session tokens
- Implement proper database
- Add CSRF protection
- Validate on backend

## Future Enhancements

- Backend API integration
- Real database (Firebase, PostgreSQL)
- Email verification
- Password reset functionality
- Persistent query history
- Real AI-powered legal advice
- Multiple language support
- Document generation
- Legal aid directory integration
- RTI filing integration

## Support & Contact

Email: hello@empowerme.in
Helpline: NALSA 15100 (India)

---

Made with ♥ for legal accessibility and awareness.

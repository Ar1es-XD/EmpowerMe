document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Get form values
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Retrieve stored user data from signup
  const storedData = localStorage.getItem('userData');

  if (!storedData) {
    alert('No account found with this email. Please sign up first!');
    return;
  }

  const userData = JSON.parse(storedData);

  // Validate credentials
  if (userData.email !== email) {
    alert('Email not found. Please check and try again.');
    return;
  }

  if (userData.password !== password) {
    alert('Incorrect password. Please try again.');
    return;
  }

  // Success - Store login session
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', email);

  // Add fade-out transition
  document.querySelector('.login-container').classList.add('fade-out');

  // Redirect to dashboard after transition
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 600);
});
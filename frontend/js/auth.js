// frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auth-form');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('submit-btn');
  const switchLink = document.getElementById('auth-switch-link');
  const switchText = document.getElementById('auth-switch-text');

  let isRegisterMode = new URLSearchParams(window.location.search).get('register') === 'true';

  const updateUI = () => {
    if (isRegisterMode) {
      title.textContent = 'Create an Account';
      subtitle.textContent = 'Sign up to manage and test subscription billing.';
      submitBtn.textContent = 'Register';
      switchText.innerHTML = 'Already have an account? <a href="#" id="auth-switch-link">Log In</a>';
    } else {
      title.textContent = 'Log In to Your Account';
      subtitle.textContent = 'Welcome back! Please enter your details.';
      submitBtn.textContent = 'Log In';
      switchText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-switch-link">Register</a>';
    }
    
    // Re-attach link event listener after changing HTML
    document.getElementById('auth-switch-link').addEventListener('click', (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      updateUI();
    });
  };

  updateUI();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      const data = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      alert(err.message);
      updateUI();
    } finally {
      submitBtn.disabled = false;
    }
  });
});

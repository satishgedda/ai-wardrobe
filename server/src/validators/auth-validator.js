const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCredentials({ name, email, password }, isRegistration = false) {
  const errors = {}

  if (isRegistration && (!name || name.trim().length < 2)) {
    errors.name = 'Name must be at least 2 characters.'
  }
  if (!email || !emailPattern.test(email.trim().toLowerCase())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

module.exports = { validateCredentials }
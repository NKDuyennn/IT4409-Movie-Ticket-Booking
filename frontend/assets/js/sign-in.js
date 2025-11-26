// Backend API URL - From config
const API_URL = CONFIG.API_URL;

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container_signup_signin');

// Sign Up Form Handler
async function signUpValidateForm() {
	event.preventDefault();
	
	var name = document.forms["sign-up-form"]["sign-up-name"].value;
	var email = document.forms["sign-up-form"]["sign-up-email"].value;
	var password = document.forms["sign-up-form"]["sign-up-passwd"].value;
	
	// Validation
	if (name == "") {
		asAlertMsg({
			type: "error",
			title: "Empty Field",
			message: "'Name' can not be empty!!",
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
		return false;
	}
	
	if (email == "") {
		asAlertMsg({
			type: "error",
			title: "Empty Field",
			message: "'E-mail' can not be empty!!",
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
		return false;
	}
	
	if (password == "") {
		asAlertMsg({
			type: "error",
			title: "Empty Field",
			message: "'Password' can not be empty!!",
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
		return false;
	}
	
	// Call Backend API to register
	try {
		const response = await fetch(`${API_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				full_name: name,
				email: email,
				password: password
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			asAlertMsg({
				type: "success",
				title: "Success!",
				message: data.message || "Registration successful! Please login.",
				button: {
					title: "OK",
					bg: "Success Button"
				}
			});
			
			// Clear form
			document.forms["sign-up-form"].reset();
			
			// Switch to sign in form after 1.5 seconds
			setTimeout(() => {
				container.classList.remove("right-panel-active");
			}, 1500);
		} else {
			asAlertMsg({
				type: "error",
				title: "Registration Failed",
				message: data.message || "Registration failed. Please try again.",
				button: {
					title: "Close",
					bg: "Cancel Button"
				}
			});
		}
	} catch (error) {
		console.error('Error:', error);
		asAlertMsg({
			type: "error",
			title: "Connection Error",
			message: "Cannot connect to server. Please make sure backend is running at " + API_URL,
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
	}
	
	return false;
}

// Sign In Form Handler
async function signInValidateForm() {
	event.preventDefault();
	
	var email = document.forms["sign-in-form"]["sign-in-email"].value;
	var password = document.forms["sign-in-form"]["sign-in-passwd"].value;
	
	// Validation
	if (email == "") {
		asAlertMsg({
			type: "error",
			title: "Empty Field",
			message: "'E-mail' can not be empty!!",
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
		return false;
	}
	
	if (password == "") {
		asAlertMsg({
			type: "error",
			title: "Empty Field",
			message: "'Password' can not be empty!!",
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
		return false;
	}
	
	// Call Backend API to login
	try {
		const response = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: email,
				password: password
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			// Save tokens and user info to localStorage
			localStorage.setItem('access_token', data.access_token);
			localStorage.setItem('refresh_token', data.refresh_token);
			localStorage.setItem('user', JSON.stringify(data.user));
			
			asAlertMsg({
				type: "success",
				title: "Success!",
				message: `Welcome back, ${data.user.full_name}!`,
				button: {
					title: "OK",
					bg: "Success Button"
				}
			});
			
			// Redirect to homepage after 1 second
			setTimeout(() => {
				window.location.href = 'index.html';
			}, 1000);
		} else {
			asAlertMsg({
				type: "error",
				title: "Login Failed",
				message: data.message || "Invalid email or password.",
				button: {
					title: "Close",
					bg: "Cancel Button"
				}
			});
		}
	} catch (error) {
		console.error('Error:', error);
		asAlertMsg({
			type: "error",
			title: "Connection Error",
			message: "Cannot connect to server. Please make sure backend is running at " + API_URL,
			button: {
				title: "Close",
				bg: "Cancel Button"
			}
		});
	}
	
	return false;
}

// Toggle between sign up and sign in forms
signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
	const token = localStorage.getItem('access_token');
	const user = localStorage.getItem('user');
	
	if (token && user) {
		const userData = JSON.parse(user);
		console.log('User already logged in:', userData);
		
		// Optional: Redirect to homepage if already logged in
		// window.location.href = 'index.html';
	}
});

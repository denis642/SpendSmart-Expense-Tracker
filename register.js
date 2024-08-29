document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('form');
    
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission

        // Collect form data
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://spend-smart-expense-tracker.vercel.app/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            let result;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                result = await response.json(); // Parse JSON response
            } else {
                result = { message: await response.text() }; // Parse as text
            }

            if (response.ok) {
                console.log('Registration successful:', result.message);
                alert('Registration successful! You can now log in.');
                window.location.href = 'login.html'; 
            } else {
                console.error('Registration failed:', result.error || result.message);
                alert('Registration failed: ' + (result.error || result.message));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('login.js loaded');
    document.querySelector('form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:9000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Response:', result); // Log the response
                alert('Login successful: ' + result.message);

                // Store the user ID and token in localStorage
                localStorage.setItem('userId', result.userId); // Assuming the response contains the userId
                localStorage.setItem('token', result.token);

                // Redirect to another page if needed
                window.location.href = 'add_expense.html'; // Adjusted URL
            } else {
                console.error('Error response:', result); // Log error response
                alert('Login failed: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error); // Log the error
            alert('Login failed: Network error');
        }
    });
});

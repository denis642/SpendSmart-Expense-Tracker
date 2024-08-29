document.addEventListener('DOMContentLoaded', function() {
    console.log('add_expense.js loaded');

    // Handle adding a new category
    document.getElementById('add-category-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const categoryName = document.getElementById('category').value;
        const userId = getUserId(); // Ensure this returns the correct user ID

        try {
            const response = await fetch('http://localhost:9000/category/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Include the token if needed
                },
                body: JSON.stringify({ name: categoryName })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Response:', result); // Log the response
                alert('Category added successfully');
                // Optionally clear the form
                document.getElementById('add-category-form').reset();
                // Optionally refresh category options
                await loadCategories();
            } else {
                console.error('Error response:', result); // Log error response
                alert('Failed to add category: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error); // Log the error
            alert('Failed to add category: Network error');
        }
    });

    // Handle adding a new expense
    document.getElementById('add-expense-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const categoryId = document.getElementById('category-select').value;
        const description = document.getElementById('expense-description').value;
        const amount = document.getElementById('expense-amount').value;
        const date = document.getElementById('expense-date').value;
        const userId = getUserId(); // Ensure this returns the correct user ID

        try {
            const response = await fetch('http://localhost:9000/expense/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Include the token if needed
                },
                body: JSON.stringify({ category_id: categoryId, description, amount, date })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Response:', result); // Log the response
                alert('Expense added successfully');
                // Optionally clear the form
                document.getElementById('add-expense-form').reset();
            } else {
                console.error('Error response:', result); // Log error response
                alert('Failed to add expense: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error); // Log the error
            alert('Failed to add expense: Network error');
        }
    });

    // Function to load categories and populate the select dropdown
    async function loadCategories() {
        try {
            const response = await fetch('http://localhost:9000/category', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Include the token if needed
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const categories = await response.json();
            const categorySelect = document.getElementById('category-select');
            categorySelect.innerHTML = '<option value="">Select Category</option>'; // Clear previous options

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Function to get user ID (replace with actual logic to get the logged-in user ID)
    function getUserId() {
        const userId = localStorage.getItem('userId'); // Replace with actual logic to get the user ID
        console.log('getUserId() retrieved:', userId);
        return userId;
    }

    // Load categories on page load
    loadCategories();
});

document.addEventListener('DOMContentLoaded', async function() {
    console.log('manage_expenses.js loaded');

    const userId = getUserId(); 
    const token = localStorage.getItem('token');

    console.log('Retrieved User ID:', userId);
    console.log('Retrieved Token:', token);

    if (!userId || !token) {
        console.error('User ID or token not found');
        return;
    }

    // Load categories into filter dropdown
    await loadCategories();

    // Load score card, chart, and expenses on page load
    await loadScoreCard();
    await loadChart();
    await loadExpenses();

    // Event listener for category filter
    document.getElementById('category-filter').addEventListener('change', async function() {
        await loadExpenses();
    });

    function getUserId() {
        const userId = localStorage.getItem('userId');
        console.log('getUserId() retrieved:', userId); 
        return userId;
    }

    async function loadCategories() {
        try {
            const response = await fetch('http://localhost:9000/category', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const categories = await response.json();
            console.log('Categories for filter:', categories);

            const categoryFilter = document.getElementById('category-filter');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async function loadScoreCard() {
        try {
            const response = await fetch('http://localhost:9000/category', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const categories = await response.json();
            console.log('Categories:', categories);
    
            let scoreCardContent = '';
    
            for (const category of categories) {
                const expenseResponse = await fetch(`http://localhost:9000/expense?category_id=${category.id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                const expenses = await expenseResponse.json();
                console.log(`Expenses for category ${category.name}:`, expenses);
    
                const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                scoreCardContent += `<div class="score-card-item">
                    <div class="score-card-header">
                        <h3>${category.name}</h3>
                        <div class="menu">
                            <div class="menu-dots" onclick="toggleMenu(event, ${category.id})">⋮</div>
                            <div class="menu-content" id="menu-${category.id}">
                                <button onclick="deleteCategory(${category.id})">Delete</button>
                            </div>
                        </div>
                    </div>
                    <p>Total: $${total.toFixed(2)}</p>
                </div>`;
            }
    
            document.getElementById('score-card-content').innerHTML = scoreCardContent;
        } catch (error) {
            console.error('Error loading score card:', error);
        }
    }

    window.toggleMenu = function(event, categoryId) {
        event.stopPropagation(); // Prevents the event from bubbling up to the document
        const menu = document.getElementById(`menu-${categoryId}`);
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        
        // Hide all other menus
        document.querySelectorAll('.menu-content').forEach(m => {
            if (m !== menu) {
                m.style.display = 'none';
            }
        });
    }

    // Ensure clicking outside the menu hides it
    document.addEventListener('click', () => {
        document.querySelectorAll('.menu-content').forEach(menu => {
            menu.style.display = 'none';
        });
    });

    window.deleteCategory = async function(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                const response = await fetch(`http://localhost:9000/category/${categoryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                if (response.ok) {
                    alert('Category deleted successfully!');
                    await loadScoreCard(); // Reload the score card
                    await loadChart(); // Reload the chart
                } else {
                    alert('Failed to delete category.');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    }

    async function loadChart() {
        try {
            const response = await fetch(`http://localhost:9000/category`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const categories = await response.json();
            console.log('Categories for chart:', categories);

            const labels = [];
            const data = [];

            for (const category of categories) {
                labels.push(category.name);
                const expenseResponse = await fetch(`http://localhost:9000/expense?category_id=${category.id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                const expenses = await expenseResponse.json();
                console.log(`Expenses for chart category ${category.name}:`, expenses);

                const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                data.push(total);
            }

            const ctx = document.getElementById('pie-chart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Expenses by Category',
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                }
            });
        } catch (error) {
            console.error('Error loading chart:', error);
        }
    }

    async function loadExpenses() {
        try {
            const categoryFilter = document.getElementById('category-filter').value;
            const url = categoryFilter ? `http://localhost:9000/expense?category_id=${categoryFilter}` : `http://localhost:9000/expense`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const expenses = await response.json();
            console.log('Expenses:', expenses);
        
            const tableBody = document.getElementById('expenses-table').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; 
        
            let totalAmount = 0;
        
            expenses.forEach(expense => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = expense.description;
                row.insertCell(1).textContent = `$${parseFloat(expense.amount).toFixed(2)}`;
                row.insertCell(2).textContent = new Date(expense.date).toLocaleDateString();
        
                // Add Edit and Delete buttons with classes
                const actionsCell = row.insertCell(3);
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'edit-button'; // Add class
                editButton.onclick = () => editExpense(expense.id, expense.category_id, expense.description, expense.amount, expense.date);
        
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-button'; // Add class
                deleteButton.onclick = () => deleteExpense(expense.id);
        
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
        
                totalAmount += parseFloat(expense.amount);
            });
        
            document.getElementById('total-expenses').textContent = `Total Expenses: $${totalAmount.toFixed(2)}`;
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    }
    
    
    async function editExpense(id, currentCategoryId, description, amount, date) {
        const newCategoryId = prompt('Enter new category ID:', currentCategoryId);
        const newDescription = prompt('Enter new description:', description);
        const newAmount = prompt('Enter new amount:', amount);
        const newDate = prompt('Enter new date (YYYY-MM-DD):', date);
    
        if (newCategoryId && newDescription && newAmount && newDate) {
            try {
                const response = await fetch(`http://localhost:9000/expense/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        category_id: newCategoryId,
                        description: newDescription,
                        amount: parseFloat(newAmount),
                        date: newDate
                    })
                });
                const result = await response.json(); // Read response body for more info
                if (response.ok) {
                    alert('Expense updated successfully!');
                    await loadExpenses();
                    await loadScoreCard(); // Reload the score card
                    await loadChart(); // Reload the chart
                } else {
                    alert(`Failed to update expense: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating expense:', error);
            }
        } else {
            alert('All fields are required');
        }
    }
    
    

    async function deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                const response = await fetch(`http://localhost:9000/expense/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                if (response.ok) {
                    alert('Expense deleted successfully!');
                    await loadExpenses();
                    await loadScoreCard(); // Reload the score card
                    await loadChart(); // Reload the chart
                } else {
                    alert('Failed to delete expense.');
                }
            } catch (error) {
                console.error('Error deleting expense:', error);
            }
        }
    }
    
});
// Function to handle logout


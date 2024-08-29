const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const port = process.env.PORT || 9000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.getConnection()
    .then(() => console.log('Successfully connected to the database'))
    .catch(err => console.error('Database connection failed:', err));

// User Registration
app.post('/auth/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    try {
        const [results] = await db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', 
        [username, hashedPassword, email]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: err.message });
    }
});

// User Login
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [results] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ auth: true, token, userId: user.id });
    } catch (err) {
        console.error('Error querying user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Middleware to authenticate the token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; 
        next();
    });
}

// Add Category
app.post('/category/add', authenticateToken, async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id; 
    try {
        const [results] = await db.execute('INSERT INTO categories (name, user_id) VALUES (?, ?)', [name, userId]);
        res.status(201).json({ message: 'Category added successfully' });
    } catch (err) {
        console.error('Error adding category:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Categories
app.get('/category', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    try {
        const [results] = await db.execute('SELECT * FROM categories WHERE user_id = ?', [userId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add Expense
app.post('/expense/add', authenticateToken, async (req, res) => {
    const { category_id, description, amount, date } = req.body;
    const userId = req.user.id; 
    try {
        const [results] = await db.execute('INSERT INTO expenses (category_id, description, amount, date, user_id) VALUES (?, ?, ?, ?, ?)', 
        [category_id, description, amount, date, userId]);
        res.status(201).json({ message: 'Expense added successfully' });
    } catch (err) {
        console.error('Error adding expense:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Expenses with optional category filter
app.get('/expense', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    const categoryId = req.query.category_id;

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    let queryParams = [userId];

    if (categoryId) {
        query += ' AND category_id = ?';
        queryParams.push(categoryId);
    }

    try {
        const [results] = await db.execute(query, queryParams);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving expenses' });
    }
});

// Delete Expense
app.delete('/expense/:id', authenticateToken, async (req, res) => {
    const expenseId = req.params.id;
    const userId = req.user.id; 
    try {
        // Check if the expense belongs to the user
        const [expenseResults] = await db.execute('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
        if (expenseResults.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Delete the expense
        await db.execute('DELETE FROM expenses WHERE id = ?', [expenseId]);
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error('Error deleting expense:', err);
        res.status(500).json({ error: err.message });
    }
});
// Delete Category
app.delete('/category/:id', authenticateToken, async (req, res) => {
    const categoryId = req.params.id;
    const userId = req.user.id; 
    try {
        // Check if the category belongs to the user
        const [categoryResults] = await db.execute('SELECT * FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        if (categoryResults.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Delete the category
        await db.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: err.message });
    }
});


// Edit Expense
app.put('/expense/:id', authenticateToken, async (req, res) => {
    const expenseId = req.params.id;
    const { category_id, description, amount, date } = req.body;
    const userId = req.user.id; 

    if (!category_id || !description || !amount || !date) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the expense belongs to the user
        const [expenseResults] = await db.execute('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
        if (expenseResults.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Update the expense
        await db.execute(
            'UPDATE expenses SET category_id = ?, description = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?',
            [category_id, description, amount, date, expenseId, userId]
        );
        res.status(200).json({ message: 'Expense updated successfully' });
    } catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Expense Details
app.get('/expense/:id', authenticateToken, async (req, res) => {
    const expenseId = req.params.id;
    const userId = req.user.id; 
    try {
        const [results] = await db.execute('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Error fetching expense details:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

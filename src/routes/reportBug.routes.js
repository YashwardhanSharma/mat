const express = require('express');
const router = express.Router();
const reportBugController = require('../controllers/reportBug.controller');

// Get all bug reports (optional filters: userId, orderId, status, priority)
router.get('/', reportBugController.getAllBugs);

// Add a new bug report
router.post('/', reportBugController.addBugReport);

// Update a bug report by ID
router.put('/:id', reportBugController.updateBugReport);

// Delete a bug report by ID
router.delete('/:id', reportBugController.deleteBugReport);

module.exports = router;

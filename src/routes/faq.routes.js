const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');

router.get('/', faqController.getAllFaqs);       // Get all FAQs
router.post('/', faqController.addFaq);          // Add new FAQ
router.put('/:id', faqController.updateFaq);     // Update FAQ
router.delete('/:id', faqController.deleteFaq);  // Delete FAQ

module.exports = router;

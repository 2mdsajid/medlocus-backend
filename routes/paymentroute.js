const express = require("express");
const router = express.Router();

const Payment = require('../schema/payment');
const User = require("../schema/user");
const Organization = require("../schema/organization");


const { VerifyUser } = require('../middlewares/middlewares');

router.post('/create-payment', VerifyUser, async (req, res) => {
    try {
        const {
            transactionID,
            amount,
            expiryDate,
            paymentMethod,
            product,
            paidBy,
            model,
        } = req.body;

        if (!transactionID || !amount || !expiryDate || !paymentMethod || !product || !paidBy) {
            return res.status(400).json({ error: 'Incomplete payment details provided' });
        }

        if (!['User', 'Organization'].includes(model)) {
            return res.status(400).json({ error: 'Incomplete payment details providedd' });
        }

        const newPayment = new Payment({
            transactionID,
            amount,
            expiryDate,
            paymentMethod,
            product,
            paidBy,
            model,
        });

        const paymentToUpdate = {
            isPaid: true,
            paymentID: newPayment._id,
            expireAt: expiryDate,
        };

        // updating the user or organization as paid
        const Model = model === 'User' ? User : model === 'Organization' ? Organization : null;
        if (!Model) {
            return res.status(400).json({ error: 'Invalid model' });
        }

        const doc = await Model.findOneAndUpdate(
            { _id: paidBy },
            { $set: { payment: paymentToUpdate } },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ error: `${model} not found` });
        }

        if (model === 'Organization') {
            const organization = await Organization.findById(paidBy);
            if (!organization) {
                return console.log("Organization not found");
            }

            await User.updateMany(
                { _id: { $in: [...organization.users, ...organization.moderators] } },
                { $set: { 'payment': paymentToUpdate } }
            );
            
        }

        await newPayment.save();
        return res.status(201).json({ message: 'Payment created successfully', payment: newPayment });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

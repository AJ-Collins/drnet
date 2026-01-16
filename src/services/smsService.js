const axios = require('axios');

class SMSService {
    constructor() {
        this.apiKey = process.env.SMS_API_KEY;
        this.senderId = process.env.SMS_SENDER_ID;
        this.baseURL = process.env.SMS_BASE_URL || 'https://sms.blessedtexts.com/api/sms/v1';
    }

    /**
     * Format phone number to 254 format
     */
    formatPhoneNumber(phone) {
        // Remove any non-digit characters
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Convert to 254 format
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '254' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('7')) {
            cleanPhone = '254' + cleanPhone;
        } else if (cleanPhone.startsWith('2547')) {
            // Already in correct format
            cleanPhone = cleanPhone;
        }
        
        // Ensure it's 12 digits (254XXXXXXXXX)
        if (cleanPhone.length !== 12) {
            throw new Error(`Invalid phone number length: ${cleanPhone}`);
        }
        
        return cleanPhone;
    }

    /**
     * Send single SMS
     */
    async sendSMS(phone, message) {
        try {
            const formattedPhone = this.formatPhoneNumber(phone);
            
            const payload = {
                api_key: this.apiKey,
                sender_id: this.senderId,
                message: message,
                phone: formattedPhone
            };

            const response = await axios.post(`${this.baseURL}/sendsms`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (Array.isArray(response.data) && response.data[0]?.status_code === '1000') {
                return {
                    success: true,
                    messageId: response.data[0].message_id,
                    cost: response.data[0].message_cost,
                    phone: response.data[0].phone
                };
            } else {
                throw new Error(`SMS API Error: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            console.error('SMS Service Error:', error.response?.data || error.message);
            
            // Handle specific error codes
            if (error.response?.data) {
                const errorCode = error.response.data.status_code;
                const errorMessages = {
                    '1001': 'Missing API Key',
                    '1002': 'Invalid API Key',
                    '1003': 'Missing Sender ID',
                    '1004': 'Invalid Sender ID',
                    '1005': 'Missing Message',
                    '1006': 'Missing Phone number',
                    '1007': 'Invalid Phone numbers format',
                    '1008': 'Invalid Phone number',
                    '1009': 'Insufficient SMS credits'
                };
                
                throw new Error(errorMessages[errorCode] || 'Failed to send SMS');
            }
            
            throw new Error('Failed to send SMS. Please try again.');
        }
    }

    /**
     * Send multiple SMS to different numbers
     */
    async sendBulkSMS(messagesArray) {
        try {
            // Format messages array for API
            const formattedMessages = messagesArray.map(msg => ({
                phone: this.formatPhoneNumber(msg.phone),
                message: msg.message
            }));

            const payload = {
                api_key: this.apiKey,
                sender_id: this.senderId,
                messages: formattedMessages
            };

            const response = await axios.post(`${this.baseURL}/sendsms`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            return {
                success: true,
                results: response.data
            };
        } catch (error) {
            console.error('Bulk SMS Service Error:', error.response?.data || error.message);
            throw new Error('Failed to send bulk SMS');
        }
    }

    /**
     * Check SMS balance
     */
    async getBalance() {
        try {
            const response = await axios.post(`${this.baseURL}/credit-balance`, {
                api_key: this.apiKey
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            return {
                balance: response.data.balance,
                status: response.data.status_code === '1000' ? 'success' : 'error'
            };
        } catch (error) {
            console.error('SMS Balance Check Error:', error.response?.data || error.message);
            throw new Error('Failed to check SMS balance');
        }
    }

    /**
     * Upload contacts to address book
     */
    async uploadContacts(contacts, groupId = null) {
        try {
            const payload = {
                api_key: this.apiKey,
                contacts: contacts.map(contact => ({
                    phone_number: this.formatPhoneNumber(contact.phone),
                    contact_name: contact.name || '',
                    description: contact.description || ''
                }))
            };

            if (groupId) {
                payload.group_id = groupId;
            }

            const response = await axios.post('https://sms.blessedtexts.com/api/contacts/v1/upload', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            return {
                success: response.data.status_code === '1000',
                message: response.data.status_desc
            };
        } catch (error) {
            console.error('Contact Upload Error:', error.response?.data || error.message);
            throw new Error('Failed to upload contacts');
        }
    }
}

module.exports = new SMSService();
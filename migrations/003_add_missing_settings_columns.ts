// TypeScript migration file for drizzle-kit
// This file documents the migration applied to add missing settings columns

export default {
    type: 'query' as const,
    migrations: {
        3: {
            steps: [
                {
                    from: '2_add_user_id_to_orders',
                    tablesCreated: [],
                    tablesAltered: [
                        {
                            name: 'settings',
                            columnsAdded: ['printer_type', 'whatsapp_enabled', 'whatsapp_phone_number', 'whatsapp_api_key', 'whatsapp_business_id', 'whatsapp_send_receipts'],
                        }
                    ],
                }
            ],
        },
    },
};

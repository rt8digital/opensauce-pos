// TypeScript migration file for drizzle-kit
// This file documents the migration applied to add categories table and cost field to products

export default {
    type: 'query' as const,
    migrations: {
        6: {
            steps: [
                {
                    from: '5_add_camera_scanner_settings',
                    tablesCreated: [
                        {
                            name: 'categories',
                            columns: [
                                'id',
                                'name',
                                'description',
                                'created_at'
                            ],
                        }
                    ],
                    tablesAltered: [
                        {
                            name: 'products',
                            columnsAdded: [
                                'cost',
                                'category_id'
                            ],
                        }
                    ],
                }
            ],
        },
    },
};
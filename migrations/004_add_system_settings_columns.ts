// TypeScript migration file for drizzle-kit
// This file documents the migration applied to add system settings columns

export default {
    type: 'query' as const,
    migrations: {
        4: {
            steps: [
                {
                    from: '3_add_missing_settings_columns',
                    tablesCreated: [],
                    tablesAltered: [
                        {
                            name: 'settings',
                            columnsAdded: [
                                'autoBackupEnabled',
                                'backupFrequency',
                                'backupLocation',
                                'sessionTimeout',
                                'passwordMinLength',
                                'passwordRequireSpecial',
                                'lowStockThreshold',
                                'stockAlertEnabled',
                                'auditLoggingEnabled',
                                'auditLogLevel'
                            ],
                        }
                    ],
                }
            ],
        },
    },
};

// TypeScript migration file for drizzle-kit
// This file documents the migration applied to add camera scanner settings columns

export default {
    type: 'query' as const,
    migrations: {
        5: {
            steps: [
                {
                    from: '4_add_system_settings_columns',
                    tablesCreated: [],
                    tablesAltered: [
                        {
                            name: 'settings',
                            columnsAdded: [
                                'cameraScannerEnabled',
                                'cameraFacing',
                                'cameraResolution',
                                'cameraTorchEnabled',
                                'cameraContinuousScan',
                                'cameraSupportedFormats'
                            ],
                        }
                    ],
                }
            ],
        },
    },
};

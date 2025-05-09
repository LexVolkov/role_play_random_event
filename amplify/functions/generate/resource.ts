import {defineFunction, secret} from '@aws-amplify/backend';

export const generate = defineFunction({
    name: 'generate',
    environment: {
        GOOGLE_API_KEY: secret('GOOGLE_API_KEY'),
    },
    entry: './handler.ts',
    timeoutSeconds: 120, // 2 minute timeout
});
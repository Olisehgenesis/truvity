import { runFullJourney } from "./miko-journey.js"

async function main() {
    try {
        console.log('Starting Miko\'s Journey Application...');
         // Verify environment variables
    const requiredEnvVars = ['MIKO_API_KEY', 'EMPLOYER_API_KEY', 'BANK_API_KEY', 'MUNICPALITY_API_KEY'];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.error(`Error: ${envVar} environment variable is not set`);
            process.exit(1);
        }
    }
        await runFullJourney();
    } catch (error) {
        console.error('Application failed:', error);
        process.exit(1);
    }
}


// Run the application
main().catch(console.error);
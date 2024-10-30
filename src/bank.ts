import { ComplianceOfficerPanel } from "./compliance-officer-panel.ts";
import { Logger } from "./miko-journey.ts";

async function main() {
    try {
        console.log('Starting Bank Compliance Application...');
        
        // Verify environment variables
        const requiredEnvVars = ['BANK_COMPLIANCE_API_KEY'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                console.error(`Error: ${envVar} environment variable is not set`);
                process.exit(1);
            }
        }

        // Initialize panel
        Logger.log('BANK_INIT', 'Initializing Compliance Officer Panel');
        const panel = new ComplianceOfficerPanel(process.env.BANK_COMPLIANCE_API_KEY!);

        // Search specifically for Miko's bank account opening requests
        Logger.log('BANK_SEARCH', 'Searching for Miko\'s bank account opening requests');
        const pendingRequests = await panel.searchVerificationRequests({
            applicantName: 'Miko',
            status: 'PENDING',
            // type: 'BankAccountOpening'  // Add specific type
        });

        if (pendingRequests.length === 0) {
            Logger.log('BANK_SEARCH_EMPTY', 'No pending bank account opening requests found');
            return;
        }

        Logger.log('BANK_SEARCH_RESULT', `Found ${pendingRequests.length} pending requests`);

        // Process each request
        const results = [];
        for (const request of pendingRequests) {
            Logger.log('BANK_PROCESS_START', `Processing request: ${request.id}`);
            
            try {
                // Add validation check
                if (!request.data?.type?.includes('BankVerificationRequest')) {
                    Logger.log('BANK_PROCESS_SKIP', `Skipping non-bank request: ${request.id}`);
                    continue;
                }
                // Map the request using the correct decorator
                const verificationVc = panel.mapVerificationRequest(request);
                Logger.log('BANK_VERIFY', 'Verifying documents and credentials');
                const verificationResult = await panel.verifyDocumentLinks(verificationVc);

                if (verificationResult.isValid) {
                    Logger.log('BANK_APPROVE_START', 'Documents verified, proceeding with approval');
                    const result = await panel.approveVerification(
                        verificationVc,
                        'COMPLIANCE-OFFICER-001',
                        'All documents verified successfully'
                    );
                    Logger.log('BANK_APPROVE_SUCCESS', 'Request approved', {
                        id: request.id,
                        accountId: result.accountVc.id
                    });
                    results.push({
                        id: request.id,
                        status: 'APPROVED',
                        result
                    });
                } else {
                    Logger.log('BANK_REJECT_START', 'Document verification failed', { 
                        error: verificationResult.error 
                    });
                    const result = await panel.rejectVerification(
                        verificationVc,
                        'COMPLIANCE-OFFICER-001',
                        `Verification failed: ${verificationResult.error}`
                    );
                    Logger.log('BANK_REJECT_SUCCESS', 'Request rejected', {
                        id: request.id,
                        reason: verificationResult.error
                    });
                    results.push({
                        id: request.id,
                        status: 'REJECTED',
                        result
                    });
                }
            } catch (error) {
                Logger.error('BANK_PROCESS_ERROR', `Error processing request ${request.id}`, error);
                results.push({
                    id: request.id,
                    status: 'ERROR',
                    error
                });
            }
        }

        // Display summary
        const summary = {
            total: results.length,
            approved: results.filter(r => r.status === 'APPROVED').length,
            rejected: results.filter(r => r.status === 'REJECTED').length,
            errors: results.filter(r => r.status === 'ERROR').length
        };

        Logger.log('BANK_SUMMARY', 'Processing Complete!', summary);

        if (summary.approved > 0) {
            Logger.log('BANK_SUCCESS', 'Successfully processed bank account applications');
        }

    } catch (error) {
        Logger.error('BANK_FAILURE', 'Bank compliance application failed', error);
        process.exit(1);
    }
}

// Run the application
main().catch(error => {
    Logger.error('BANK_FATAL', 'Fatal error in bank compliance application', error);
    process.exit(1);
});
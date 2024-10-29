import { TruvityClient, VcContext, VcClaim, VcNotEmptyClaim, VcLinkedCredentialClaim, VcLinkedFileClaim, LinkedCredential, LinkedFile } from '@truvity/sdk';

// --- Document Schemas with Enhanced Features ---

@VcContext({
    name: 'EmploymentContract',
    namespace: 'urn:dif:hackathon/vocab/employment'
})
class EmploymentContract {
    @VcNotEmptyClaim
    employerName!: string;

    @VcNotEmptyClaim
    employeeName!: string;

    @VcNotEmptyClaim
    startDate!: string;

    @VcNotEmptyClaim
    position!: string;

    @VcNotEmptyClaim
    salary!: number;

    @VcLinkedFileClaim
    @VcNotEmptyClaim
    contractDocument!: LinkedFile;
}

@VcContext({
    name: 'ProofOfIdentity',
    namespace: 'urn:dif:hackathon/vocab/identity'
})
class ProofOfIdentity {
    @VcNotEmptyClaim
    fullName!: string;

    @VcNotEmptyClaim
    dateOfBirth!: string;

    @VcNotEmptyClaim
    nationality!: string;

    @VcNotEmptyClaim
    documentNumber!: string;

    @VcLinkedFileClaim
    @VcNotEmptyClaim
    identificationDocument!: LinkedFile;
}

@VcContext({
    name: 'VisaApplication',
    namespace: 'urn:dif:hackathon/vocab/visa'
})
class VisaApplication {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentity)
    identity!: LinkedCredential<ProofOfIdentity>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContract)
    employment!: LinkedCredential<EmploymentContract>;

    @VcNotEmptyClaim
    visaType!: string;

    @VcNotEmptyClaim
    applicationNumber!: string;
}

@VcContext({
    name: 'MunicipalityRegistration',
    namespace: 'urn:dif:hackathon/vocab/municipality'
})
class MunicipalityRegistration {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentity)
    identity!: LinkedCredential<ProofOfIdentity>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(VisaApplication)
    visa!: LinkedCredential<VisaApplication>;

    @VcNotEmptyClaim
    registrationDate!: string;

    @VcNotEmptyClaim
    registrationNumber!: string;
}

// Logger class for consistent logging
class Logger {
    static log(category: string, message: string, data?: any) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${category}] ${message}`);
        if (data) {
            console.log('Data:', JSON.stringify(data, null, 2));
        }
        console.log('-------------------');
    }

    static error(category: string, message: string, error: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [${category}] ERROR: ${message}`);
        console.error('Error details:', error);
        console.log('-------------------');
    }
}

// Enhanced ToDo list manager with labels and search capabilities
class TodoListManager {
    private client: TruvityClient;
    private walletDid: string;

    constructor(client: TruvityClient, walletDid: string) {
        this.client = client;
        this.walletDid = walletDid;
        Logger.log('INIT', `TodoListManager initialized with wallet DID: ${walletDid}`);
    }

    async createDraftWithLabels(decorator: any, claims: any, status: string) {
        try {
            Logger.log('DRAFT_CREATE', 'Creating new draft', {
                type: decorator.getCredentialTerm(),
                claims,
                status
            });

            const draft = await decorator.create({ claims });
            Logger.log('DRAFT_CREATED', 'Draft created successfully', {
                draftId: draft.id
            });

            const updatedDraft = await draft.update({
                labels: {
                    status: status,
                    owner: 'miko',
                    type: decorator.getCredentialTerm()
                }
            });

            Logger.log('DRAFT_UPDATED', 'Draft updated with labels', {
                draftId: updatedDraft.id,
                labels: {
                    status,
                    owner: 'miko',
                    type: decorator.getCredentialTerm()
                }
            });

            return updatedDraft;
        } catch (error) {
            Logger.error('DRAFT_ERROR', 'Failed to create/update draft', error);
            throw error;
        }
    }

    async searchCredentials(type: string, status?: string) {
        try {
            Logger.log('SEARCH_START', 'Searching for credentials', {
                type,
                status
            });

            const filter: any[] = [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [type]
                    }
                }
            }];

            if (status) {
                filter.push({
                    labels: {
                        status: {
                            operator: 'EQ',
                            value: status
                        }
                    }
                });
            }

            const results = await this.client.credentials.credentialSearch({
                filter: filter
            });

            Logger.log('SEARCH_COMPLETE', `Found ${results.items.length} credentials`, {
                type,
                status,
                count: results.items.length
            });

            return results;
        } catch (error) {
            Logger.error('SEARCH_ERROR', 'Failed to search credentials', error);
            throw error;
        }
    }

    async issueAndShare(draft: any, keyId: string, targetDid: string) {
        try {
            Logger.log('ISSUE_START', 'Issuing credential', {
                draftId: draft.id,
                keyId,
                targetDid
            });

            const credential = await draft.issue(keyId);
            Logger.log('ISSUE_COMPLETE', 'Credential issued successfully', {
                credentialId: credential.id
            });

            Logger.log('SHARE_START', 'Sharing credential', {
                credentialId: credential.id,
                targetDid
            });

            await credential.send(targetDid, keyId);
            Logger.log('SHARE_COMPLETE', 'Credential shared successfully');

            return credential;
        } catch (error) {
            Logger.error('ISSUE_SHARE_ERROR', 'Failed to issue or share credential', error);
            throw error;
        }
    }

    async createPresentation(credentials: any[], keyId: string) {
        try {
            Logger.log('PRESENTATION_START', 'Creating verifiable presentation', {
                credentialCount: credentials.length,
                keyId
            });

            const vpDecorator = this.client.createVpDecorator();
            const presentation = await vpDecorator.issue(credentials, keyId);

            Logger.log('PRESENTATION_COMPLETE', 'Verifiable presentation created', {
                presentationId: presentation.descriptor
            });

            return presentation;
        } catch (error) {
            Logger.error('PRESENTATION_ERROR', 'Failed to create presentation', error);
            throw error;
        }
    }

    async getNextTask(): Promise<string> {
        try {
            Logger.log('TASK_CHECK', 'Checking next required task');

            const employmentContract = await this.searchCredentials('EmploymentContract', 'completed');
            if (employmentContract.items.length === 0) {
                Logger.log('TASK_RESULT', 'Next task identified: Employment Contract');
                return "Obtain Employment Contract";
            }

            const visa = await this.searchCredentials('VisaApplication', 'completed');
            if (visa.items.length === 0) {
                Logger.log('TASK_RESULT', 'Next task identified: Visa Application');
                return "Apply for Visa";
            }

            const registration = await this.searchCredentials('MunicipalityRegistration', 'completed');
            if (registration.items.length === 0) {
                Logger.log('TASK_RESULT', 'Next task identified: Municipality Registration');
                return "Register with Municipality";
            }

            Logger.log('TASK_RESULT', 'All tasks completed');
            return "All tasks completed!";
        } catch (error) {
            Logger.error('TASK_CHECK_ERROR', 'Failed to determine next task', error);
            throw error;
        }
    }
}

// Example usage with logging
async function initiateMikosJourney() {
    try {
        Logger.log('JOURNEY_START', 'Initiating Miko\'s journey');

        const client = new TruvityClient({
            apiKey: process.env.WALLET_API_KEY,
            environment: 'https://api.truvity.cloud'
        });

        const { id: walletDid } = await client.dids.didDocumentSelfGet();
        Logger.log('WALLET_INIT', 'Wallet DID retrieved', { walletDid });

        const todoList = new TodoListManager(client, walletDid);
        
        // Generate signing key
        const key = await client.keys.keyGenerate({
            data: { type: 'ED25519' }
        });
        Logger.log('KEY_GENERATED', 'Signing key generated', { keyId: key.id });

        // Create employment contract draft
        const employmentDecorator = client.createVcDecorator(EmploymentContract);
        const contractDraft = await todoList.createDraftWithLabels(
            employmentDecorator,
            {
                employerName: "Amsterdam Tech Startup",
                employeeName: "Miko",
                startDate: "2024-05-01",
                position: "Backend Developer",
                salary: 65000
            },
            "pending"
        );

        // Example: Issue and share the contract
        const employerDid = "did:example:employer";
        const contract = await todoList.issueAndShare(contractDraft, key.id, employerDid);

        // Update status after successful issuance
        await contractDraft.update({
            labels: {
                status: "completed"
            }
        });
        Logger.log('CONTRACT_STATUS', 'Contract status updated to completed');

        // Get next task
        const nextTask = await todoList.getNextTask();
        Logger.log('JOURNEY_STATUS', `Current status`, { nextTask });

    } catch (error) {
        Logger.error('JOURNEY_ERROR', 'Error in Miko\'s journey', error);
        throw error;
    }
}

// Export for usage
export {
    EmploymentContract,
    ProofOfIdentity,
    VisaApplication,
    MunicipalityRegistration,
    TodoListManager,
    initiateMikosJourney
};
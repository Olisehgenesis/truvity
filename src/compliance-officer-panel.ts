import { TruvityClient, LinkedCredential, VcContext, VcClaim, VcNotEmptyClaim, VcLinkedCredentialClaim } from '@truvity/sdk';

import {
    Logger,
    MunicipalityRegistrationResponse,
    EmploymentContractResponse,
    ProofOfIdentity
} from './miko-journey.ts';

// --- Document Schemas ---

@VcContext({
    name: 'BankVerificationRequest',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankVerificationRequest {
    @VcNotEmptyClaim
    applicantName!: string;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(MunicipalityRegistrationResponse)
    proofOfRegistration!: LinkedCredential<MunicipalityRegistrationResponse>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContractResponse)
    employmentContract!: LinkedCredential<EmploymentContractResponse>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentity)
    identity!: LinkedCredential<ProofOfIdentity>;

    @VcNotEmptyClaim
    verificationId!: string;

    @VcNotEmptyClaim
    submissionDate!: string;
}

@VcContext({
    name: 'BankAccountVerification',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankAccountVerification {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(MunicipalityRegistrationResponse)
    proofOfRegistration!: LinkedCredential<MunicipalityRegistrationResponse>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContractResponse)
    employmentContract!: LinkedCredential<EmploymentContractResponse>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentity)
    identity!: LinkedCredential<ProofOfIdentity>;

    @VcNotEmptyClaim
    verificationId!: string;

    @VcNotEmptyClaim
    submissionDate!: string;
}

@VcContext({
    name: 'BankAccountVerificationResponse',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankAccountVerificationResponse {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(BankAccountVerification)
    verification!: LinkedCredential<BankAccountVerification>;

    @VcNotEmptyClaim
    status!: 'APPROVED' | 'REJECTED';

    @VcNotEmptyClaim
    decisionDate!: string;

    @VcNotEmptyClaim
    reviewerId!: string;

    @VcNotEmptyClaim
    comments?: string;
}

@VcContext({
    name: 'BankAccountCredential',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankAccountCredential {
    @VcNotEmptyClaim
    accountHolder!: string;

    @VcNotEmptyClaim
    accountNumber!: string;

    @VcNotEmptyClaim
    bankName!: string;

    @VcNotEmptyClaim
    openingDate!: string;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(BankAccountVerificationResponse)
    verification!: LinkedCredential<BankAccountVerificationResponse>;
}

export class ComplianceOfficerPanel {
    private bankClient: TruvityClient;
    private verificationDecorator: any;
    private verificationResponseDecorator: any;
    private bankAccountDecorator: any;

    constructor(apiKey: string) {
        try {
            this.bankClient = new TruvityClient({
                apiKey,
                environment: 'https://api.truvity.cloud'
            });

            // Initialize decorators with correct schemas
            this.verificationDecorator = this.bankClient.createVcDecorator(BankVerificationRequest);
            this.verificationResponseDecorator = this.bankClient.createVcDecorator(BankAccountVerificationResponse);
            this.bankAccountDecorator = this.bankClient.createVcDecorator(BankAccountCredential);

            Logger.log('BANK_INIT', 'ComplianceOfficerPanel initialized successfully');
        } catch (error) {
            Logger.error('BANK_INIT_ERROR', 'Failed to initialize ComplianceOfficerPanel', error);
            throw error;
        }
    }

    public async searchVerificationRequests(searchParams?: {
        applicantName?: string,
        status?: string
    }) {
        try {
            Logger.log('BANK_SEARCH_START', 'Starting verification request search', searchParams);

            // Create base filter for both direct bank requests and related credentials
            const filter: any[] = [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [
                            'BankVerificationRequest',
                            'BankAccountOpeningCredential',
                            'BankAccountOpeningResponseCredential',
                            'BankAccountApplicationCredential',
                            'urn:dif:hackathon/vocab/banking#BankVerificationRequest',
                            this.verificationDecorator.getCredentialTerm()
                        ]
                    }
                }
            }, {
                data: {
                    namespace: {
                        operator: 'IN',
                        values: [
                            'urn:dif:hackathon/vocab/banking',
                            'urn:dif:hackathon/vocab/identity',
                            'urn:dif:hackathon/vocab/municipality'
                        ]
                    }
                }
            }];
            // Add namespace filter to ensure we only get banking documents
            filter.push({
                data: {
                    namespace: {
                        operator: 'EQUALS',
                        value: 'urn:dif:hackathon/vocab/banking'
                    }
                }
            });

            if (searchParams?.applicantName) {
                filter.push({
                    data: {
                        claims: {
                            applicantName: {
                                operator: 'EQUALS',
                                value: searchParams.applicantName
                            }
                        }
                    }
                });
            }

            if (searchParams?.status) {
                filter.push({
                    data: {
                        claims: {
                            status: {
                                operator: 'EQUALS',
                                value: searchParams.status
                            }
                        }
                    }
                });
            }

            Logger.log('BANK_SEARCH_FILTER', 'Applying search filters', filter);

            const results = await this.bankClient.credentials.credentialSearch({
                filter,
                sort: [{ field: 'DATA_VALID_FROM', order: 'DESC' }]
            });

            Logger.log('BANK_SEARCH_COMPLETE', `Found ${results.items.length} bank verification requests`);
            return results.items;
        } catch (error) {
            Logger.error('BANK_SEARCH_ERROR', 'Failed to search verification requests', error);
            throw error;
        }
    }

    public async mapVerificationRequest(request: any) {
        try {
            Logger.log('BANK_MAP_START', 'Mapping verification request', { 
                requestId: request.id,
                requestType: request.data?.type,
                decoratorTerm: this.verificationDecorator.getCredentialTerm()
            });
    
            // Extract linked credentials
            const linkedCreds = Array.isArray(request.data?.linkedCredentials) 
                ? request.data.linkedCredentials 
                : [];
    
            // Function to get the credential ID from a linked credential string
            const getCredentialId = (linkedCred: string) => {
                const { linkedId } = LinkedCredential.normalizeLinkedCredentialId(linkedCred);
                return linkedId;
            };
    
            // Function to find credential by type in linked credentials
            const findCredentialByType = async (type: string) => {
                const cred = linkedCreds.find((cred: string) => 
                    cred.toLowerCase().includes(type.toLowerCase())
                );
                if (!cred) return null;
                
                try {
                    // Use credentialLatest instead of credentialGet
                    const credentialId = getCredentialId(cred);
                    const result = await this.bankClient.credentials.credentialLatest(credentialId);
                    return result;
                } catch (e) {
                    Logger.error('BANK_CREDENTIAL_ERROR', `Failed to fetch credential: ${cred}`, e);
                    return null;
                }
            };
    
            // Get applicant name from linked identity document if possible
            let applicantName = 'Unknown';
            const identityDoc = await findCredentialByType('Identity') || 
                               await findCredentialByType('Birth');
            
            if (identityDoc && (identityDoc.data as any)?.claims?.fullName) {
                applicantName = (identityDoc.data as any).claims.fullName;
            }
    
            // Get registration and employment credentials
            const registrationDoc = await findCredentialByType('MunicipalityRegistration');
            const employmentDoc = await findCredentialByType('Employment');
    
            // Construct mapped request with all required fields
            const mappedRequest = {
                id: request.id,
                data: {
                    type: ['VerifiableCredential', 'BankVerificationRequest'],
                    namespace: 'urn:dif:hackathon/vocab/banking',
                    claims: {
                        applicantName,
                        verificationId: request.id,
                        submissionDate: request.data?.validFrom || new Date().toISOString(),
                        
                        // Create proper LinkedCredential objects
                        proofOfRegistration: registrationDoc ? {
                            id: registrationDoc.id,
                            type: 'LinkedCredential'
                        } : undefined,
                        employmentContract: employmentDoc ? {
                            id: employmentDoc.id,
                            type: 'LinkedCredential'
                        } : undefined,
                        identity: identityDoc ? {
                            id: identityDoc.id,
                            type: 'LinkedCredential'
                        } : undefined
                    },
                    validFrom: request.data?.validFrom,
                    validUntil: request.data?.validUntil,
                    issuer: request.data?.issuer,
                    issuanceDate: request.data?.issuanceDate
                }
            };
    
            Logger.log('BANK_MAP_DEBUG', 'Constructed mapped request', {
                id: mappedRequest.id,
                claims: mappedRequest.data.claims,
                linkedDocs: {
                    registration: !!registrationDoc,
                    employment: !!employmentDoc,
                    identity: !!identityDoc
                }
            });
    
            // Validate required fields before mapping
            if (!registrationDoc || !employmentDoc || !identityDoc) {
                throw new Error('Missing required linked credentials');
            }
    
            // Now map this constructed request
            return this.verificationDecorator.map(mappedRequest);
        } catch (error) {
            Logger.error('BANK_MAP_ERROR', 'Failed to map verification request', error);
            throw new Error(`Mapping error: ${error}`);
        }
    }
    async verifyDocumentLinks(verificationVc: any) {
        try {
            Logger.log('BANK_VERIFY_START', 'Starting document verification');
            const claims = await verificationVc.getClaims();

            // Verify all required documents are present and linked
            const proofOfRegistration = await claims.proofOfRegistration?.dereference();
            const employmentContract = await claims.employmentContract?.dereference();
            const identity = await claims.identity?.dereference();

            if (!proofOfRegistration || !employmentContract || !identity) {
                Logger.log('BANK_VERIFY_MISSING', 'Missing required linked documents');
                return {
                    isValid: false,
                    error: 'Missing required linked documents'
                };
            }

            // Additional verification logic for each document
            const registrationClaims = await proofOfRegistration.getClaims();
            const employmentClaims = await employmentContract.getClaims();
            const identityClaims = await identity.getClaims();

            // Verify documents are valid and not expired
            const currentDate = new Date();
            const employmentStartDate = new Date(employmentClaims.startDate);

            if (employmentStartDate > currentDate) {
                Logger.log('BANK_VERIFY_INVALID', 'Employment contract not yet valid');
                return {
                    isValid: false,
                    error: 'Employment contract not yet valid'
                };
            }

            Logger.log('BANK_VERIFY_SUCCESS', 'All documents verified successfully');
            return {
                isValid: true,
                documents: {
                    registration: registrationClaims,
                    employment: employmentClaims,
                    identity: identityClaims
                }
            };
        } catch (error) {
            Logger.error('BANK_VERIFY_ERROR', 'Document verification failed', error);
            return {
                isValid: false,
                error: error
            };
        }
    }

    async approveVerification(
        verificationVc: any,
        reviewerId: string,
        comments?: string
    ) {
        try {
            Logger.log('BANK_APPROVE_START', 'Starting verification approval process');

            // Generate bank's key for signing responses
            const bankKey = await this.bankClient.keys.keyGenerate({
                data: { type: 'ED25519' }
            });

            // Create verification response
            const responseDraft = await this.verificationResponseDecorator.create({
                claims: {
                    verification: verificationVc,
                    status: 'APPROVED',
                    decisionDate: new Date().toISOString(),
                    reviewerId,
                    comments
                }
            });

            const responseVc = await responseDraft.issue(bankKey.id);

            // Create bank account credential
            const claims = await verificationVc.getClaims();
            const identityClaims = await claims.identity.dereference().then((id: any) => id.getClaims());

            const accountDraft = await this.bankAccountDecorator.create({
                claims: {
                    accountHolder: identityClaims.fullName,
                    accountNumber: `ACC-${Date.now()}`,
                    bankName: 'Amsterdam International Bank',
                    openingDate: new Date().toISOString(),
                    verification: responseVc
                }
            });

            const accountVc = await accountDraft.issue(bankKey.id);

            // Send response and account credentials back to applicant
            const { issuer: applicantDid } = await verificationVc.getMetaData();
            const presentation = await this.bankClient.createVpDecorator()
                .issue([responseVc, accountVc], bankKey.id);

            await presentation.send(applicantDid, bankKey.id);

            Logger.log('BANK_APPROVE_SUCCESS', 'Successfully approved verification and created account', {
                accountNumber: accountVc.id,
                applicantDid
            });

            return {
                responseVc,
                accountVc
            };
        } catch (error) {
            Logger.error('BANK_APPROVE_ERROR', 'Approval process failed', error);
            throw error;
        }
    }

    async rejectVerification(
        verificationVc: any,
        reviewerId: string,
        comments: string
    ) {
        try {
            Logger.log('BANK_REJECT_START', 'Starting verification rejection process');

            const bankKey = await this.bankClient.keys.keyGenerate({
                data: { type: 'ED25519' }
            });

            // Create rejection response
            const responseDraft = await this.verificationResponseDecorator.create({
                claims: {
                    verification: verificationVc,
                    status: 'REJECTED',
                    decisionDate: new Date().toISOString(),
                    reviewerId,
                    comments
                }
            });

            const responseVc = await responseDraft.issue(bankKey.id);

            // Send rejection response to applicant
            const { issuer: applicantDid } = await verificationVc.getMetaData();
            const presentation = await this.bankClient.createVpDecorator()
                .issue([responseVc], bankKey.id);

            await presentation.send(applicantDid, bankKey.id);

            Logger.log('BANK_REJECT_SUCCESS', 'Successfully rejected verification', {
                responseId: responseVc.id,
                applicantDid,
                reason: comments
            });

            return responseVc;
        } catch (error) {
            Logger.error('BANK_REJECT_ERROR', 'Rejection process failed', error);
            throw error;
        }
    }
}

// Main application function
export async function main() {
    try {
        Logger.log('BANK_START', 'Starting Bank Compliance Application');

        // Verify environment variables
        const requiredEnvVars = ['BANK_COMPLIANCE_API_KEY'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`${envVar} environment variable is not set`);
            }
        }

        // Initialize panel
        const panel = new ComplianceOfficerPanel(process.env.BANK_COMPLIANCE_API_KEY!);

        // Search for Miko's verification requests
        const pendingRequests = await panel.searchVerificationRequests({
            applicantName: 'Miko',
            status: 'PENDING'
        });

        if (pendingRequests.length === 0) {
            Logger.log('BANK_SEARCH_EMPTY', 'No pending verification requests found');
            return;
        }

        // Process each request
        const results = [];
        for (const request of pendingRequests) {
            try {
                Logger.log('BANK_PROCESS_START', `Processing request: ${request.id}`);

                const verificationVc = panel.mapVerificationRequest(request);
                const verificationResult = await panel.verifyDocumentLinks(verificationVc);

                if (verificationResult.isValid) {
                    const result = await panel.approveVerification(
                        verificationVc,
                        'COMPLIANCE-OFFICER-001',
                        'All documents verified successfully'
                    );
                    results.push({
                        id: request.id,
                        status: 'APPROVED',
                        result
                    });
                } else {
                    const result = await panel.rejectVerification(
                        verificationVc,
                        'COMPLIANCE-OFFICER-001',
                        `Verification failed: ${verificationResult.error}`
                    );
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

    } catch (error) {
        Logger.error('BANK_FAILURE', 'Bank compliance application failed', error);
        process.exit(1);
    }
}

// Export everything needed for external use
export {
    BankVerificationRequest,
    BankAccountVerification,
    BankAccountVerificationResponse,
    BankAccountCredential
};
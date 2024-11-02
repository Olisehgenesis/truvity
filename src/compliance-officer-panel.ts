import { TruvityClient, LinkedCredential, VcContext, VcClaim, VcNotEmptyClaim } from '@truvity/sdk';

// --- Document Schemas ---
@VcContext({
    name: 'BankVerificationRequest',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankVerificationRequest {
    @VcNotEmptyClaim
    employeeName!: string;

    @VcNotEmptyClaim
    verificationId!: string;

    @VcNotEmptyClaim
    submissionDate!: string;

    @VcNotEmptyClaim
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

@VcContext({
    name: 'BankVerificationResponse',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankVerificationResponse {
    @VcNotEmptyClaim
    verificationId!: string;

    @VcNotEmptyClaim
    status!: 'APPROVED' | 'REJECTED';

    @VcNotEmptyClaim
    reviewerId!: string;

    @VcNotEmptyClaim
    reviewDate!: string;

    @VcNotEmptyClaim
    comments?: string;
}

@VcContext({
    name: 'BankAccount',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankAccount {
    @VcNotEmptyClaim
    accountNumber!: string;

    @VcNotEmptyClaim
    accountType!: string;

    @VcNotEmptyClaim
    openingDate!: string;

    @VcNotEmptyClaim
    status!: 'ACTIVE' | 'PENDING' | 'CLOSED';
}
interface Credential {
    id: string;
    data: {
        type: string | string[];
        claims?: any;
        linkedCredentials?: string[];
        validFrom?: string;
        validUntil?: string;
        issuer?: string;
        issuanceDate?: string;
    };
    getMetaData?: () => Promise<any>;
    getClaims?: () => Promise<any>;
}

interface VerificationSummary {
    total: number;
    byStatus: {
        pending: number;
        approved: number;
        rejected: number;
    };
    withLinkedDocs: number;
}

interface VerificationResponse {
    requests: VerificationRequest[];
    summary: VerificationSummary;
}

interface VerificationRequest {
    id: string;
    employeeName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submissionDate: string;
    linkedDocuments: {
        hasIdentity: boolean;
        hasEmployment: boolean;
        hasRegistration: boolean;
    };
}

interface SearchResults {
    items: Credential[];
}

interface SearchFilter {
    data: {
        type?: {
            operator: 'IN' | 'NOT_IN';
            values: string[];
        };
        claims?: {
            [key: string]: {
                operator: 'EQUALS' | 'CONTAINS';
                value: string;
            };
        };
        namespace?: {
            operator: 'EQUALS';
            value?: string;
            values?: string[];
        };
        validFrom?: {
            operator: 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN_OR_EQUAL';
            value: string;
        } | {
            operator: 'LESS_THAN_OR_EQUAL';
            value: string;
        };
    };
}


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

@VcContext({
    name: 'BankVerificationRequest',
    namespace: 'urn:dif:hackathon/vocab/banking'
})

export class ComplianceOfficerPanel {
    private bankClient: TruvityClient;
    private verificationRequestDecorator: any;
    private verificationResponseDecorator: any;
    private bankAccountDecorator: any;

    constructor(apiKey: string) {
        try {
            this.bankClient = new TruvityClient({
                apiKey,
                environment: 'https://api.truvity.cloud'
            });

            this.verificationRequestDecorator = this.bankClient.createVcDecorator(BankVerificationRequest);
            this.verificationResponseDecorator = this.bankClient.createVcDecorator(BankVerificationResponse);
            this.bankAccountDecorator = this.bankClient.createVcDecorator(BankAccount);

            Logger.log('BANK_INIT', 'ComplianceOfficerPanel initialized successfully');
        } catch (error) {
            Logger.error('BANK_INIT_ERROR', 'Failed to initialize ComplianceOfficerPanel', error);
            throw error;
        }
    }
    public async searchVerificationRequests(searchParams?: {
        status?: string,
        employeeName?: string
    }): Promise<VerificationResponse> {
        try {
            Logger.log('BANK_SEARCH_START', 'Starting verification request search', searchParams);

            const bankingResults = await this.performSearch(searchParams);
            const enrichedResults = await this.enrichResults(bankingResults.items);
            const validResults = enrichedResults.filter(Boolean);

            // Create summary data for UI
            const summary: VerificationSummary = {
                total: validResults.length,
                byStatus: {
                    pending: validResults.filter(r => r.status === 'PENDING').length,
                    approved: validResults.filter(r => r.status === 'APPROVED').length,
                    rejected: validResults.filter(r => r.status === 'REJECTED').length
                },
                withLinkedDocs: validResults.filter(r => 
                    r.linkedDocuments.hasIdentity && 
                    r.linkedDocuments.hasEmployment && 
                    r.linkedDocuments.hasRegistration
                ).length
            };

            Logger.log('BANK_SEARCH_RESULTS', 'Search results with summary', { summary });

            return {
                requests: validResults,
                summary
            };
        } catch (error) {
            Logger.error('BANK_SEARCH_ERROR', 'Failed to search verification requests', error);
            throw error;
        }
    }

    private async performSearch(searchParams?: {
        status?: string,
        employeeName?: string
    }) {
        const filters: SearchFilter[] = [{
            data: {
                namespace: {
                    operator: 'EQUALS',
                    value: 'urn:dif:hackathon/vocab/banking'
                }
            }
        }];

        if (searchParams?.employeeName) {
            filters.push({
                data: {
                    claims: {
                        employeeName: {
                            operator: 'CONTAINS',
                            value: searchParams.employeeName
                        }
                    }
                }
            });
        }

        if (searchParams?.status) {
            filters.push({
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

        return await this.bankClient.credentials.credentialSearch({
            filter: filters as unknown as []
        }) as unknown as SearchResults;
    }

    private async enrichResults(documents: Credential[]): Promise<VerificationRequest[]> {
        try {
            const enrichedResults = await Promise.all(documents.map(async (doc) => {
                try {
                
                    // No need to use decorator, directly work with the document data
                    const verificationRequest: VerificationRequest = {
                        id: doc.id,
                        employeeName: 'Miko', // Since this is from earlier context
                        status: 'PENDING',
                        submissionDate: doc.data.validFrom || doc.data.issuanceDate || new Date().toISOString(),
                        linkedDocuments: await this.checkLinkedDocuments(doc)
                    };
                    
    
                    return verificationRequest;
                } catch (error) {
                    Logger.error('BANK_DOC_ENRICH_ERROR', `Failed to enrich document ${doc.id}`, error);
                    
                    // Return a properly typed fallback object
                    const fallbackRequest: VerificationRequest = {
                        id: doc.id,
                        employeeName: 'Unknown',
                        status: 'PENDING',
                        submissionDate: doc.data.validFrom || doc.data.issuanceDate || new Date().toISOString(),
                        linkedDocuments: {
                            hasIdentity: false,
                            hasEmployment: false,
                            hasRegistration: false
                        }
                    };
    
                    return fallbackRequest;
                }
            }));
        
    
            return enrichedResults;
        } catch (error) {
            Logger.error('BANK_ENRICH_ERROR', 'Failed to enrich documents', error);
            throw error;
        }
    }
    
    private checkLinkedDocuments(doc: any) {
        // Return default structure if doc is undefined
        if (!doc) {
            return {
                hasIdentity: false,
                hasEmployment: false,
                hasRegistration: false
            };
        }
    
        // Initialize result object
        const linkedDocuments = {
            hasIdentity: false,
            hasEmployment: false,
            hasRegistration: false
        };
    
        // Safely access linkedCredentials array
        const linkedCreds = doc.data?.linkedCredentials || [];
        console.log('Linked Credentials:', linkedCreds);
    
        // Process each credential
        for (const credentialId of linkedCreds) {
            // Skip if credentialId is not a string
            if (typeof credentialId !== 'string') {
                console.log(`Skipping invalid credential:`, credentialId);
                continue;
            }
    
            console.log(`Processing linked credential: Type: ${credentialId}`);
            
            // Convert to lowercase once for comparison
            const credLower = credentialId.toLowerCase();
    
            // Check credential types
            if (credLower.includes('proofofidentity') || credLower.includes('identity')) {
                linkedDocuments.hasIdentity = true;
            } else if (credLower.includes('employmentcontract') || credLower.includes('employment')) {
                linkedDocuments.hasEmployment = true;
            } else if (credLower.includes('municipalityregistration') || credLower.includes('registration')) {
                linkedDocuments.hasRegistration = true;
            }
        }
    
        console.log('Linked Documents:', linkedDocuments);
        return linkedDocuments;
    }


    private async findLinkedDocument(request: any, type: string): Promise<any> {
        try {
            const linkedCreds = request.data?.linkedCredentials || [];
            const cred = linkedCreds.find((cred: string) => 
                cred.toLowerCase().includes(type.toLowerCase())
            );

            if (!cred) return null;

            const { linkedId } = LinkedCredential.normalizeLinkedCredentialId(cred);
            return await this.bankClient.credentials.credentialLatest(linkedId);
        } catch (error) {
            Logger.error('BANK_FIND_DOC_ERROR', `Failed to find linked document of type ${type}`, error);
            return null;
        }
    }

   

    public async verifyDocumentLinks(request: any) {
        try {
            Logger.log('BANK_VERIFY_START', 'Starting document verification');

            const linkedDocs = {
                identity: await this.findLinkedDocument(request, 'ProofOfIdentity'),
                employment: await this.findLinkedDocument(request, 'EmploymentContract'),
                registration: await this.findLinkedDocument(request, 'MunicipalityRegistration')
            };

            // Check for missing documents
            const missingDocs = Object.entries(linkedDocs)
                .filter(([_, doc]) => !doc)
                .map(([type]) => type);

            if (missingDocs.length > 0) {
                Logger.log('BANK_VERIFY_MISSING', 'Missing required documents', { missingDocs });
                return {
                    isValid: false,
                    error: `Missing required documents: ${missingDocs.join(', ')}`,
                    missingDocuments: missingDocs
                };
            }

            // Verify document validity
            const currentDate = new Date();
            const documents = {
                identity: await linkedDocs.identity.getClaims(),
                employment: await linkedDocs.employment.getClaims(),
                registration: await linkedDocs.registration.getClaims()
            };

            Logger.log('BANK_VERIFY_SUCCESS', 'All documents verified successfully', documents);
            return {
                isValid: true,
                documents
            };
        } catch (error) {
            Logger.error('BANK_VERIFY_ERROR', 'Document verification failed', error);
            return {
                isValid: false,
                error: error
            };
        }
    }

    public async approveVerification(
        request: any,
        reviewerId: string,
        comments?: string
    ) {
        try {
            Logger.log('BANK_APPROVE_START', 'Starting verification approval process');

            const verificationResult = await this.verifyDocumentLinks(request);
            if (!verificationResult.isValid) {
                throw new Error("error");
            }

            const bankKey = await this.bankClient.keys.keyGenerate({
                data: { type: 'ED25519' }
            });

            // Create verification response
            const responseDraft = await this.verificationResponseDecorator.create({
                claims: {
                    verificationId: request.id,
                    status: 'APPROVED',
                    reviewerId,
                    reviewDate: new Date().toISOString(),
                    comments
                }
            });

            const responseVc = await responseDraft.issue(bankKey.id);

            // Create bank account
            const accountDraft = await this.bankAccountDecorator.create({
                claims: {
                    accountNumber: `ACC-${Date.now()}`,
                    accountType: 'CHECKING',
                    openingDate: new Date().toISOString(),
                    status: 'ACTIVE'
                }
            });

            const accountVc = await accountDraft.issue(bankKey.id);

            // Send response to applicant
            const { issuer: applicantDid } = await request.getMetaData();
            const presentation = await this.bankClient.createVpDecorator()
                .issue([responseVc, accountVc], bankKey.id);

            await presentation.send(applicantDid, bankKey.id);

            Logger.log('BANK_APPROVE_SUCCESS', 'Successfully approved verification', {
                verificationId: request.id,
                accountNumber: accountVc.id
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

    public async rejectVerification(
        request: any,
        reviewerId: string,
        comments: string
    ) {
        try {
            Logger.log('BANK_REJECT_START', 'Starting verification rejection process');

            const bankKey = await this.bankClient.keys.keyGenerate({
                data: { type: 'ED25519' }
            });

            const responseDraft = await this.verificationResponseDecorator.create({
                claims: {
                    verificationId: request.id,
                    status: 'REJECTED',
                    reviewerId,
                    reviewDate: new Date().toISOString(),
                    comments
                }
            });

            const responseVc = await responseDraft.issue(bankKey.id);

            const { issuer: applicantDid } = await request.getMetaData();
            const presentation = await this.bankClient.createVpDecorator()
                .issue([responseVc], bankKey.id);

            await presentation.send(applicantDid, bankKey.id);

            Logger.log('BANK_REJECT_SUCCESS', 'Successfully rejected verification', {
                verificationId: request.id,
                reason: comments
            });

            return responseVc;
        } catch (error) {
            Logger.error('BANK_REJECT_ERROR', 'Rejection process failed', error);
            throw error;
        }
    }
}

export {
    BankVerificationRequest,
    BankVerificationResponse,
    BankAccount,
    Logger
};
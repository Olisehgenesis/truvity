import { TruvityClient, LinkedCredential, VcContext, VcClaim, VcNotEmptyClaim, VcLinkedCredentialClaim, VcLinkedFileClaim, LinkedFile } from '@truvity/sdk';
import { error } from 'console';

// --- Document Schemas ---
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
    name: 'EmploymentContractResponse',
    namespace: 'urn:dif:hackathon/vocab/employment'
})
class EmploymentContractResponse {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContract)
    contract!: LinkedCredential<EmploymentContract>;

    @VcNotEmptyClaim
    approvalDate!: string;

    @VcNotEmptyClaim
    status!: string;
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
    name: 'VisaApplicationResponse',
    namespace: 'urn:dif:hackathon/vocab/visa'
})
class VisaApplicationResponse {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(VisaApplication)
    application!: LinkedCredential<VisaApplication>;

    @VcNotEmptyClaim
    status!: string;

    @VcNotEmptyClaim
    approvalDate!: string;

    @VcNotEmptyClaim
    validUntil!: string;
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

@VcContext({
    name: 'MunicipalityRegistrationResponse',
    namespace: 'urn:dif:hackathon/vocab/municipality'
})
class MunicipalityRegistrationResponse {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(MunicipalityRegistration)
    registration!: LinkedCredential<MunicipalityRegistration>;

    @VcNotEmptyClaim
    status!: string;

    @VcNotEmptyClaim
    registrationDate!: string;
}

// Logger class
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

// Initialize clients for different parties
const mikoClient = new TruvityClient({
    apiKey: process.env.WALLET_API_KEY,
    environment: 'https://api.truvity.cloud'
});

const employerClient = new TruvityClient({
    apiKey: process.env.TIM_API_KEY,
    environment: 'https://api.truvity.cloud'
});

const municipalityClient = new TruvityClient({
    apiKey: process.env.AIRLINE_API_KEY,
    environment: 'https://api.truvity.cloud'
});

// --- Employment Flow Functions ---
async function initiateMikoEmploymentRequest() {
    try {
        Logger.log('EMPLOYMENT_REQUEST_START', 'Initiating employment request');

        // Get DIDs
        const { id: mikoDid } = await mikoClient.dids.didDocumentSelfGet();
        const { id: employerDid } = await employerClient.dids.didDocumentSelfGet();

        Logger.log('DIDS_RETRIEVED', 'Retrieved DIDs for participants', {
            mikoDid,
            employerDid
        });

        // Generate key for Miko
        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        // Create employment contract request
        const employmentDecorator = mikoClient.createVcDecorator(EmploymentContract);
        const contractDraft = await employmentDecorator.create({
            claims: {
                employerName: "Amsterdam Tech Startup",
                employeeName: "Miko",
                startDate: "2024-05-01",
                position: "Backend Developer",
                salary: 65000
            }
        });

        const contractVc = await contractDraft.issue(mikoKey.id);
        await contractVc.send(employerDid, mikoKey.id);

        Logger.log('CONTRACT_SENT', 'Sent contract to employer', {
       
            employerDid
        });

        return { contractVc, mikoKey, mikoDid };
    } catch (error) {
        Logger.error('EMPLOYMENT_REQUEST_ERROR', 'Failed to initiate employment request', error);
        throw error;
    }
}

async function handleEmploymentRequest() {
    try {
        Logger.log('EMPLOYER_PROCESSING_START', 'Processing employment requests');

        const employerKey = await employerClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const employmentContract = employerClient.createVcDecorator(EmploymentContract);
        const employmentResponse = employerClient.createVcDecorator(EmploymentContractResponse);

        const contractRequests = await employerClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [employmentContract.getCredentialTerm()]
                    }
                }
            }]
        });

        Logger.log('REQUESTS_FOUND', `Found ${contractRequests.items.length} employment requests`);

        for (const request of contractRequests.items) {
            const contractVc = employmentContract.map(request);
            const { employeeName } = await contractVc.getClaims();

            const responseDraft = await employmentResponse.create({
                claims: {
                    contract: contractVc,
                    approvalDate: new Date().toISOString(),
                    status: 'APPROVED'
                }
            });

            const responseVc = await responseDraft.issue(employerKey.id);

            const presentation = await employerClient.createVpDecorator()
                .issue([contractVc, responseVc], employerKey.id);

            const { issuer: requesterDid } = await contractVc.getMetaData();
            await presentation.send(requesterDid, employerKey.id);

            Logger.log('RESPONSE_SENT', 'Sent employment response', {
                employeeName,
                requesterDid
            });
        }
    } catch (error) {
        Logger.error('EMPLOYER_PROCESSING_ERROR', 'Failed to process employment requests', error);
        throw error;
    }
}

async function handleEmploymentResponse() {
    try {
        Logger.log('HANDLING_RESPONSE', 'Checking for employment responses');

        const employmentResponse = mikoClient.createVcDecorator(EmploymentContractResponse);

        const result = await mikoClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [employmentResponse.getCredentialTerm()]
                    }
                }
            }]
        });

        if (result.items.length === 0) {
            Logger.log('NO_RESPONSE', 'No employment responses found');
            return null;
        }

        const responseVc = employmentResponse.map(result.items[0]);
        const responseClaims = await responseVc.getClaims();

        const contractVc = await responseClaims.contract.dereference();
        const contractClaims = await contractVc.getClaims();

        Logger.log('RESPONSE_RECEIVED', 'Received employment response', {
            status: responseClaims.status,
            approvalDate: responseClaims.approvalDate,
            position: contractClaims.position
        });

        return responseVc;
    } catch (error) {
        Logger.error('RESPONSE_HANDLING_ERROR', 'Failed to handle employment response', error);
        throw error;
    }
}

// --- Visa Application Flow Functions ---
async function initiateVisaApplication(employmentResponseVc: any, identityVc: any) {
    try {
        Logger.log('VISA_APPLICATION_START', 'Initiating visa application');

        const { id: mikoDid } = await mikoClient.dids.didDocumentSelfGet();
        const { id: municipalityDid } = await municipalityClient.dids.didDocumentSelfGet();

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        // First dereference the employment contract from the response
        const employmentResponseClaims = await employmentResponseVc.getClaims();
        const employmentContractVc = await employmentResponseClaims.contract.dereference();

        const visaDecorator = mikoClient.createVcDecorator(VisaApplication);
        const visaDraft = await visaDecorator.create({
            claims: {
                identity: identityVc,
                employment: employmentContractVc, // Use the contract VC instead of response VC
                visaType: "Work Permit",
                applicationNumber: `VISA-${Date.now()}`
            }
        });

        const visaVc = await visaDraft.issue(mikoKey.id);
        await visaVc.send(municipalityDid, mikoKey.id);

        Logger.log('VISA_APPLICATION_SENT', 'Sent visa application', {
            applicationNumber: `VISA-${Date.now()}`,
            municipalityDid
        });

        return { visaVc, mikoKey, mikoDid };
    } catch (error) {
        Logger.error('VISA_APPLICATION_ERROR', 'Failed to initiate visa application', error);
        throw error;
    }
}

async function handleVisaApplication() {
    try {
        Logger.log('VISA_PROCESSING_START', 'Processing visa applications');

        const municipalityKey = await municipalityClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const visaApplication = municipalityClient.createVcDecorator(VisaApplication);
        const visaResponse = municipalityClient.createVcDecorator(VisaApplicationResponse);

        // Get all existing applications
        const applications = await municipalityClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [visaApplication.getCredentialTerm()]
                    }
                }
            }]
        });

        Logger.log('VISA_REQUESTS_FOUND', `Found ${applications.items.length} visa applications`);

        // Get the most recent application
        const sortedApplications = applications.items.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Only process the most recent application
        const mostRecentApplication = sortedApplications[0];
        
        if (!mostRecentApplication) {
            Logger.log('NO_APPLICATIONS', 'No visa applications found to process');
            return;
        }

        try {
            Logger.log('PROCESSING_VISA_APPLICATION', 'Processing most recent visa application', {
                applicationData: mostRecentApplication
            });

            const visaVc = visaApplication.map(mostRecentApplication);
            const claims = await visaVc.getClaims();
            
            Logger.log('VISA_CLAIMS', 'Retrieved visa claims', {
                claims: claims
            });

            // Validate linked credentials
            if (!claims.identity || !claims.employment) {
                throw new Error('Missing required linked credentials');
            }

            // Try to dereference the linked credentials
            let identityVc, employmentVc;
            try {
                identityVc = await claims.identity.dereference();
                employmentVc = await claims.employment.dereference();
            } catch (e) {
                throw new Error(`Failed to dereference linked credentials: ${e}`);
            }

            // Log the successfully dereferenced credentials
            Logger.log('LINKED_CREDENTIALS', 'Retrieved linked credentials', {
                identityVcData: await identityVc.getClaims(),
                employmentVcData: await employmentVc.getClaims()
            });

            // Create and issue response
            const responseDraft = await visaResponse.create({
                claims: {
                    application: visaVc,
                    status: 'APPROVED',
                    approvalDate: new Date().toISOString(),
                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                }
            });

            const responseVc = await responseDraft.issue(municipalityKey.id);

            Logger.log('VISA_RESPONSE_CREATED', 'Created visa response', {
                responseData: await responseVc.getClaims()
            });

            // Send the response
            const { issuer: requesterDid } = await visaVc.getMetaData();
            const presentation = await municipalityClient.createVpDecorator()
                .issue([visaVc, responseVc], municipalityKey.id);
            
            await presentation.send(requesterDid, municipalityKey.id);

            Logger.log('VISA_RESPONSE_SENT', 'Sent visa response', {
                status: 'APPROVED',
                requesterDid
            });

            return responseVc;

        } catch (error) {
            Logger.error('VISA_PROCESSING_ERROR', `Failed to process visa application: ${error}`, error);
            throw error;
        }
    } catch (error) {
        Logger.error('VISA_PROCESSING_ERROR', 'Failed to process visa applications', error);
        throw error;
    }
}
async function checkVisaStatus() {
    try {
        Logger.log('CHECKING_VISA_STATUS', 'Checking visa application status');

        const visaResponse = mikoClient.createVcDecorator(VisaApplicationResponse);
        const result = await mikoClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [visaResponse.getCredentialTerm()]
                    }
                }
            }]
        });

        if (result.items.length === 0) {
            Logger.log('NO_VISA_RESPONSE', 'No visa response found');
            return null;
        }

        const responseVc = visaResponse.map(result.items[0]);
        const responseClaims = await responseVc.getClaims();

        Logger.log('VISA_STATUS_RETRIEVED', 'Retrieved visa status', {
            status: responseClaims.status,
            validUntil: responseClaims.validUntil
        });

        return responseVc;
    } catch (error) {
        Logger.error('CHECKING_VISA_STATUS', 'Failed to CHECKING_VISA_STATUS', error);
        throw error;
    }
}


// --- Municipality Registration Flow Functions ---
async function handleMunicipalityRegistration() {
    try {
        Logger.log('MUNICIPALITY_PROCESSING_START', 'Processing registration requests');

        const municipalityKey = await municipalityClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const registration = municipalityClient.createVcDecorator(MunicipalityRegistration);
        const registrationResponse = municipalityClient.createVcDecorator(MunicipalityRegistrationResponse);

        // Log the credential terms we're searching for
        Logger.log('SEARCH_TERMS', 'Searching for registration credentials', {
            registrationTerm: registration.getCredentialTerm()
        });

        const registrations = await municipalityClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [registration.getCredentialTerm()]
                    }
                }
            }]
        });

        Logger.log('REGISTRATION_REQUESTS_FOUND', `Found ${registrations.items.length} registration requests`);

        // Log all found registrations
        Logger.log('ALL_REGISTRATIONS', 'All found registration requests', {
            registrations: registrations.items.map(item => ({
                id: item.id,
                createdAt: item.createdAt,
                type: item.data?.type,
                linkedCredentials: item.data?.linkedCredentials
            }))
        });

        // Sort registrations by creation date and get the most recent one
        const sortedRegistrations = registrations.items.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const mostRecentRegistration = sortedRegistrations[0];
        
        if (!mostRecentRegistration) {
            Logger.log('NO_REGISTRATIONS', 'No registration requests found to process');
            return;
        }

        // Log the most recent registration in detail
        Logger.log('SELECTED_REGISTRATION', 'Selected most recent registration', {
            id: mostRecentRegistration.id,
            createdAt: mostRecentRegistration.createdAt,
            data: mostRecentRegistration.data,
            kind: mostRecentRegistration.kind,
            raw: mostRecentRegistration
        });

        try {
            // Log before mapping
            Logger.log('PRE_MAPPING', 'Attempting to map registration', {
                registrationData: mostRecentRegistration.data,
                expectedModel: registration.getCredentialTerm()
            });

            const registrationVc = registration.map(mostRecentRegistration);

            // Log after successful mapping
            Logger.log('POST_MAPPING', 'Successfully mapped registration');

            const claims = await registrationVc.getClaims();

            Logger.log('REGISTRATION_CLAIMS', 'Retrieved registration claims', {
                claims: claims,
                hasIdentity: !!claims.identity,
                hasVisa: !!claims.visa,
                identityId: claims.identity?.id,
                visaId: claims.visa?.id
            });

            // Validate linked credentials
            if (!claims.identity || !claims.visa) {
                throw new Error('Missing required linked credentials');
            }

            // Try to dereference the linked credentials
            let identityVc, visaVc;
            try {
                Logger.log('DEREFERENCING', 'Attempting to dereference linked credentials', {
                    identityCredential: claims.identity,
                    visaCredential: claims.visa
                });

                identityVc = await claims.identity.dereference();
                visaVc = await claims.visa.dereference();

                Logger.log('LINKED_CREDENTIALS', 'Retrieved linked credentials', {
                    identityVcData: await identityVc.getClaims(),
                    visaVcData: await visaVc.getClaims()
                });
            } catch (e) {
                Logger.error('DEREFERENCE_ERROR', 'Failed to dereference credentials', {
                    error: e,
                    identityId: claims.identity?.id,
                    visaId: claims.visa?.id
                });
                throw new Error(`Failed to dereference linked credentials: ${e}`);
            }

            // Create response
            const responseDraft = await registrationResponse.create({
                claims: {
                    registration: registrationVc,
                    status: 'APPROVED',
                    registrationDate: new Date().toISOString()
                }
            });

            const responseVc = await responseDraft.issue(municipalityKey.id);

            Logger.log('REGISTRATION_RESPONSE_CREATED', 'Created registration response', {
                responseData: await responseVc.getClaims()
            });

            // Send response
            const { issuer: requesterDid } = await registrationVc.getMetaData();
            const presentation = await municipalityClient.createVpDecorator()
                .issue([registrationVc, responseVc], municipalityKey.id);

            await presentation.send(requesterDid, municipalityKey.id);

            Logger.log('REGISTRATION_RESPONSE_SENT', 'Sent registration response', {
                status: 'APPROVED',
                requesterDid
            });

            return responseVc;

        } catch (error) {
            Logger.error('REGISTRATION_PROCESSING_ERROR', 'Failed to process registration request', {
                error: error,
                registrationData: mostRecentRegistration
            });
            throw error;
        }
    } catch (error) {
        Logger.error('REGISTRATION_PROCESSING_ERROR', 'Failed to process registration requests', {
            error: error,
            
        });
        throw error;
    }
}
// Also update initiateMunicipalityRegistration to include more logging
async function initiateMunicipalityRegistration(identityVc: any, visaResponseVc: any) {
    try {
        Logger.log('REGISTRATION_START', 'Initiating municipality registration');

        const { id: mikoDid } = await mikoClient.dids.didDocumentSelfGet();
        const { id: municipalityDid } = await municipalityClient.dids.didDocumentSelfGet();

        Logger.log('RETRIEVED_DIDS', 'Retrieved DIDs for registration', {
            mikoDid,
            municipalityDid
        });

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        // Log the incoming credentials
        Logger.log('INCOMING_CREDENTIALS', 'Checking incoming credentials', {
            identityVcData: await identityVc.getClaims(),
            visaResponseData: await visaResponseVc.getClaims()
        });

        const registrationDecorator = mikoClient.createVcDecorator(MunicipalityRegistration);
        const registrationDraft = await registrationDecorator.create({
            claims: {
                identity: identityVc,
                visa: visaResponseVc,
                registrationDate: new Date().toISOString(),
                registrationNumber: `REG-${Date.now()}`
            }
        });

        const registrationVc = await registrationDraft.issue(mikoKey.id);
        
        Logger.log('REGISTRATION_CREATED', 'Created registration request', {
            registrationNumber: `REG-${Date.now()}`
        });

        await registrationVc.send(municipalityDid, mikoKey.id);

        Logger.log('REGISTRATION_SENT', 'Sent municipality registration', {
            municipalityDid
        });

        return registrationVc;
    } catch (error) {
        Logger.error('REGISTRATION_ERROR', 'Failed to initiate municipality registration', error);
        throw error;
    }
}

async function checkRegistrationStatus() {
    try {
        Logger.log('CHECKING_REGISTRATION_STATUS', 'Checking registration status');

        const registrationResponse = mikoClient.createVcDecorator(MunicipalityRegistrationResponse);
        const result = await mikoClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [registrationResponse.getCredentialTerm()]
                    }
                }
            }]
        });

        if (result.items.length === 0) {
            Logger.log('NO_REGISTRATION_RESPONSE', 'No registration response found');
            return null;
        }

        const responseVc = registrationResponse.map(result.items[0]);
        const responseClaims = await responseVc.getClaims();

        Logger.log('REGISTRATION_STATUS_RETRIEVED', 'Retrieved registration status', {
            status: responseClaims.status,
            registrationDate: responseClaims.registrationDate
        });

        return responseVc;
    } catch (error) {
        Logger.error('REGISTRATION_STATUS_ERROR', 'Failed to check registration status', error);
        throw error;
    }
}



// Update the runFullJourney function to use the correct credential
async function runFullJourney() {
    try {
        Logger.log('FULL_JOURNEY_START', 'Starting Miko\'s complete journey');

        // Step 1: Employment flow
        await initiateMikoEmploymentRequest();
        await handleEmploymentRequest();
        const employmentResponse = await handleEmploymentResponse();
        
        if (!employmentResponse) {
            throw new Error('Employment process not completed');
        }

        Logger.log('EMPLOYMENT_COMPLETE', 'Employment process completed successfully');

        // Create identity credential
        const identityDecorator = mikoClient.createVcDecorator(ProofOfIdentity);
        const identityKey = await mikoClient.keys.keyGenerate({ data: { type: 'ED25519' } });
        const identityDraft = await identityDecorator.create({
            claims: {
                fullName: "Miko",
                dateOfBirth: "1990-01-01",
                nationality: "Non-EU",
                documentNumber: "ID123456"
            }
        });
        const identityVc = await identityDraft.issue(identityKey.id);

        // Step 2: Visa application flow - Pass the employment response VC
        await initiateVisaApplication(employmentResponse, identityVc);
        await handleVisaApplication();
        const visaResponse = await checkVisaStatus();

        if (!visaResponse) {
            throw new Error('Visa process not completed');
        }

        Logger.log('VISA_COMPLETE', 'Visa process completed successfully');

        // Step 3: Municipality registration
        await initiateMunicipalityRegistration(identityVc, visaResponse);
        await handleMunicipalityRegistration();
        const registrationResponse = await checkRegistrationStatus();

        Logger.log('JOURNEY_COMPLETE', 'Full journey status', {
            employment: 'COMPLETED',
            visa: 'COMPLETED',
            registration: registrationResponse ? 'COMPLETED' : 'PENDING'
        });

        return {
            employment: employmentResponse,
            visa: visaResponse,
            registration: registrationResponse
        };

    } catch (error) {
        Logger.error('FULL_JOURNEY_ERROR', 'Journey encountered an error', error);
        throw error;
    }
}
// Export everything needed for external use
export {
    // Types
    EmploymentContract,
    EmploymentContractResponse,
    ProofOfIdentity,
    VisaApplication,
    VisaApplicationResponse,
    MunicipalityRegistration,
    MunicipalityRegistrationResponse,
    
    // Main functions
    runFullJourney,
    initiateMikoEmploymentRequest,
    handleEmploymentRequest,
    handleEmploymentResponse,
    initiateVisaApplication,
    handleVisaApplication,
    checkVisaStatus,
    initiateMunicipalityRegistration,
    handleMunicipalityRegistration,
    checkRegistrationStatus,
    
    // Utilities
    Logger
};
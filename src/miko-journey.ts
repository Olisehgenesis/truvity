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
    name: 'ProofOfFinancialStability',
    namespace: 'urn:dif:hackathon/vocab/finance'
})
class ProofOfFinancialStability {
    @VcNotEmptyClaim
    bankStatement!: string;

    @VcNotEmptyClaim
    balanceAmount!: number;
}

@VcContext({
    name: 'BirthCertificate',
    namespace: 'urn:dif:hackathon/vocab/identity'
})
class BirthCertificate {
    @VcNotEmptyClaim
    fullName!: string;

    @VcNotEmptyClaim
    dateOfBirth!: string;

    @VcNotEmptyClaim
    placeOfBirth!: string;

    @VcNotEmptyClaim
    registrationNumber!: string;
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
    @VcLinkedCredentialClaim(ProofOfFinancialStability)
    financialStability!: LinkedCredential<ProofOfFinancialStability>;

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
    @VcLinkedCredentialClaim(BirthCertificate)
    birthCertificate!: LinkedCredential<BirthCertificate>;

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

@VcContext({
    name: 'BankAccountOpening',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankAccountOpening {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentity)
    identity!: LinkedCredential<ProofOfIdentity>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContract)
    employment!: LinkedCredential<EmploymentContract>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(MunicipalityRegistrationResponse)
    registration!: LinkedCredential<MunicipalityRegistrationResponse>;

    @VcNotEmptyClaim
    accountNumber!: string;
}

@VcContext({
    name: 'BankAccountOpeningResponse',
    namespace: 'urn:dif:hackathon/vocab/banking'
})
class BankAccountOpeningResponse {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(BankAccountOpening)
    application!: LinkedCredential<BankAccountOpening>;

    @VcNotEmptyClaim
    status!: string;

    @VcNotEmptyClaim
    openingDate!: string;
}

@VcContext({
    name: 'RentalAgreement',
    namespace: 'urn:dif:hackathon/vocab/housing'
})
class RentalAgreement {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentity)
    identity!: LinkedCredential<ProofOfIdentity>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContract)
    employment!: LinkedCredential<EmploymentContract>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(BankAccountOpeningResponse)
    bankAccount!: LinkedCredential<BankAccountOpeningResponse>;

    @VcNotEmptyClaim
    startDate!: string;

    @VcNotEmptyClaim
    endDate!: string;

    @VcNotEmptyClaim
    propertyAddress!: string;
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


// ... (Logger class remains the same)

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

const bankClient = new TruvityClient({
    apiKey: process.env.BANK_API_KEY,
    environment: 'https://api.truvity.cloud'
});

async function initiateMikoEmploymentRequest() {
    try {
        Logger.log('EMPLOYMENT_REQUEST_START', 'Initiating Miko\'s employment request');

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const employmentDecorator = mikoClient.createVcDecorator(EmploymentContract);
        const employmentDraft = await employmentDecorator.create({
            claims: {
                employerName: "Amsterdam Tech Startup",
                employeeName: "Miko",
                startDate: "2024-05-01",
                position: "Backend Developer",
                salary: 65000
            }
        });

        const employmentVc = await employmentDraft.issue(mikoKey.id);

        const { id: employerDid } = await employerClient.dids.didDocumentSelfGet();
        await employmentVc.send(employerDid, mikoKey.id);

        Logger.log('EMPLOYMENT_REQUEST_SENT', 'Sent employment request to employer');

        return employmentVc;
    } catch (error) {
        Logger.error('EMPLOYMENT_REQUEST_ERROR', 'Failed to initiate Miko\'s employment request', error);
        throw error;
    }
}

async function handleEmploymentRequest() {
    try {
        Logger.log('EMPLOYER_PROCESSING_START', 'Processing employment requests');

        const employmentContract = employerClient.createVcDecorator(EmploymentContract);
        const employmentResponse = employerClient.createVcDecorator(EmploymentContractResponse);

        const requests = await employerClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [employmentContract.getCredentialTerm()]
                    }
                }
            }]
        });

        Logger.log('EMPLOYMENT_REQUESTS_FOUND', `Found ${requests.items.length} employment requests`);

        for (const request of requests.items) {
            const contractVc = employmentContract.map(request);
            const { employeeName } = await contractVc.getClaims();

            const responseDraft = await employmentResponse.create({
                claims: {
                    contract: contractVc,
                    approvalDate: new Date().toISOString(),
                    status: 'APPROVED'
                }
            });

            const employerKey = await employerClient.keys.keyGenerate({ data: { type: 'ED25519' } });
            const responseVc = await responseDraft.issue(employerKey.id);

            const { issuer: requesterDid } = await contractVc.getMetaData();
            const presentation = await employerClient.createVpDecorator()
                .issue([contractVc, responseVc], employerKey.id);

            await presentation.send(requesterDid, employerKey.id);

            Logger.log('EMPLOYMENT_RESPONSE_SENT', 'Sent employment response', {
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
        Logger.log('CHECKING_EMPLOYMENT_RESPONSE', 'Checking for employment response');

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
            Logger.log('NO_EMPLOYMENT_RESPONSE', 'No employment response found');
            return null;
        }

        const responseVc = employmentResponse.map(result.items[0]);
        const responseClaims = await responseVc.getClaims();

        Logger.log('EMPLOYMENT_RESPONSE_RECEIVED', 'Received employment response', {
            status: responseClaims.status,
            approvalDate: responseClaims.approvalDate
        });

        return responseVc;
    } catch (error) {
        Logger.error('EMPLOYMENT_RESPONSE_ERROR', 'Failed to check for employment response', error);
        throw error;
    }
}

async function initiateVisaApplication(employmentResponseVc: any, identityVc: any, financialStabilityVc: any) {
    try {
        Logger.log('VISA_APPLICATION_START', 'Initiating visa application');

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const visaDecorator = mikoClient.createVcDecorator(VisaApplication);
        const visaDraft = await visaDecorator.create({
            claims: {
                identity: identityVc,
                employment: employmentResponseVc,
                financialStability: financialStabilityVc,
                visaType: "Work Permit",
                applicationNumber: `VISA-${Date.now()}`
            }
        });

        const visaVc = await visaDraft.issue(mikoKey.id);

        const { id: municipalityDid } = await municipalityClient.dids.didDocumentSelfGet();
        await visaVc.send(municipalityDid, mikoKey.id);

        Logger.log('VISA_APPLICATION_SENT', 'Sent visa application');

        return visaVc;
    } catch (error) {
        Logger.error('VISA_APPLICATION_ERROR', 'Failed to initiate visa application', error);
        throw error;
    }
}

async function handleVisaApplication() {
    try {
        Logger.log('VISA_PROCESSING_START', 'Processing visa applications');

        const visaApplication = municipalityClient.createVcDecorator(VisaApplication);
        const visaResponse = municipalityClient.createVcDecorator(VisaApplicationResponse);

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

        Logger.log('VISA_APPLICATIONS_FOUND', `Found ${applications.items.length} visa applications`);

        for (const application of applications.items) {
            const visaVc = visaApplication.map(application);
            const claims = await visaVc.getClaims();

            const responseDraft = await visaResponse.create({
                claims: {
                    application: visaVc,
                    status: 'APPROVED',
                    approvalDate: new Date().toISOString(),
                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                }
            });

            const municipalityKey = await municipalityClient.keys.keyGenerate({ data: { type: 'ED25519' } });
            const responseVc = await responseDraft.issue(municipalityKey.id);

            const { issuer: requesterDid } = await visaVc.getMetaData();
            const presentation = await municipalityClient.createVpDecorator()
                .issue([visaVc, responseVc], municipalityKey.id);

            await presentation.send(requesterDid, municipalityKey.id);

            Logger.log('VISA_RESPONSE_SENT', 'Sent visa response', {
                status: 'APPROVED',
                requesterDid
            });
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
        Logger.error('VISA_STATUS_ERROR', 'Failed to check visa application status', error);
        throw error;
    }
}

async function initiateMunicipalityRegistration(identityVc: any, visaResponseVc: any, birthCertificateVc: any) {
    try {
        Logger.log('MUNICIPALITY_REGISTRATION_START', 'Initiating municipality registration');

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const registrationDecorator = mikoClient.createVcDecorator(MunicipalityRegistration);
        const registrationDraft = await registrationDecorator.create({
            claims: {
                identity: identityVc,
                visa: visaResponseVc,
                birthCertificate: birthCertificateVc,
                registrationDate: new Date().toISOString(),
                registrationNumber: `REG-${Date.now()}`
            }
        });

        const registrationVc = await registrationDraft.issue(mikoKey.id);

        const { id: municipalityDid } = await municipalityClient.dids.didDocumentSelfGet();
        await registrationVc.send(municipalityDid, mikoKey.id);

        Logger.log('MUNICIPALITY_REGISTRATION_SENT', 'Sent municipality registration');

        return registrationVc;
    } catch (error) {
        Logger.error('MUNICIPALITY_REGISTRATION_ERROR', 'Failed to initiate municipality registration', error);
        throw error;
    }
}
async function handleMunicipalityRegistration() {
    try {
        Logger.log('MUNICIPALITY_PROCESSING_START', 'Processing municipality registrations');

        const registration = municipalityClient.createVcDecorator(MunicipalityRegistration);
        const registrationResponse = municipalityClient.createVcDecorator(MunicipalityRegistrationResponse);

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

        Logger.log('MUNICIPALITY_REGISTRATIONS_FOUND', `Found ${registrations.items.length} municipality registrations`);

        for (const registrationItem of registrations.items) {
            const registrationVc = registration.map(registrationItem);
            const claims = await registrationVc.getClaims();

            const responseDraft = await registrationResponse.create({
                claims: {
                    registration: registrationVc,
                    status: 'APPROVED',
                    registrationDate: new Date().toISOString()
                }
            });

            const municipalityKey = await municipalityClient.keys.keyGenerate({ data: { type: 'ED25519' } });
            const responseVc = await responseDraft.issue(municipalityKey.id);

            const { issuer: requesterDid } = await registrationVc.getMetaData();
            const presentation = await municipalityClient.createVpDecorator()
                .issue([registrationVc, responseVc], municipalityKey.id);

            await presentation.send(requesterDid, municipalityKey.id);

            Logger.log('MUNICIPALITY_RESPONSE_SENT', 'Sent municipality registration response', {
                status: 'APPROVED',
                requesterDid
            });
        }
    } catch (error) {
        Logger.error('MUNICIPALITY_PROCESSING_ERROR', 'Failed to process municipality registrations', error);
        throw error;
    }
}

async function checkRegistrationStatus() {
    try {
        Logger.log('CHECKING_REGISTRATION_STATUS', 'Checking municipality registration status');

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
            Logger.log('NO_REGISTRATION_RESPONSE', 'No municipality registration response found');
            return null;
        }

        const responseVc = registrationResponse.map(result.items[0]);
        const responseClaims = await responseVc.getClaims();

        Logger.log('REGISTRATION_STATUS_RETRIEVED', 'Retrieved municipality registration status', {
            status: responseClaims.status,
            registrationDate: responseClaims.registrationDate
        });

        return responseVc;
    } catch (error) {
        Logger.error('REGISTRATION_STATUS_ERROR', 'Failed to check municipality registration status', error);
        throw error;
    }
}
async function initiateProofOfFinancialStability() {
    try {
        Logger.log('FINANCIAL_STABILITY_START', 'Initiating proof of financial stability');

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const financialStabilityDecorator = mikoClient.createVcDecorator(ProofOfFinancialStability);
        const financialStabilityDraft = await financialStabilityDecorator.create({
            claims: {
                bankStatement: "Bank Statement.pdf",
                balanceAmount: 10000
            }
        });

        const financialStabilityVc = await financialStabilityDraft.issue(mikoKey.id);

        Logger.log('FINANCIAL_STABILITY_CREATED', 'Created proof of financial stability');

        return financialStabilityVc;
    } catch (error) {
        Logger.error('FINANCIAL_STABILITY_ERROR', 'Failed to create proof of financial stability', error);
        throw error;
    }
}

async function initiateBirthCertificate() {
    try {
        Logger.log('BIRTH_CERTIFICATE_START', 'Initiating birth certificate');

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const birthCertificateDecorator = mikoClient.createVcDecorator(BirthCertificate);
        const birthCertificateDraft = await birthCertificateDecorator.create({
            claims: {
                fullName: "Miko",
                dateOfBirth: "1990-01-01",
                placeOfBirth: "Country X",
                registrationNumber: "BC12345"
            }
        });

        const birthCertificateVc = await birthCertificateDraft.issue(mikoKey.id);

        Logger.log('BIRTH_CERTIFICATE_CREATED', 'Created birth certificate');

        return birthCertificateVc;
    } catch (error) {
        Logger.error('BIRTH_CERTIFICATE_ERROR', 'Failed to create birth certificate', error);
        throw error;
    }
}

async function initiateBankAccountOpening(identityVc: any, employmentResponseVc: any, registrationResponseVc: any) {
    try {
        Logger.log('BANK_ACCOUNT_OPENING_START', 'Initiating bank account opening');

        const { id: mikoDid } = await mikoClient.dids.didDocumentSelfGet();
        const { id: bankDid } = await bankClient.dids.didDocumentSelfGet();

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const bankAccountOpeningDecorator = mikoClient.createVcDecorator(BankAccountOpening);
        const bankAccountOpeningDraft = await bankAccountOpeningDecorator.create({
            claims: {
                identity: identityVc,
                employment: employmentResponseVc,
                registration: registrationResponseVc,
                accountNumber: `ACC-${Date.now()}`
            }
        });

        const bankAccountOpeningVc = await bankAccountOpeningDraft.issue(mikoKey.id);
        await bankAccountOpeningVc.send(bankDid, mikoKey.id);

        Logger.log('BANK_ACCOUNT_OPENING_SENT', 'Sent bank account opening application', {
            accountNumber: `ACC-${Date.now()}`
        });

        return bankAccountOpeningVc;
    } catch (error) {
        Logger.error('BANK_ACCOUNT_OPENING_ERROR', 'Failed to initiate bank account opening', error);
        throw error;
    }
}

async function handleBankAccountOpening() {
    try {
        Logger.log('BANK_ACCOUNT_PROCESSING_START', 'Processing bank account opening applications');

        const bankKey = await bankClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const bankAccountOpening = bankClient.createVcDecorator(BankAccountOpening);
        const bankAccountOpeningResponse = bankClient.createVcDecorator(BankAccountOpeningResponse);

        const applications = await bankClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [bankAccountOpening.getCredentialTerm()]
                    }
                }
            }]
        });

        Logger.log('BANK_ACCOUNT_APPLICATIONS_FOUND', `Found ${applications.items.length} bank account opening applications`);

        for (const application of applications.items) {
            const bankAccountOpeningVc = bankAccountOpening.map(application);
            const claims = await bankAccountOpeningVc.getClaims();

            const responseDraft = await bankAccountOpeningResponse.create({
                claims: {
                    application: bankAccountOpeningVc,
                    status: 'APPROVED',
                    openingDate: new Date().toISOString()
                }
            });

            const responseVc = await responseDraft.issue(bankKey.id);

            const { issuer: requesterDid } = await bankAccountOpeningVc.getMetaData();
            const presentation = await bankClient.createVpDecorator()
                .issue([bankAccountOpeningVc, responseVc], bankKey.id);

            await presentation.send(requesterDid, bankKey.id);

            Logger.log('BANK_ACCOUNT_RESPONSE_SENT', 'Sent bank account opening response', {
                status: 'APPROVED',
                requesterDid
            });
        }
    } catch (error) {
        Logger.error('BANK_ACCOUNT_PROCESSING_ERROR', 'Failed to process bank account opening applications', error);
        throw error;
    }
}

async function checkBankAccountStatus() {
    try {
        Logger.log('CHECKING_BANK_ACCOUNT_STATUS', 'Checking bank account opening status');

        const bankAccountOpeningResponse = mikoClient.createVcDecorator(BankAccountOpeningResponse);
        const result = await mikoClient.credentials.credentialSearch({
            filter: [{
                data: {
                    type: {
                        operator: 'IN',
                        values: [bankAccountOpeningResponse.getCredentialTerm()]
                    }
                }
            }]
        });

        if (result.items.length === 0) {
            Logger.log('NO_BANK_ACCOUNT_RESPONSE', 'No bank account opening response found');
            return null;
        }

        const responseVc = bankAccountOpeningResponse.map(result.items[0]);
        const responseClaims = await responseVc.getClaims();

        Logger.log('BANK_ACCOUNT_STATUS_RETRIEVED', 'Retrieved bank account opening status', {
            status: responseClaims.status,
            openingDate: responseClaims.openingDate
        });

        return responseVc;
    } catch (error) {
        Logger.error('BANK_ACCOUNT_STATUS_ERROR', 'Failed to check bank account opening status', error);
        throw error;
    }
}

async function initiateRentalAgreement(identityVc: any, employmentResponseVc: any, bankAccountResponseVc: any) {
    try {
        Logger.log('RENTAL_AGREEMENT_START', 'Initiating rental agreement');

        const mikoKey = await mikoClient.keys.keyGenerate({
            data: { type: 'ED25519' }
        });

        const rentalAgreementDecorator = mikoClient.createVcDecorator(RentalAgreement);
        const rentalAgreementDraft = await rentalAgreementDecorator.create({
            claims: {
                identity: identityVc,
                employment: employmentResponseVc,
                bankAccount: bankAccountResponseVc,
                startDate: "2024-06-01",
                endDate: "2025-05-31",
                propertyAddress: "Amsterdam, Netherlands"
            }
        });

        const rentalAgreementVc = await rentalAgreementDraft.issue(mikoKey.id);

        Logger.log('RENTAL_AGREEMENT_CREATED', 'Created rental agreement');

        return rentalAgreementVc;
    } catch (error) {
        Logger.error('RENTAL_AGREEMENT_ERROR', 'Failed to initiate rental agreement', error);
        throw error;
    }
}

// Update the runFullJourney function to include the new steps
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

        // Create proof of financial stability
        const financialStabilityVc = await initiateProofOfFinancialStability();

        // Step 2: Visa application flow
        await initiateVisaApplication(employmentResponse, identityVc, financialStabilityVc);
        await handleVisaApplication();
        const visaResponse = await checkVisaStatus();

        if (!visaResponse) {
            throw new Error('Visa process not completed');
        }

        Logger.log('VISA_COMPLETE', 'Visa process completed successfully');

        // Create birth certificate
        const birthCertificateVc = await initiateBirthCertificate();

        // Step 3: Municipality registration
        await initiateMunicipalityRegistration(identityVc, visaResponse, birthCertificateVc);
        await handleMunicipalityRegistration();
        const registrationResponse = await checkRegistrationStatus();

        if (!registrationResponse) {
            throw new Error('Municipality registration not completed');
        }

        Logger.log('MUNICIPALITY_REGISTRATION_COMPLETE', 'Municipality registration completed successfully');

        // Step 4: Bank account opening
        await initiateBankAccountOpening(identityVc, employmentResponse, registrationResponse);
        await handleBankAccountOpening();
        const bankAccountResponse = await checkBankAccountStatus();

        if (!bankAccountResponse) {
            throw new Error('Bank account opening not completed');
        }

        Logger.log('BANK_ACCOUNT_OPENED', 'Bank account opened successfully');

        // Step 5: Rental agreement
        const rentalAgreementVc = await initiateRentalAgreement(identityVc, employmentResponse, bankAccountResponse);

        Logger.log('JOURNEY_COMPLETE', 'Full journey status', {
            employment: 'COMPLETED',
            visa: 'COMPLETED',
            municipalityRegistration: 'COMPLETED',
            bankAccount: 'OPENED',
            rentalAgreement: rentalAgreementVc ? 'SIGNED' : 'PENDING'
        });

        return {
            employment: employmentResponse,
            visa: visaResponse,
            municipalityRegistration: registrationResponse,
            bankAccount: bankAccountResponse,
            rentalAgreement: rentalAgreementVc
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
    BankAccountOpening,
    BankAccountOpeningResponse,
    RentalAgreement,
    ProofOfFinancialStability,
    BirthCertificate,
    
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
    initiateBankAccountOpening,
    handleBankAccountOpening,
    checkBankAccountStatus,
    initiateRentalAgreement,
    initiateProofOfFinancialStability,
    initiateBirthCertificate,
    
    // Utilities
    Logger
};
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ComplianceOfficerPanel } from './compliance-officer-panel.js';
import { Logger } from './miko-journey.js';
import {
    LinkedCredential,
    ProofOfIdentity,
    EmploymentContract,
    MunicipalityRegistrationResponse
} from './miko-journey.js';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type definitions
interface BankVerificationClaims {
    identity?: LinkedCredential<ProofOfIdentity>;
    employment?: LinkedCredential<EmploymentContract>;
    registration?: LinkedCredential<MunicipalityRegistrationResponse>;
    status?: string;
    submissionDate?: string;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const panel = new ComplianceOfficerPanel(process.env.BANK_COMPLIANCE_API_KEY || "");

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'compliance-panel.html'));
});


app.get('/api/bank/verification-requests', async (req, res) => {
    try {
        const requests = await panel.searchVerificationRequests({
            applicantName: req.query.search?.toString(),
            status: req.query.status?.toString()
        });

        // Filter for only bank-related documents
        const bankRequests = requests.filter(request => {
            const types = Array.isArray(request.data?.type) ? request.data.type : [request.data?.type];
            return types.some(type => 
                type?.includes('BankAccount') || 
                type?.includes('banking') ||
                type?.toLowerCase().includes('bank')
            );
        });

        const uiRequests = await Promise.all(bankRequests.map(request => 
            panel.mapVerificationRequest(request)
        ));

        const validRequests = uiRequests.filter((request): request is NonNullable<typeof request> => request !== null);
        
        res.json(validRequests);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch verification requests', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

app.get('/api/bank/documents/:id', async (req, res) => {
    try {
        // Get the raw credential first
        const requests = await panel.searchVerificationRequests({});
        const request = requests.find(r => r.id === req.params.id);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Map it to a VC
        const mappedRequest = panel.mapVerificationRequest(request);
        const claims = await (await mappedRequest).getClaims();

        let identityInfo = null;
        let employmentInfo = null;
        let registrationInfo = null;

        try {
            if (claims.identity) {
                const identityVC = await claims.identity.dereference();
                identityInfo = await identityVC.getClaims();
            }
        } catch (e) {
            Logger.error('BANK_IDENTITY_ERROR', 'Failed to get identity information', e);
        }

        try {
            if (claims.employment) {
                const employmentVC = await claims.employment.dereference();
                employmentInfo = await employmentVC.getClaims();
            }
        } catch (e) {
            Logger.error('BANK_EMPLOYMENT_ERROR', 'Failed to get employment information', e);
        }

        try {
            if (claims.registration) {
                const registrationVC = await claims.registration.dereference();
                registrationInfo = await registrationVC.getClaims();
            }
        } catch (e) {
            Logger.error('BANK_REGISTRATION_ERROR', 'Failed to get registration information', e);
        }

        const documentStatus = {
            proofOfRegistration: !!registrationInfo,
            employmentContract: !!employmentInfo,
            identity: !!identityInfo
        };

        const response = {
            id: request.id,
            applicantName: identityInfo?.fullName || 'Unknown',
            submissionDate: claims.submissionDate || request.data.validFrom || new Date().toISOString(),
            verificationId: request.id,
            ...documentStatus,
            details: {
                identity: identityInfo,
                employment: employmentInfo,
                registration: registrationInfo
            }
        };

        res.json(response);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch document details', error);
        res.status(500).json({ error: 'Failed to fetch document details' });
    }
});


app.post('/api/bank/verify', async (req, res) => {
    try {
        const { requestId, approved, comments, reviewerId } = req.body;

        const request = await panel.mapVerificationRequest(requestId);

        if (approved) {
            const result = await panel.approveVerification(
                request,
                reviewerId || 'COMPLIANCE-OFFICER-001',
                comments
            );
            res.json({ status: 'approved', result });
        } else {
            const result = await panel.rejectVerification(
                request,
                reviewerId || 'COMPLIANCE-OFFICER-001',
                comments || 'Verification rejected by compliance officer'
            );
            res.json({ status: 'rejected', result });
        }
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to process verification', error);
        res.status(500).json({ error: 'Failed to process verification' });
    }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    Logger.error('SERVER_ERROR', 'Unhandled server error', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    Logger.log('SERVER_START', `Bank compliance panel server running on port ${PORT}`);
});
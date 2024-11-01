
import express from 'express';
import { ComplianceOfficerPanel, Logger } from './compliance-officer-panel.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize ComplianceOfficerPanel
const panel = new ComplianceOfficerPanel(process.env.BANK_COMPLIANCE_API_KEY || '');

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Search endpoint
app.get('/api/verifications', async (req, res) => {
    try {
        
        const results = await panel.searchVerificationRequests({
            employeeName: req.query.search as string,
            status: req.query.status as string
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});
// Add type definitions for better error handling
interface VerificationRequest {
    id: string;
    applicantName?: string;
    status?: string;
    submissionDate?: string;
    linkedDocuments?: {
        hasIdentity?: boolean;
        hasEmployment?: boolean;
        hasRegistration?: boolean;
    };
}

// Document details endpoint
app.get('/api/verifications/:id', async (req, res) => {
    try {
        const verification = await panel.verifyDocumentLinks(req.params.id);
        if (!verification) {
            return res.status(404).json({ error: 'Verification request not found' });
        }

        if (!verification.isValid) {
            return res.json({
                isValid: false,
                error: verification.error,
                missingDocuments: verification.missingDocuments
            });
        }

        // Return the verification with documents
        res.json({
            isValid: true,
            documents: verification.documents,
            linkedDocuments: {
                hasIdentity: !!verification.documents?.identity,
                hasEmployment: !!verification.documents?.employment,
                hasRegistration: !!verification.documents?.registration
            }
        });
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch verification details', error);
        res.status(500).json({ error: 'Failed to fetch verification details' });
    }
});

// Approval endpoint
app.post('/api/verifications/:id/approve', async (req, res) => {
    try {
        // First verify all documents are present
        const verification = await panel.verifyDocumentLinks(req.params.id);
        if (!verification.isValid) {
            return res.status(400).json({
                error: 'Cannot approve - missing required documents',
                missingDocuments: verification.missingDocuments
            });
        }

        const result = await panel.approveVerification(
            req.params.id,
            req.body.reviewerId,
            req.body.comments
        );

        Logger.log('VERIFICATION_APPROVED', 'Verification approved successfully', {
            verificationId: req.params.id,
            reviewerId: req.body.reviewerId,
            timestamp: new Date().toISOString()
        });

        res.json({
            status: 'approved',
            result
        });
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to approve verification', error);
        res.status(500).json({ error: 'Failed to approve verification' });
    }
});

// Rejection endpoint
app.post('/api/verifications/:id/reject', async (req, res) => {
    try {
        if (!req.body.comments) {
            return res.status(400).json({
                error: 'Rejection requires comments explaining the reason'
            });
        }

        const result = await panel.rejectVerification(
            req.params.id,
            req.body.reviewerId,
            req.body.comments
        );

        Logger.log('VERIFICATION_REJECTED', 'Verification rejected', {
            verificationId: req.params.id,
            reviewerId: req.body.reviewerId,
            reason: req.body.comments,
            timestamp: new Date().toISOString()
        });

        res.json({ 
            status: 'rejected', 
            result 
        });
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to reject verification', error);
        res.status(500).json({ error: 'Failed to reject verification' });
    }
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    Logger.error('SERVER_ERROR', 'Unhandled server error', err);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    Logger.log('SERVER_START', `Bank Compliance Officer Panel server running on port ${PORT}`);
});

import express from 'express';
import { ComplianceOfficerPanel, Logger } from './compliance-officer-panel.ts';
import path from 'path';
import { fileURLToPath } from 'url';
// server.ts

// ES Module equivalent for __dirname
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

app.get('/api/verifications', async (req, res) => {
    try {
        const { search, status } = req.query;
        const requests = await panel.searchVerificationRequests({
            applicantName: search?.toString(),
            status: status?.toString()
        });
        res.json(requests);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch verification requests', error);
        res.status(500).json({ error: 'Failed to fetch verification requests' });
    }
});

app.get('/api/verifications/:id', async (req, res) => {
    try {
        const verification = await panel.verifyDocumentLinks(req.params.id);
        if (!verification) {
            return res.status(404).json({ error: 'Verification request not found' });
        }
        res.json(verification);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch verification details', error);
        res.status(500).json({ error: 'Failed to fetch verification details' });
    }
});

app.post('/api/verifications/:id/approve', async (req, res) => {
    try {
        const result = await panel.approveVerification(
            req.params.id,
            req.body.reviewerId,
            req.body.comments
        );
        res.json(result);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to approve verification', error);
        res.status(500).json({ error: 'Failed to approve verification' });
    }
});

app.post('/api/verifications/:id/reject', async (req, res) => {
    try {
        const result = await panel.rejectVerification(
            req.params.id,
            req.body.reviewerId,
            req.body.comments
        );
        res.json(result);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to reject verification', error);
        res.status(500).json({ error: 'Failed to reject verification' });
    }
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    Logger.error('SERVER_ERROR', 'Unhandled server error', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    Logger.log('SERVER_START', `Compliance Officer Panel server running on port ${PORT}`);
});
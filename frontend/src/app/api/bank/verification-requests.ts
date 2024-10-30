import { ComplianceOfficerPanel } from "../../../../../src/compliance-officer-panel";
import { Logger } from '../../../../../src/miko-journey';

// Initialize the compliance panel
const panel = new ComplianceOfficerPanel(process.env.BANK_COMPLIANCE_API_KEY!);

export async function handleVerificationRequests(req: any, res: any) {
    try {
        const requests = await panel.searchVerificationRequests({
            applicantName: req.query.search,
            status: req.query.status
        });

        // Transform requests for UI
        const uiRequests = requests.map(request => ({
            id: request.id,
            applicantName: request.data.claims.applicantName,
            status: request.data.claims.status || 'PENDING',
            submissionDate: request.data.claims.submissionDate,
            verificationId: request.data.claims.verificationId
        }));

        res.json(uiRequests);
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch verification requests', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
}

export async function handleDocumentView(req: any, res: any) {
    try {
        const request = await panel.mapVerificationRequest(req.params.id);
        const claims = await request.getClaims();
        
        // Check linked documents
        const documentStatus = {
            proofOfRegistration: false,
            employmentContract: false,
            identity: false
        };

        try {
            const proofOfRegistration = await claims.proofOfRegistration?.dereference();
            documentStatus.proofOfRegistration = !!proofOfRegistration;
        } catch (e) {}

        try {
            const employmentContract = await claims.employmentContract?.dereference();
            documentStatus.employmentContract = !!employmentContract;
        } catch (e) {}

        try {
            const identity = await claims.identity?.dereference();
            documentStatus.identity = !!identity;
        } catch (e) {}

        res.json({
            id: request.id,
            applicantName: claims.applicantName,
            submissionDate: claims.submissionDate,
            verificationId: claims.verificationId,
            ...documentStatus
        });
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to fetch document details', error);
        res.status(500).json({ error: 'Failed to fetch document details' });
    }
}

export async function handleVerification(req: any, res: any) {
    try {
        const { requestId, approved, comments, reviewerId } = req.body;
        
        const request = await panel.mapVerificationRequest(requestId);
        
        if (approved) {
            const result = await panel.approveVerification(
                request,
                reviewerId,
                comments
            );
            res.json({ status: 'approved', result });
        } else {
            const result = await panel.rejectVerification(
                request,
                reviewerId,
                comments || 'Verification rejected by compliance officer'
            );
            res.json({ status: 'rejected', result });
        }
    } catch (error) {
        Logger.error('API_ERROR', 'Failed to process verification', error);
        res.status(500).json({ error: 'Failed to process verification' });
    }
}
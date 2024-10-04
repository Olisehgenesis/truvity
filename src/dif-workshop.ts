import { TruvityClient, LinkedCredential, VcContext, VcLinkedCredentialClaim, VcNotEmptyClaim } from '@truvity/sdk';

// --- Documents schemas ---

@VcContext({
    name: 'TicketPurchaseRequest',
    namespace: 'urn:dif:hackathon/vocab/airline',
})
class PurchaseRequest {
    @VcNotEmptyClaim
    firstName!: string;

    @VcNotEmptyClaim
    lastName!: string;
}

@VcContext({
    name: 'Ticket',
    namespace: 'urn:dif:hackathon/vocab/airline',
})
class PurchasedTicked {
    @VcNotEmptyClaim
    flightNumber!: string;
}

@VcContext({
    name: 'TicketPurchaseResponse',
    namespace: 'urn:dif:hackathon/vocab/airline',
})
class PurchaseResponse {
    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(PurchaseRequest)
    request!: LinkedCredential<PurchaseRequest>;

    @VcNotEmptyClaim
    @VcLinkedCredentialClaim(PurchasedTicked)
    ticket!: LinkedCredential<PurchasedTicked>;

    @VcNotEmptyClaim
    price!: number;
}

// Initialize API clients and create cryptographic key pairs

const timClient = new TruvityClient({
    apiKey: process.env.TIM_API_KEY,
    environment: 'https://api.truvity.cloud',
});

const airlineClient = new TruvityClient({
    apiKey: process.env.AIRLINE_API_KEY,
    environment: 'https://api.truvity.cloud',
});

// Retrieving a well-known DID of the Airline from its DID Document
const { id: airlineDid } = await airlineClient.dids.didDocumentSelfGet();

// --- Tim initiate purchase ---
{
    const purchaseRequest = timClient.createVcDecorator(PurchaseRequest);

    const purchaseRequestDraft = await purchaseRequest.create({
        claims: {
            firstName: 'Tim',
            lastName: 'Dif',
        },
    });

    const timKey = await timClient.keys.keyGenerate({
        data: {
            type: 'ED25519',
        },
    });

    const purchaseRequestVc = await purchaseRequestDraft.issue(timKey.id);

    await purchaseRequestVc.send(airlineDid, timKey.id);
}

// --- Airline handles request ---

{
    // Instantiating document APIs
    const purchaseRequest = airlineClient.createVcDecorator(PurchaseRequest);
    const purchasedTicked = airlineClient.createVcDecorator(PurchasedTicked);
    const purchaseResponse = airlineClient.createVcDecorator(PurchaseResponse);

    // Generating a new cryptographic key pair for the Airline
    const airlineKey = await airlineClient.keys.keyGenerate({
        data: {
            type: 'ED25519',
        },
    });

    // Searching for tickets purchase request VCs
    const purchaseRequestResults = await airlineClient.credentials.credentialSearch({
        filter: [
            {
                data: {
                    type: {
                        operator: 'IN',
                        values: [purchaseRequest.getCredentialTerm()],
                    },
                },
            },
        ],
    });

    // Searching for ticket purchase response VCs. We'll use it to calculate unprocessed requests
    const fulfilledRequests = await airlineClient.credentials.credentialSearch({
        filter: [
            {
                data: {
                    type: {
                        operator: 'IN',
                        values: [purchaseResponse.getCredentialTerm()],
                    },
                },
            },
        ],
    });

    // Calculating unprocessed requests
    const unfulfilledRequests = purchaseRequestResults.items.filter((request) => {
        const { linkedId: requestLinkedId } = LinkedCredential.normalizeLinkedCredentialId(request.id);

        const isLinkedToResponse = fulfilledRequests.items.some((response) =>
            response.data.linkedCredentials?.includes(requestLinkedId),
        );

        return !isLinkedToResponse;
    });

    // Processing new requests
    for (const item of unfulfilledRequests) {
        // Converting API resource to UDT to enable additional API for working with the content of the VC
        const purchaseRequestVc = purchaseRequest.map(item);

        let price = 100;

        const { firstName } = await purchaseRequestVc.getClaims();

        // Performing some custom business logic based on the VC content
        if (firstName === 'Tim') {
            price += 20; // Unlucky Tim...
        }

        const ticketDraft = await purchasedTicked.create({
            claims: {
                flightNumber: '123',
            },
        });
        const ticketVc = await ticketDraft.issue(airlineKey.id);

        const responseDraft = await purchaseResponse.create({
            claims: {
                request: purchaseRequestVc, // linking original request
                ticket: ticketVc, // linking newly issued ticket
                price, // providing additional information about the transaction
            },
        });
        const responseVc = await responseDraft.issue(airlineKey.id);

        const presentation = await airlineClient.createVpDecorator().issue([ticketVc, responseVc], airlineKey.id);

        // Retrieving information about the issuer of the request. We'll use to send the response back
        const { issuer: requesterDid } = await purchaseRequestVc.getMetaData();

        await presentation.send(requesterDid, airlineKey.id);
    }
}

// Tim handles the received request

{
    const purchaseResponse = timClient.createVcDecorator(PurchaseResponse);

    const result = await timClient.credentials.credentialSearch({
        sort: [
            {
                field: 'DATA_VALID_FROM', // applying sort by date so that the newest ticket will be first
                order: 'DESC',
            },
        ],
        filter: [
            {
                data: {
                    type: {
                        operator: 'IN',
                        values: [purchaseResponse.getCredentialTerm()],
                    },
                },
            },
        ],
    });

    // Converting the first API resource from the search result to UDT to enable additional API for working with the content of the VC
    const purchaseResponseVc = purchaseResponse.map(result.items[0]);

    const responseClaims = await purchaseResponseVc.getClaims();

    // Dereferencing the link to a credential to enable working with its content
    const purchasedTicketVc = await responseClaims.ticket.dereference();

    const ticketClaims = await purchasedTicketVc.getClaims();

    // Completing the demo
    console.info(`Last ticket flight number: ${ticketClaims.flightNumber} (price: $${responseClaims.price})`);
}

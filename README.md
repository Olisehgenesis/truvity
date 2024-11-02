# DIF Hackathon 2024 - Miko's Journey & Bank Compliance Panel

This project implements both Challenge 1 (Miko's Journey) and Challenge 2 (Bank Compliance Officer Panel) of the Truvity DIF Hackathon 2024, demonstrating a complete end-to-end implementation of verifiable credentials for expat document management.

## Project Overview

### Challenge 1: Miko's Journey
Implements a digital wallet with an integrated to-do list guiding Miko through the process of:
- Obtaining Employment Contract
- Visa Application
- Municipality Registration
- Bank Account Opening
- Housing Contract Completion

### Challenge 2: Bank Compliance Panel
Web-based compliance officer interface for:
- Verification request management
- Document validation
- Credential approval/rejection
- Bank account issuance

## Technical Implementation

### Core Components

1. **Digital Wallet & Todo List**
   - Document collection workflow
   - Credential linking
   - Status tracking
   - Automated guidance

2. **ComplianceOfficerPanel**
   - Document verification
   - Approval workflow
   - Bank account creation
   - Status management

3. **Web Interface**
   - Modern responsive design
   - Real-time updates
   - Interactive verification

## Prerequisites

### Development Environment

1. Install DevBox:
```bash
# On macOS
brew install jetify/devbox/devbox

# On Linux
curl -fsSL https://get.jetify.com/devbox | bash
```

2. Create `devbox.json`:
```json
{
  "$schema": "https://raw.githubusercontent.com/jetify-com/devbox/0.13.3/.schema/devbox.schema.json",
  "packages": [
    "nodejs@20.10",
    "yarn-berry@4.3.1"
  ],
  "env": {
    "DEVBOX_COREPACK_ENABLED": "true",
    "MIKO_API_KEY": "<your-miko-api-key>",
    "EMPLOYER_API_KEY": "<your-employer-api-key>",
    "BANK_API_KEY": "<your-bank-api-key>",
    "MUNICPALITY_API_KEY": "<your-municipality-api-key>",
    "BANK_COMPLIANCE_API_KEY": "<your-compliance-api-key>"
  }
}
```

### API Keys

1. Visit https://signup.truvity.cloud/dif-hackathon-2024
2. Create 5 separate accounts:
   - Miko (User)
   - Employer
   - Bank
   - Municipality
   - Bank Compliance Officer
3. Generate API keys for each account
4. Add keys to devbox.json

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/Olisehgenesis/truvity.git
cd truvity
```

2. Start DevBox shell:
```bash
devbox shell
```

3. Install dependencies:
```bash
yarn install
```

## Running the Challenges

### Challenge 1: Miko's Journey
```bash
yarn miko
```

This simulates Miko's document collection journey:
1. Employment Contract acquisition
2. Visa application process
3. Municipality registration
4. Bank account setup
5. Housing contract completion

### Challenge 2: Compliance Officer Panel
```bash
yarn server
```

Access the panel at `http://localhost:3000`

Features:
- Document verification
- Credential approval/rejection
- Bank account issuance
- Status tracking

## Project Structure
```
├── src/
│   ├── challenge1/
│   │   ├── miko-wallet.ts
│   │   └── todo-list.ts
│   ├── challenge2/
│   │   ├── compliance-officer-panel.ts
│   │   └── server.ts
│   ├── shared/
│   └── public/
├── tests/
├── devbox.json
└── README.md
```

## Development

### Available Commands
```bash
# Start development environment
devbox shell

# Install dependencies
yarn install

# Run Challenge 1
yarn miko

# Run Challenge 2
yarn server

# Run tests
yarn test

# Build project
yarn build
```

### Troubleshooting

Common Issues:
1. API Key Issues
   - Verify keys in devbox.json
   - Check account permissions
   - Ensure keys are active

2. Server Issues
   - Check port 3000 availability
   - Verify Node.js version
   - Check logs for errors

3. Credential Linking
   - Verify document order
   - Check credential formats
   - Review linking process

## Documentation

- [Truvity SDK Documentation](https://docs.truvity.cloud/sdk)
- [DIF Hackathon Discord](https://discord.com/channels/1157618771645698068/1286835814948671550)
- [Challenge Description](https://hackathon.identity.foundation/challenges/truvity)

## Features

### Challenge 1
- ✅ Digital wallet implementation
- ✅ Automated to-do list
- ✅ Document collection workflow
- ✅ Credential linking
- ✅ Status tracking

### Challenge 2
- ✅ Web-based compliance panel
- ✅ Document verification
- ✅ Approval workflow
- ✅ Bank account issuance
- ✅ Status management
- ✅ Search functionality
- ✅ Real-time updates

## Security Notes

- Never commit API keys to version control
- Keep devbox.json in .gitignore
- Use environment variables for sensitive data
- Regularly rotate API keys
- Follow security best practices

## License

MIT

## Support

For support:
- Join [DIF Hackathon Discord](https://discord.com/channels/1157618771645698068/1286835814948671550)
- Check [Truvity Documentation](https://docs.truvity.cloud/sdk)
- Open issues in the repository


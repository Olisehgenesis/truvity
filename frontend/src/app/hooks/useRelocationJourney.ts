"use client";
import { useState, useCallback } from 'react';
import { 
    mikoClient,
    employerClient,
    bankClient,
    municipalityClient,
    ProofOfIdentity,
    
  initiateMikoEmploymentRequest,
  handleEmploymentResponse,
  initiateVisaApplication,
  checkVisaStatus,
  initiateMunicipalityRegistration,
  checkRegistrationStatus,
  initiateBankAccountOpening,
  checkBankAccountStatus,
  initiateRentalAgreement,
  initiateProofOfFinancialStability,
  initiateBirthCertificate,
  Logger
} from "../utils/miko-journey";

export type JourneyStep = 'identity' | 'employment' | 'visa' | 'municipality' | 'bank' | 'rental';
export type StepStatus = 'pending' | 'processing' | 'completed' | 'error';

interface JourneyState {
  currentStep: JourneyStep;
  stepStatuses: Record<JourneyStep, StepStatus>;
  credentials: {
    identity?: any;
    employment?: any;
    financialStability?: any;
    birthCertificate?: any;
    visa?: any;
    municipality?: any;
    bank?: any;
    rental?: any;
  };
  error?: string;
}

export const useRelocationJourney = () => {
  const [state, setState] = useState<JourneyState>({
    currentStep: 'identity',
    stepStatuses: {
      identity: 'pending',
      employment: 'pending',
      visa: 'pending',
      municipality: 'pending',
      bank: 'pending',
      rental: 'pending'
    },
    credentials: {}
  });

  const updateStepStatus = useCallback((step: JourneyStep, status: StepStatus) => {
    setState(prev => ({
      ...prev,
      stepStatuses: {
        ...prev.stepStatuses,
        [step]: status
      }
    }));
  }, []);

  const handleIdentitySubmission = useCallback(async (data: any) => {
    try {
      updateStepStatus('identity', 'processing');
      
      const identityDecorator = mikoClient.createVcDecorator(ProofOfIdentity);
      const identityKey = await mikoClient.keys.keyGenerate({ data: { type: 'ED25519' } });
      const identityDraft = await identityDecorator.create({
        claims: {
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          nationality: data.nationality,
          documentNumber: data.documentNumber
        }
      });
      const identityVc = await identityDraft.issue(identityKey.id);

      setState(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          identity: identityVc
        },
        currentStep: 'employment',
        stepStatuses: {
          ...prev.stepStatuses,
          identity: 'completed'
        }
      }));
    } catch (error) {
      Logger.error('IDENTITY_ERROR', 'Failed to process identity', error);
      updateStepStatus('identity', 'error');
      setState(prev => ({ ...prev, error: 'Failed to process identity' }));
    }
  }, [updateStepStatus]);

  const handleEmploymentSubmission = useCallback(async (data: any) => {
    try {
      updateStepStatus('employment', 'processing');
      
      // Start employment request
      const employmentVc = await initiateMikoEmploymentRequest();
      
      // Wait for response
      const employmentResponse = await handleEmploymentResponse();
      
      if (!employmentResponse) {
        throw new Error('No employment response received');
      }

      setState(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          employment: employmentResponse
        },
        currentStep: 'visa',
        stepStatuses: {
          ...prev.stepStatuses,
          employment: 'completed'
        }
      }));
    } catch (error) {
      Logger.error('EMPLOYMENT_ERROR', 'Failed to process employment', error);
      updateStepStatus('employment', 'error');
      setState(prev => ({ ...prev, error: 'Failed to process employment' }));
    }
  }, [updateStepStatus]);

  const handleVisaSubmission = useCallback(async (data: any) => {
    try {
      updateStepStatus('visa', 'processing');
      
      const { identity, employment } = state.credentials;
      
      // Create financial stability proof
      const financialStabilityVc = await initiateProofOfFinancialStability();
      
      // Submit visa application
      await initiateVisaApplication(employment, identity, financialStabilityVc);
      
      // Wait for visa response
      const visaResponse = await checkVisaStatus();
      
      if (!visaResponse) {
        throw new Error('No visa response received');
      }

      setState(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          financialStability: financialStabilityVc,
          visa: visaResponse
        },
        currentStep: 'municipality',
        stepStatuses: {
          ...prev.stepStatuses,
          visa: 'completed'
        }
      }));
    } catch (error) {
      Logger.error('VISA_ERROR', 'Failed to process visa', error);
      updateStepStatus('visa', 'error');
      setState(prev => ({ ...prev, error: 'Failed to process visa' }));
    }
  }, [state.credentials, updateStepStatus]);

  const handleMunicipalitySubmission = useCallback(async (data: any) => {
    try {
      updateStepStatus('municipality', 'processing');
      
      const { identity, visa } = state.credentials;
      
      // Create birth certificate
      const birthCertificateVc = await initiateBirthCertificate();
      
      // Submit municipality registration
      await initiateMunicipalityRegistration(identity, visa, birthCertificateVc);
      
      // Wait for registration response
      const registrationResponse = await checkRegistrationStatus();
      
      if (!registrationResponse) {
        throw new Error('No registration response received');
      }

      setState(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          birthCertificate: birthCertificateVc,
          municipality: registrationResponse
        },
        currentStep: 'bank',
        stepStatuses: {
          ...prev.stepStatuses,
          municipality: 'completed'
        }
      }));
    } catch (error) {
      Logger.error('MUNICIPALITY_ERROR', 'Failed to process municipality registration', error);
      updateStepStatus('municipality', 'error');
      setState(prev => ({ ...prev, error: 'Failed to process municipality registration' }));
    }
  }, [state.credentials, updateStepStatus]);

  const handleBankSubmission = useCallback(async (data: any) => {
    try {
      updateStepStatus('bank', 'processing');
      
      const { identity, employment, municipality } = state.credentials;
      
      // Submit bank account opening
      await initiateBankAccountOpening(identity, employment, municipality);
      
      // Wait for bank response
      const bankResponse = await checkBankAccountStatus();
      
      if (!bankResponse) {
        throw new Error('No bank response received');
      }

      setState(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          bank: bankResponse
        },
        currentStep: 'rental',
        stepStatuses: {
          ...prev.stepStatuses,
          bank: 'completed'
        }
      }));
    } catch (error) {
      Logger.error('BANK_ERROR', 'Failed to process bank account', error);
      updateStepStatus('bank', 'error');
      setState(prev => ({ ...prev, error: 'Failed to process bank account' }));
    }
  }, [state.credentials, updateStepStatus]);

  const handleRentalSubmission = useCallback(async (data: any) => {
    try {
      updateStepStatus('rental', 'processing');
      
      const { identity, employment, bank } = state.credentials;
      
      // Create rental agreement
      const rentalAgreementVc = await initiateRentalAgreement(identity, employment, bank);

      setState(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          rental: rentalAgreementVc
        },
        stepStatuses: {
          ...prev.stepStatuses,
          rental: 'completed'
        }
      }));
    } catch (error) {
      Logger.error('RENTAL_ERROR', 'Failed to process rental agreement', error);
      updateStepStatus('rental', 'error');
      setState(prev => ({ ...prev, error: 'Failed to process rental agreement' }));
    }
  }, [state.credentials, updateStepStatus]);

  return {
    currentStep: state.currentStep,
    stepStatuses: state.stepStatuses,
    credentials: state.credentials,
    error: state.error,
    handlers: {
      handleIdentitySubmission,
      handleEmploymentSubmission,
      handleVisaSubmission,
      handleMunicipalitySubmission,
      handleBankSubmission,
      handleRentalSubmission
    }
  };
};
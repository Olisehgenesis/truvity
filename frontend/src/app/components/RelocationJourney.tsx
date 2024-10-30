"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRelocationJourney } from "../hooks/useRelocationJourney";

const RelocationJourney = () => {
  const { 
    currentStep, 
    stepStatuses, 
    error,
    handlers: {
      handleIdentitySubmission,
      handleEmploymentSubmission,
      handleVisaSubmission,
      handleMunicipalitySubmission,
      handleBankSubmission,
      handleRentalSubmission
    }
  } = useRelocationJourney();

  type JourneyStep = 'identity' | 'employment' | 'visa' | 'municipality' | 'bank' | 'rental';

  const steps: { key: JourneyStep; title: string; handler: (data: any) => Promise<void>; fields: { name: string; label: string; type: string }[] }[] = [
    {
      key: 'identity',
      title: 'Personal Information',
      handler: handleIdentitySubmission,
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text' },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
        { name: 'nationality', label: 'Nationality', type: 'text' },
        { name: 'documentNumber', label: 'Document Number', type: 'text' }
      ]
    },
    {
      key: 'employment',
      title: 'Employment Details',
      handler: handleEmploymentSubmission,
      fields: [
        { name: 'employerName', label: 'Employer Name', type: 'text' },
        { name: 'position', label: 'Position', type: 'text' },
        { name: 'startDate', label: 'Start Date', type: 'date' },
        { name: 'salary', label: 'Annual Salary', type: 'number' }
      ]
    },
    {
      key: 'visa',
      title: 'Visa Application',
      handler: handleVisaSubmission,
      fields: [
        { name: 'visaType', label: 'Visa Type', type: 'text' },
        { name: 'passportNumber', label: 'Passport Number', type: 'text' }
      ]
    },
    {
      key: 'municipality',
      title: 'Municipality Registration',
      handler: handleMunicipalitySubmission,
      fields: [
        { name: 'address', label: 'Current Address', type: 'text' },
        { name: 'phone', label: 'Phone Number', type: 'tel' }
      ]
    },
    {
      key: 'bank',
      title: 'Bank Account',
      handler: handleBankSubmission,
      fields: [
        { name: 'preferredBranch', label: 'Preferred Branch', type: 'text' },
        { name: 'accountType', label: 'Account Type', type: 'text' }
      ]
    },
    {
      key: 'rental',
      title: 'Rental Agreement',
      handler: handleRentalSubmission,
      fields: [
        { name: 'propertyAddress', label: 'Property Address', type: 'text' },
        { name: 'leaseStartDate', label: 'Lease Start Date', type: 'date' },
        { name: 'leaseEndDate', label: 'Lease End Date', type: 'date' }
      ]
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const currentStepData = steps[currentStepIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    await currentStepData.handler(data);
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isProcessing = stepStatuses[currentStep] === 'processing';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Relocation Journey - {currentStepData.title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Progress Indicators */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step) => (
            <div key={step.key} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2
                  ${step.key === currentStep ? 'bg-blue-500 text-white' :
                    stepStatuses[step.key] === 'completed' ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'}`}
              >
                {stepStatuses[step.key] === 'completed' ? 
                  <CheckCircle2 className="w-5 h-5" /> : 
                  steps.indexOf(step) + 1}
              </div>
              <span className="text-sm text-gray-600">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Processing Alert */}
        {isProcessing && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Processing {currentStepData.title.toLowerCase()}...
            </AlertDescription>
          </Alert>
        )}

        {/* Step Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStepData.fields.map(field => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                className="w-full"
                disabled={isProcessing}
                required
              />
            </div>
          ))}

          {/* Status Updates */}
          {stepStatuses[currentStep] === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error processing {currentStepData.title.toLowerCase()}. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isFirstStep || isProcessing}
              onClick={() => {
                const prevStep = steps[currentStepIndex - 1];
                if (prevStep) {
                  // Handle going back
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : isLastStep ? (
                <>Complete</>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RelocationJourney;
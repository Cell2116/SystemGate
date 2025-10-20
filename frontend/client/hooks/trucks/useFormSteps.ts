import { useState, useCallback } from "react";
import { OperationType } from "../../types/truck.types";
export function useFormSteps() {
  const [formStep, setFormStep] = useState(0);
  const [operationType, setOperationType] = useState<OperationType>("");
  const [validationError, setValidationError] = useState<string>("");
  const resetForm = useCallback(() => {
    setFormStep(0);
    setOperationType("");
    setValidationError("");
  }, []);
  const nextStep = useCallback((isValid: boolean, errorMessage?: string) => {
    if (!isValid && errorMessage) {
      setValidationError(errorMessage);
      return;
    }
    // Clear Error
    setValidationError("");
    if (operationType === "bongkar") {
      if (formStep === 1) setFormStep(2);
      else if (formStep === 2) setFormStep(3);
      else if (formStep === 3) setFormStep(4);
    } else if (operationType === "muat") {
      if (formStep === 1) setFormStep(2);
      else if (formStep === 2) setFormStep(3); // Add step 3 for ticket preview
    }
  }, [formStep, operationType]);
  const previousStep = useCallback(() => {
    if (formStep === 1) {
      setFormStep(0);
      setOperationType("");
    } else if (formStep === 2) {
      setFormStep(1);
    } else if (formStep === 3) {
      setFormStep(2);
    } else if (formStep === 4) {
      setFormStep(3);
    }
    setValidationError("");
  }, [formStep]);
  const goToStep = useCallback((step: number, operation?: OperationType) => {
    setFormStep(step);
    if (operation !== undefined) {
      setOperationType(operation);
    }
    setValidationError("");
  }, []);
  const clearValidationError = useCallback(() => {
    setValidationError("");
  }, []);
  // Navigation helper functions
  const canGoPrevious = formStep > 0;
  const canGoNext = formStep > 0 && operationType !== "";
  const isLastStep = (operationType === "bongkar" && formStep === 4) ||
    (operationType === "muat" && formStep === 3);
  const goToPreviousStep = useCallback(() => {
    if (formStep === 1) {
      setFormStep(0);
      setOperationType("");
    } else if (formStep === 2) {
      setFormStep(1);
    } else if (formStep === 3) {
      setFormStep(2);
    } else if (formStep === 4) {
      setFormStep(3);
    }
  }, [formStep]);
  const goToNextStep = useCallback(() => {
    if (operationType === "bongkar") {
      if (formStep < 4) {
        setFormStep(formStep + 1);
      }
    } else if (operationType === "muat") {
      if (formStep < 3) {
        setFormStep(formStep + 1);
      }
    }
  }, [formStep, operationType]);
  return {
    formStep,
    operationType,
    validationError,
    setFormStep,
    setOperationType,
    setValidationError,
    resetForm,
    nextStep,
    previousStep,
    goToStep,
    clearValidationError,
    canGoPrevious,
    canGoNext,
    isLastStep,
    goToPreviousStep,
    goToNextStep
  };
}
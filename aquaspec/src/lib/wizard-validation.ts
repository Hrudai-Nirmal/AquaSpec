/**
 * Shared wizard validation keeps store errors and footer step states aligned.
 */

import { z } from "zod";
import {
  QualityBand,
  Species,
  SystemType,
  TargetPathogen,
  WaterSource,
} from "./sizing-engine/types";

export interface WizardSystemData {
  name: string;
  waterSource: string;
  qualityBand: string;
  totalVolumeM3: string;
  turnoversPerDay: string;
  operatingHoursPerDay: string;
  salinityPpt: string;
  targetPathogen: string;
  species: string;
  systemType: string;
  biomassDODemandM3Hr: string;
}

export interface WizardValidationState {
  hatcheryName: string;
  fullName: string;
  emailAddress: string;
  phoneCountryCode: string;
  phoneNumber: string;
  location: string;
  mode: "aggregate" | "multi_system";
  systems: WizardSystemData[];
}

function validateIdentityStep(
  state: WizardValidationState
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.hatcheryName.trim()) {
    errors.hatcheryName = "Company name is required";
  }

  if (!state.fullName.trim()) {
    errors.fullName = "Full name is required";
  }

  if (!state.emailAddress.trim()) {
    errors.emailAddress = "Email address is required";
  } else if (!z.email().safeParse(state.emailAddress).success) {
    errors.emailAddress = "Enter a valid email address";
  }

  if (!state.phoneCountryCode.trim()) {
    errors.phoneCountryCode = "Country code is required";
  }

  if (!state.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required";
  }

  if (!state.location.trim()) {
    errors.location = "Location is required";
  }

  return errors;
}

function validateWaterStep(
  systems: WizardSystemData[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  systems.forEach((system, index) => {
    const prefix = `systems.${index}`;

    if (!WaterSource.safeParse(system.waterSource).success) {
      errors[`${prefix}.waterSource`] = "Select a water source";
    }

    if (!QualityBand.safeParse(system.qualityBand).success) {
      errors[`${prefix}.qualityBand`] = "Select a quality band";
    }

    const salinity = Number.parseFloat(system.salinityPpt);
    if (Number.isNaN(salinity) || salinity < 0 || salinity > 50) {
      errors[`${prefix}.salinityPpt`] = "Must be between 0 and 50";
    }
  });

  return errors;
}

function validateHydraulicsStep(
  systems: WizardSystemData[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  systems.forEach((system, index) => {
    const prefix = `systems.${index}`;
    const volume = Number.parseFloat(system.totalVolumeM3);
    const turnovers = Number.parseFloat(system.turnoversPerDay);
    const hours = Number.parseFloat(system.operatingHoursPerDay);

    if (!system.name.trim()) {
      errors[`${prefix}.name`] = "System name is required";
    }

    if (Number.isNaN(volume) || volume <= 0) {
      errors[`${prefix}.totalVolumeM3`] = "Volume must be a positive number";
    }

    if (
      Number.isNaN(turnovers) ||
      turnovers <= 0 ||
      !Number.isInteger(turnovers)
    ) {
      errors[`${prefix}.turnoversPerDay`] = "Must be a positive integer";
    }

    if (Number.isNaN(hours) || hours < 1 || hours > 24) {
      errors[`${prefix}.operatingHoursPerDay`] = "Must be between 1 and 24";
    }
  });

  return errors;
}

function validateDisinfectionStep(
  systems: WizardSystemData[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  systems.forEach((system, index) => {
    const prefix = `systems.${index}`;

    if (!TargetPathogen.safeParse(system.targetPathogen).success) {
      errors[`${prefix}.targetPathogen`] = "Select a target pathogen";
    }

    if (!Species.safeParse(system.species).success) {
      errors[`${prefix}.species`] = "Select a species";
    }

    if (!SystemType.safeParse(system.systemType).success) {
      errors[`${prefix}.systemType`] = "Select a system type";
    }

    if (system.biomassDODemandM3Hr !== "") {
      const biomass = Number.parseFloat(system.biomassDODemandM3Hr);
      if (Number.isNaN(biomass) || biomass < 0) {
        errors[`${prefix}.biomassDODemandM3Hr`] = "Must be 0 or positive";
      }
    }
  });

  return errors;
}

/**
 * Returns only the errors that belong to a given wizard section.
 */
export function getStepFieldErrors(
  state: WizardValidationState,
  step: number
): Record<string, string> {
  if (step === 1) return validateIdentityStep(state);
  if (step === 2) return validateWaterStep(state.systems);
  if (step === 3) return validateHydraulicsStep(state.systems);
  if (step === 4) return validateDisinfectionStep(state.systems);

  return {
    ...validateIdentityStep(state),
    ...validateWaterStep(state.systems),
    ...validateHydraulicsStep(state.systems),
    ...validateDisinfectionStep(state.systems),
  };
}

/**
 * Checks whether a wizard section is complete enough to advance.
 */
export function isStepValid(
  state: WizardValidationState,
  step: number
): boolean {
  return Object.keys(getStepFieldErrors(state, step)).length === 0;
}

/**
 * Computes the full-field error map used by the shared store.
 */
export function validateWizardState(state: WizardValidationState): {
  fieldErrors: Record<string, string>;
  isValid: boolean;
} {
  const fieldErrors = {
    ...validateIdentityStep(state),
    ...validateWaterStep(state.systems),
    ...validateHydraulicsStep(state.systems),
    ...validateDisinfectionStep(state.systems),
  };

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

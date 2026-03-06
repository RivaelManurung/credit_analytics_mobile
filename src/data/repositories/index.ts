/**
 * Centralized repository instances (singletons).
 * Import repositories from this file instead of instantiating them directly.
 * This prevents multiple instances and ensures consistent state.
 */
import { ApplicationRepositoryImpl } from './ApplicationRepositoryImpl';
import { ApplicantRepositoryImpl } from './ApplicantRepositoryImpl';
import { SurveyRepositoryImpl } from './SurveyRepositoryImpl';

export const applicationRepo = new ApplicationRepositoryImpl();
export const applicantRepo = new ApplicantRepositoryImpl();
export const surveyRepo = new SurveyRepositoryImpl();

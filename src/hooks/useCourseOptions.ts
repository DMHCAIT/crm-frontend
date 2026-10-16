import { useCallback, useEffect, useState } from 'react';
import { ALL_COURSE_OPTIONS } from '../constants/courseOptions';
import { getApiClient } from '../lib/backend';

const CONFIG_ENDPOINT = '/system-config';

const getCoursesFromConfig = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((course): course is string => typeof course === 'string' && course.trim().length > 0);
  }

  if (!value || typeof value !== 'object') return [];

  const config = value as Record<string, unknown>;
  return ['custom', 'fellowship', 'pgDiploma', 'all']
    .flatMap(key => Array.isArray(config[key]) ? config[key] as unknown[] : [])
    .filter((course): course is string => typeof course === 'string' && course.trim().length > 0);
};

const isMissingCourseConfig = (error: unknown): boolean =>
  error instanceof Error && error.message.includes('Configuration key not found');

export const useCourseOptions = () => {
  const [customCourses, setCustomCourses] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const loadCustomCourses = async () => {
      try {
        const response = await getApiClient().get<{
          success: boolean;
          config?: { value?: unknown };
        }>(`${CONFIG_ENDPOINT}?configKey=course_options`);
        if (active) setCustomCourses(getCoursesFromConfig(response.data.config?.value));
      } catch (error) {
        if (isMissingCourseConfig(error)) return;
        console.error('Failed to load saved course options:', error);
      }
    };

    void loadCustomCourses();
    return () => {
      active = false;
    };
  }, []);

  const registerCustomCourse = useCallback(async (course: string) => {
    const normalizedCourse = course.trim();
    if (!normalizedCourse || ALL_COURSE_OPTIONS.includes(normalizedCourse) || customCourses.includes(normalizedCourse)) return;

    const apiClient = getApiClient();
    let existingValue: unknown;
    try {
      const response = await apiClient.get<{
        success: boolean;
        config?: { value?: unknown };
      }>(`${CONFIG_ENDPOINT}?configKey=course_options`);
      existingValue = response.data.config?.value;
    } catch (error) {
      if (!isMissingCourseConfig(error)) throw error;
    }

    const updatedCourses = [...new Set([...getCoursesFromConfig(existingValue), normalizedCourse])];
    const configValue = existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)
      ? { ...(existingValue as Record<string, unknown>), custom: updatedCourses }
      : { custom: updatedCourses };

    const response = await apiClient.post<{ success: boolean }>(CONFIG_ENDPOINT, {
      configKey: 'course_options',
      configValue,
      description: 'Course options available throughout the CRM'
    });
    if (response.data.success === false) {
      throw new Error('The custom course could not be saved to CRM course options.');
    }

    setCustomCourses(updatedCourses);
  }, [customCourses]);

  return { customCourses, registerCustomCourse };
};

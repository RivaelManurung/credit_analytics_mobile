import { useState, useEffect, useCallback } from 'react';
import { ReferenceRepositoryImpl } from '../../data/repositories/ReferenceRepositoryImpl';
import { AttributeCategory, AttributeRegistry } from '../../gen/reference/v1/reference_pb';

const refRepo = new ReferenceRepositoryImpl();

export function useSurveyForm(surveyId: string) {
    const [categories, setCategories] = useState<(AttributeCategory & { totalQuestions: number, completedQuestions: number })[]>([]);
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const data = await refRepo.listAttributeCategories();

                // Map backend categories and still provide mock counts since the backend 
                // might not have these specific counts in reference data yet
                const mappedCats = data.map(cat => ({
                    ...cat,
                    totalQuestions: cat.categoryCode === 'UMUM' ? 5 : (cat.categoryCode === 'ANALISA' ? 8 : 10),
                    completedQuestions: cat.categoryCode === 'UMUM' ? 5 : 0
                } as (AttributeCategory & { totalQuestions: number, completedQuestions: number })));

                setCategories(mappedCats);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load categories'));
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return {
        categories,
        selectedCategoryIndex,
        setSelectedCategoryIndex,
        currentCategory: categories[selectedCategoryIndex],
        loading,
        error,
        jumpToCategory: (index: number) => setSelectedCategoryIndex(index)
    };
}

export function useSurveyQuestions(categoryCode: string) {
    const [questions, setQuestions] = useState<AttributeRegistry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchQuestions = useCallback(async () => {
        if (!categoryCode) return;
        try {
            setLoading(true);
            const data = await refRepo.listAttributeRegistryByCategory(categoryCode);
            setQuestions(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load questions'));
        } finally {
            setLoading(false);
        }
    }, [categoryCode]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return { questions, loading, error, refetch: fetchQuestions };
}

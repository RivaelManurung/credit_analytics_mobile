/**
 * Creates a debounced version of a function.
 * The debounced function delays invoking the provided function
 * until after `delay` milliseconds have elapsed since the last invocation.
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
): T & { cancel: () => void } {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, delay);
    };

    debounced.cancel = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    return debounced as T & { cancel: () => void };
}

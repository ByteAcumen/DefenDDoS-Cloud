
export const hapticFeedback = {
    light: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    },
    medium: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    },
    heavy: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 10, 30]);
    },
    success: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 5, 15]);
    },
    error: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 20, 50, 20, 50]);
    }
};

// Button ripple effect
export function useRipple() {
    const createRipple = (e: React.MouseEvent<HTMLElement>) => {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple-effect');

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    };

    return createRipple;
}

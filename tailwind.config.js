/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    app: 'hsl(220, 20%, 10%)',
                    surface: {
                        1: 'hsl(220, 15%, 14%)',
                        2: 'hsl(220, 15%, 18%)',
                    }
                },
                brand: {
                    primary: 'hsl(215, 90%, 55%)',
                    success: 'hsl(150, 70%, 45%)',
                    warning: 'hsl(35, 90%, 60%)',
                    error: 'hsl(0, 80%, 60%)',
                    info: 'hsl(200, 80%, 55%)',
                },
                luke: {
                    text: {
                        main: 'hsl(0, 0%, 98%)',
                        muted: 'hsl(220, 10%, 70%)',
                        dim: 'hsl(220, 10%, 45%)',
                    }
                },
                glass: {
                    surface: 'hsla(220, 15%, 16%, 0.7)',
                    border: 'hsla(0, 0%, 100%, 0.08)',
                }
            },
            borderRadius: {
                'luke-sm': '6px',
                'luke-md': '10px',
                'luke-lg': '16px',
            },
            fontSize: {
                'luke-4xl': '3rem',
                'luke-3xl': '2rem',
                'luke-2xl': '1.5rem',
                'luke-xl': '1.25rem',
                'luke-lg': '1.125rem',
                'luke-base': '1rem',
                'luke-sm': '0.875rem',
                'luke-xs': '0.75rem',
            }
        },
    },
    plugins: [],
}

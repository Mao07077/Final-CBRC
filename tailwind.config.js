/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0055a4', // accent-medium
          light: '#e6f0ff',   // A lighter shade for backgrounds
          dark: '#003366',    // primary-dark
        },
        secondary: {
          DEFAULT: '#6c757d',
          light: '#f8f9fa',
          dark: '#343a40',
        },
        neutral: {
          100: '#f4f4f4', // light-gray
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#333333', // text-dark
          900: '#212529',
        },
        success: {
          DEFAULT: '#28a745',
          light: '#d4edda',
          dark: '#155724',
        },
        danger: {
          DEFAULT: '#dc3545',
          light: '#f8d7da',
          dark: '#721c24',
        },
        warning: {
          DEFAULT: '#ffc107',
          light: '#fff3cd',
          dark: '#856404',
        },
        // Legacy colors for backwards compatibility during transition
        'primary-dark': '#003366',
        'accent-medium': '#0055a4',
        'light-gray': '#f4f4f4',
        'light-blue': '#f0f8ff',
        'text-dark': '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

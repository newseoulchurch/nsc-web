/** @format */

import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: ['class'],
	content: [
		'./src/app/**/*.{js,ts,jsx,tsx}', // ✅ src/app 폴더 안을 포함
		'./src/components/**/*.{js,ts,jsx,tsx}', // ✅ src/components도 포함
	],
	theme: {
		extend: {
			fontFamily: {
				circular: ['CircularXX', 'sans-serif'],
			},
			colors: {
				black: '#000000',
				white: '#ffffff',
				lightGray: '#8B8B8B',
				gray4: '#707070',
				gray5: '#F3F3F3',
				gray6: '#7C7C7C',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
			},
			fontSize: {
				h1: [
					'42px',
					{
						lineHeight: '1.2',
					},
				],
				h2: [
					'32px',
					{
						lineHeight: '1.3',
					},
				],
				h3: [
					'26px',
					{
						lineHeight: '1.4',
						letterSpacing: '-0.01em',
					},
				],
				div: [
					'15px',
					{
						lineHeight: '1.6',
						letterSpacing: '-0.01em',
					},
				],
				button: [
					'14px',
					{
						lineHeight: '1.6',
						letterSpacing: '-0.01em',
					},
				],
			},
			letterSpacing: {
				tightest: '-0.01em',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};

export default config;

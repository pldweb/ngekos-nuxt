import { definePreset, palette } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// Tema brand NgekosKuy: coklat tua #523724 (primary) + tan #c9af94 (secondary)
const brandSecondary = {
  background: '#c9af94',
  hoverBackground: '#bb9e80',
  activeBackground: '#ad8d6c',
  borderColor: '#c9af94',
  hoverBorderColor: '#bb9e80',
  activeBorderColor: '#ad8d6c',
  color: '#3b2a1b',
  hoverColor: '#3b2a1b',
  activeColor: '#3b2a1b',
  focusRing: { color: '#c9af94', shadow: 'none' },
}

const buttonScheme = {
  root: { secondary: brandSecondary },
  outlined: {
    secondary: { hoverBackground: '#f3ece4', activeBackground: '#e7dbcc', borderColor: '#c9af94', color: '#523724' },
  },
  text: {
    secondary: { hoverBackground: '#f3ece4', activeBackground: '#e7dbcc', color: '#523724' },
  },
}

const NgekosPreset = definePreset(Aura, {
  semantic: {
    primary: palette('#523724'),
    formField: {
      borderRadius: '12px',
    },
  },
  components: {
    button: {
      colorScheme: {
        light: buttonScheme,
        dark: buttonScheme,
      },
    },
  },
})

export default {
  preset: NgekosPreset,
  options: { darkModeSelector: '.dark-mode' },
}

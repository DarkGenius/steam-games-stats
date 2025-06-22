import type { Theme } from '@gravity-ui/uikit/Theme/Theme'

declare module '@gravity-ui/uikit/Theme/Theme' {
  export interface Theme {
    // Здесь можно добавить кастомные темы, если понадобится
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Добавляем поддержку атрибутов для HTML-элементов
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
      // Добавьте другие элементы по необходимости
    }
  }
}

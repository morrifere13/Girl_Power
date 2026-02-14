/**
 * Composant de grille de cases à cocher réutilisable
 * Principe SOLID: Single Responsibility - Affiche uniquement une grille de sélection
 * Principe SOLID: Open/Closed - Extensible via props sans modification
 */
import { Check } from 'lucide-react'

/**
 * @typedef {Object} CheckboxGridProps
 * @property {Array<{id: number|string, label: string}>} items - Éléments à afficher
 * @property {Array<number|string>} selectedIds - IDs sélectionnés
 * @property {(id: number|string) => void} onToggle - Callback de toggle
 * @property {string} [colorScheme='blue'] - Schéma de couleur (blue, orange, green, purple)
 * @property {boolean} [disabled=false]
 * @property {string} [emptyMessage='Aucun élément disponible']
 * @property {number} [columns=2] - Nombre de colonnes (2, 3, 4)
 */

const COLOR_SCHEMES = {
  blue: {
    selected: 'bg-blue-50 border-blue-200',
    checkbox: 'bg-blue-600 border-blue-600',
    text: 'text-blue-900',
    hover: 'hover:border-blue-200'
  },
  orange: {
    selected: 'bg-orange-50 border-orange-200',
    checkbox: 'bg-orange-600 border-orange-600',
    text: 'text-orange-900',
    hover: 'hover:border-orange-200'
  },
  green: {
    selected: 'bg-green-50 border-green-200',
    checkbox: 'bg-green-600 border-green-600',
    text: 'text-green-900',
    hover: 'hover:border-green-200'
  },
  purple: {
    selected: 'bg-purple-50 border-purple-200',
    checkbox: 'bg-purple-600 border-purple-600',
    text: 'text-purple-900',
    hover: 'hover:border-purple-200'
  }
}

const COLUMN_CLASSES = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
}

export default function CheckboxGrid({
  items = [],
  selectedIds = [],
  onToggle,
  colorScheme = 'blue',
  disabled = false,
  emptyMessage = 'Aucun élément disponible',
  columns = 2
}) {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue
  const columnClass = COLUMN_CLASSES[columns] || COLUMN_CLASSES[2]

  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`grid ${columnClass} gap-2`}>
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id)

        return (
          <div
            key={item.id}
            onClick={() => !disabled && onToggle(item.id)}
            className={`
              flex items-center p-2 rounded-lg border cursor-pointer transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isSelected
                ? `${colors.selected} shadow-sm`
                : `bg-white border-gray-200 ${colors.hover}`
              }
            `}
          >
            <div
              className={`
                w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 transition-colors
                ${isSelected
                  ? `${colors.checkbox} text-white`
                  : 'bg-white border-gray-300'
                }
              `}
            >
              {isSelected && <Check size={12} />}
            </div>
            <span
              className={`text-xs font-medium ${isSelected ? colors.text : 'text-gray-700'}`}
            >
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
